import React, { useRef, useState, useEffect } from 'react';

interface DigitalSignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  initialSignature?: string | null;
  guestName?: string;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Digital Guest Signature (KYC)',
  initialSignature = null,
  guestName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>(guestName || '');
  const [hasInk, setHasInk] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number; p: number } | null>(null);

  const INK_COLOR = '#0f172a'; // Deep slate ink

  // Canvas trimmer: removes excess transparent margins (benchmarked from ~/everything/src/signatures)
  const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const { width, height } = canvas;
    if (!width || !height) return canvas;

    const imgData = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = imgData[(y * width + x) * 4 + 3];
        if (alpha > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) return canvas; // Empty canvas

    const padding = 12;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const outWidth = maxX - minX + 1;
    const outHeight = maxY - minY + 1;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;

    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      outCtx.drawImage(canvas, minX, minY, outWidth, outHeight, 0, 0, outWidth, outHeight);
    }
    return outCanvas;
  };

  // Convert typed name to cursive data URL fallback
  const renderTypedToDataUrl = (text: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const font = 'italic 52px "Brush Script MT", "Snell Roundhand", "Segoe Script", cursive';
    ctx.font = font;
    const textWidth = Math.ceil(ctx.measureText(text || 'Guest Signature').width);

    canvas.width = Math.min(1000, textWidth + 48);
    canvas.height = 140;

    const ctx2 = canvas.getContext('2d');
    if (!ctx2) return '';
    ctx2.font = font;
    ctx2.fillStyle = INK_COLOR;
    ctx2.textBaseline = 'middle';

    const scale = Math.min(1, (canvas.width - 32) / Math.max(1, textWidth));
    ctx2.setTransform(scale, 0, 0, scale, 24, canvas.height / 2);
    ctx2.fillText(text || 'Guest Signature', 0, 0);

    return trimCanvas(canvas).toDataURL('image/png');
  };

  // Setup canvas resolution scaling for high-DPI tablets & retina screens
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const w = rect.width || 460;
    const h = rect.height || 180;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK_COLOR;
      ctx.fillStyle = INK_COLOR;
      ctx.lineWidth = 2.5;
    }
    setHasInk(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(() => initCanvas(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  // Pointer event handlers with Pointer Capture (seamless tablet stylus/touch tracking)
  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, p: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      p: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    setIsDrawing(true);
    const pos = getPointerPos(e);
    lastPointRef.current = pos;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Paint single dot so quick taps (e.g. i-dots) are registered
      ctx.beginPath();
      const dotRadius = Math.max(1.2, 1.2 + pos.p * 1.8);
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      setHasInk(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const current = getPointerPos(e);
    const last = lastPointRef.current;

    // Smooth quadratic curve midpoint interpolation
    const midX = (last.x + current.x) / 2;
    const midY = (last.y + current.y) / 2;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineWidth = Math.max(1.8, 1.8 + current.p * 2.2);
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = current;
    if (!hasInk) setHasInk(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) {
        alert('Please draw your signature before saving, or use the Type tab.');
        return;
      }
      const trimmed = trimCanvas(canvas);
      const dataUrl = trimmed.toDataURL('image/png');
      onSave(dataUrl);
      onClose();
    } else {
      if (!typedName.trim()) {
        alert('Please enter your full name to generate a signature.');
        return;
      }
      const dataUrl = renderTypedToDataUrl(typedName.trim());
      onSave(dataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: 520,
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✍️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                Section 43A IT Act & Rayagada Police Compliant Digital GRC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Draw vs Type */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '6px 16px 0 16px',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: activeTab === 'draw' ? 600 : 500,
              color: activeTab === 'draw' ? '#0284c7' : '#64748b',
              background: activeTab === 'draw' ? '#ffffff' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'draw' ? '#cbd5e1 #cbd5e1 #ffffff #cbd5e1' : 'transparent',
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            ✏️ Touch / Stylus Draw
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: activeTab === 'type' ? 600 : 500,
              color: activeTab === 'type' ? '#0284c7' : '#64748b',
              background: activeTab === 'type' ? '#ffffff' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'type' ? '#cbd5e1 #cbd5e1 #ffffff #cbd5e1' : 'transparent',
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            ⌨️ Type Signature
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: 18 }}>
          {activeTab === 'draw' ? (
            <div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 190,
                  backgroundColor: '#fcfdfd',
                  border: '1.5px dashed #94a3b8',
                  borderRadius: 8,
                  touchAction: 'none',
                  overflow: 'hidden',
                  cursor: 'crosshair',
                }}
              >
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  }}
                />

                {/* Signature baseline guide */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 35,
                    left: 20,
                    right: 20,
                    height: 1,
                    backgroundColor: '#cbd5e1',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 24,
                    fontSize: 10,
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
                  Sign on tablet screen or with mouse/stylus above line
                </div>

                {/* Clear Eraser button */}
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear signature"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '4px 8px',
                    fontSize: 11,
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  🧹 Clear
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Guest Legal Name for Signature:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder="e.g. Ramesh Chandra Patnaik"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  boxSizing: 'border-box',
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  height: 110,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Brush Script MT", "Snell Roundhand", cursive',
                  fontSize: 32,
                  color: INK_COLOR,
                  fontStyle: 'italic',
                }}
              >
                {typedName || 'Guest Signature Preview'}
              </div>
            </div>
          )}

          {initialSignature && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>ℹ️</span> A digital signature is already on record for this reservation. Saving will overwrite it.
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 500,
              color: '#475569',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={activeTab === 'draw' && !hasInk && !initialSignature}
            style={{
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: (activeTab === 'draw' && !hasInk && !initialSignature) ? '#94a3b8' : '#0284c7',
              border: 'none',
              borderRadius: 6,
              cursor: (activeTab === 'draw' && !hasInk && !initialSignature) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>💾</span> Attach Signature to GRC
          </button>
        </div>
      </div>
    </div>
  );
};

