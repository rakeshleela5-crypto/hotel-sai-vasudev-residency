import React, { useState, useEffect, useRef } from 'react';
import { R2StorageClient, type R2FileItem, type R2StatusResponse, type R2TestConnectionResponse, type R2Folder } from '../../services/r2Storage';
import './pmsStyles.css';

interface CloudflareR2StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFolder?: R2Folder | 'all';
}

export const CloudflareR2StorageModal: React.FC<CloudflareR2StorageModalProps> = ({
  isOpen,
  onClose,
  initialFolder = 'all'
}) => {
  const [selectedFolder, setSelectedFolder] = useState<R2Folder | 'all'>(initialFolder);
  const [files, setFiles] = useState<R2FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusInfo, setStatusInfo] = useState<R2StatusResponse | null>(null);
  const [testResult, setTestResult] = useState<R2TestConnectionResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Upload state
  const [uploadFolder, setUploadFolder] = useState<R2Folder>('rooms');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preview lightbox
  const [previewFile, setPreviewFile] = useState<R2FileItem | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const fetchStatusAndFiles = async () => {
    setIsLoading(true);
    try {
      const [status, fileList] = await Promise.all([
        R2StorageClient.getStatus(),
        R2StorageClient.listFiles(selectedFolder === 'all' ? undefined : selectedFolder)
      ]);
      setStatusInfo(status);
      setFiles(fileList);
    } catch (err: unknown) {
      console.warn('Error fetching R2 status/files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    if (isOpen) {
      const load = async () => {
        try {
          setIsLoading(true);
          const [status, fileList] = await Promise.all([
            R2StorageClient.getStatus(),
            R2StorageClient.listFiles(selectedFolder === 'all' ? undefined : selectedFolder)
          ]);
          if (isSubscribed) {
            setStatusInfo(status);
            setFiles(fileList);
          }
        } catch (err: unknown) {
          console.warn('Error fetching R2 status/files:', err);
        } finally {
          if (isSubscribed) {
            setIsLoading(false);
          }
        }
      };
      load();
    }
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, selectedFolder]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await R2StorageClient.testConnection();
      setTestResult(res);
      const status = await R2StorageClient.getStatus();
      setStatusInfo(status);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setTestResult({
        success: false,
        storage: 'Error',
        connected: false,
        message: msg,
        latency_ms: 0
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setIsUploading(true);
    setUploadProgress(10);
    setUploadMessage(null);

    try {
      const res = await R2StorageClient.uploadFile(file, {
        folder: uploadFolder,
        onProgress: (pct) => setUploadProgress(pct)
      });

      setUploadMessage({
        type: 'success',
        text: `✓ File '${file.name}' (${(file.size / 1024).toFixed(1)} KB) successfully stored in Cloudflare R2 [${res.storage}]`
      });

      // Refresh file list
      await fetchStatusAndFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadMessage({
        type: 'error',
        text: `❌ Upload failed: ${msg}`
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (item: R2FileItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${item.filename}' from Cloudflare R2?`)) {
      return;
    }

    try {
      await R2StorageClient.deleteFile(item.object_key);
      setFiles(prev => prev.filter(f => f.object_key !== item.object_key));
      setCopyToast(`Deleted '${item.filename}'`);
      setTimeout(() => setCopyToast(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to delete object: ${msg}`);
    }
  };

  const handleCopyUrl = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopyToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleCopyPresignedDownload = async (item: R2FileItem) => {
    try {
      const downloadUrl = await R2StorageClient.getPresignedDownloadUrl(item.object_key, 3600);
      navigator.clipboard.writeText(downloadUrl);
      setCopyToast(`Secure Pre-signed URL (Valid 1 Hr) copied!`);
      setTimeout(() => setCopyToast(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error creating presigned URL: ${msg}`);
    }
  };

  const filteredFiles = files.filter(f => {
    const q = searchQuery.toLowerCase();
    return f.filename.toLowerCase().includes(q) || f.object_key.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q);
  });

  const totalBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

  const FOLDER_TABS: { key: R2Folder | 'all'; label: string; icon: string }[] = [
    { key: 'all', label: 'All Files', icon: '📁' },
    { key: 'rooms', label: 'Property & Rooms', icon: '🛏️' },
    { key: 'kyc', label: 'Guest KYC & Aadhaar', icon: '🪪' },
    { key: 'invoices', label: 'GST Tax Invoices', icon: '🧾' },
    { key: 'guest_ids', label: 'Legacy Guest IDs', icon: '📎' },
    { key: 'branding', label: 'Company Branding', icon: '🎨' },
    { key: 'documents', label: 'Documents & Folios', icon: '📄' },
    { key: 'backups', label: 'Database Backups', icon: '💾' }
  ];

  return (
    <div className="pms-overlay" onClick={onClose} style={{ zIndex: 10010 }}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: 1100,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          borderRadius: 8,
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28, background: '#f97316', width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ☁️
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>
                  Cloudflare R2 Object Storage
                </h2>
                <span style={{ background: '#f97316', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                  S3 Compatible
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                Secure, zero-egress cloud asset storage for Hotel Sai Vasudev Residency (Shirdi)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              style={{
                background: '#334155',
                color: '#e2e8f0',
                border: '1px solid #475569',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                cursor: isTesting ? 'wait' : 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{isTesting ? '🔄 Pinging...' : '⚡ Test Connection'}</span>
            </button>
            <button
              id="r2-modal-close-btn"
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 22, cursor: 'pointer', padding: '0 6px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Copy Notification Toast */}
        {copyToast && (
          <div style={{ background: '#0284c7', color: '#fff', padding: '8px 16px', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
            {copyToast}
          </div>
        )}

        {/* Connection status banner */}
        {testResult && (
          <div style={{ background: testResult.success ? '#ecfdf5' : '#fef2f2', color: testResult.success ? '#065f46' : '#991b1b', borderBottom: `1px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`, padding: '8px 20px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {testResult.success ? '✅' : '❌'} {testResult.message} {testResult.latency_ms > 0 && `(${testResult.latency_ms}ms)`}
            </span>
            <button type="button" onClick={() => setTestResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Storage Metric Cards */}
        <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Operating Mode</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: statusInfo?.configured ? '#047857' : '#b45309', marginTop: 2 }}>
              {statusInfo?.configured ? '🟢 Cloudflare R2 Active' : '🟡 Local Disk Fallback'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {statusInfo?.configured ? 'S3v4 Signature Direct' : 'Set R2_* env to activate'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Target Bucket</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>
              {statusInfo?.bucket_name || 'hotel-sai-vasudev-documents'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Account: {statusInfo?.account_id_masked || 'Not Set'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Uploaded Assets</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
              {files.length} Objects
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Across {statusInfo?.allowed_folders?.length || 6} secure folders
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Storage Used</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed', marginTop: 2 }}>
              {totalMb} MB
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Zero egress fee on Cloudflare
            </div>
          </div>
        </div>

        {/* Upload Zone matching Video 08 & Video 26 File Specifications */}
        <div style={{ padding: '14px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 220 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Target Folder
              </label>
              <select
                id="r2-upload-folder-select"
                value={uploadFolder}
                onChange={e => setUploadFolder(e.target.value as R2Folder)}
                className="form-select-pms"
                style={{ width: '100%', fontWeight: 700, background: '#fff' }}
              >
                <option value="rooms">🛏️ rooms (Property & Room Photos - Public)</option>
                <option value="kyc">🪪 kyc (Guest Aadhaar / KYC Documents - Private)</option>
                <option value="invoices">🧾 invoices (GST Tax Invoices - Private)</option>
                <option value="guest_ids">📎 guest_ids (Legacy ID Proofs)</option>
                <option value="branding">🎨 branding (Logo, Seals, Signatures)</option>
                <option value="documents">📄 documents (Folios & Bills)</option>
                <option value="backups">💾 backups (Database Exports)</option>
              </select>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                border: isDragOver ? '2px dashed #f97316' : '2px dashed #94a3b8',
                background: isDragOver ? '#fff7ed' : '#ffffff',
                borderRadius: 6,
                padding: '12px 18px',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                id="r2-file-input"
                ref={fileInputRef}
                type="file"
                disabled={isUploading}
                accept="image/*,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e.target.files)}
              />
              {isUploading ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>
                    ⏳ Uploading directly to Cloudflare R2 ({uploadProgress}%)...
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#fed7aa', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#ea580c', transition: 'width 0.2s' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📤</span>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Drag &amp; drop file here, or click to browse
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>
                      Supports: JPG, PNG, WEBP, SVG, PDF, CSV, Excel &bull; Max 25 MB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {uploadMessage && (
            <div style={{
              marginTop: 10,
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              background: uploadMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: uploadMessage.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${uploadMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
            }}>
              {uploadMessage.text}
            </div>
          )}
        </div>

        {/* Filter Tabs & Search Bar */}
        <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {FOLDER_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFolder(tab.key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: selectedFolder === tab.key ? '#f97316' : '#cbd5e1',
                  background: selectedFolder === tab.key ? '#fff7ed' : '#ffffff',
                  color: selectedFolder === tab.key ? '#ea580c' : '#475569',
                  fontSize: 12,
                  fontWeight: selectedFolder === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="Search file name or key..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px 5px 28px',
                fontSize: 12,
                border: '1px solid #cbd5e1',
                borderRadius: 4
              }}
            />
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Files Data Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', background: '#fff' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div>Loading Cloudflare R2 assets...</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>📭</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>No files found</div>
              <p style={{ fontSize: 12, margin: '4px 0 0' }}>
                {searchQuery ? `No matches for '${searchQuery}'.` : `No files in folder '${selectedFolder}'. Upload a file above.`}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', width: 60 }}>Preview</th>
                  <th style={{ padding: '8px 10px' }}>File Name / Object Key</th>
                  <th style={{ padding: '8px 10px', width: 100 }}>Category</th>
                  <th style={{ padding: '8px 10px', width: 90 }}>Size</th>
                  <th style={{ padding: '8px 10px', width: 130 }}>Uploaded</th>
                  <th style={{ padding: '8px 10px', width: 180, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => {
                  const isImage = /\.(jpe?g|png|webp|svg|gif)$/i.test(file.filename);
                  const isPdf = /\.pdf$/i.test(file.filename);

                  return (
                    <tr
                      key={file.object_key || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#fff' : '#fafafa'
                      }}
                    >
                      {/* Thumbnail Preview */}
                      <td style={{ padding: '6px 10px' }}>
                        <div
                          onClick={() => setPreviewFile(file)}
                          title="Click to view full preview"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: '#f1f5f9'
                          }}
                        >
                          {isImage ? (
                            <img src={file.url} alt={file.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : isPdf ? (
                            <span style={{ fontSize: 20 }}>📕</span>
                          ) : (
                            <span style={{ fontSize: 18 }}>📄</span>
                          )}
                        </div>
                      </td>

                      {/* Name & Key */}
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{file.filename}</div>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                          {file.object_key}
                        </div>
                      </td>

                      {/* Folder Badge */}
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                          {file.folder}
                        </span>
                      </td>

                      {/* Size */}
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>
                        {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(1)} KB` : 'N/A'}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '6px 10px', color: '#64748b', fontSize: 11 }}>
                        {file.last_modified ? new Date(file.last_modified).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            title="Preview file"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
                          >
                            👁️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(file.url, 'Public R2 URL')}
                            title="Copy Direct URL"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
                          >
                            📋 URL
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPresignedDownload(file)}
                            title="Copy Secure Pre-signed Link (1 hour validity)"
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
                          >
                            🔒 Signed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            title="Delete file permanently"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Info Bar */}
        <div style={{ background: '#f8fafc', padding: '10px 20px', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Showing {filteredFiles.length} of {files.length} objects &bull; Cloudflare R2 Storage Bucket
          </div>
          <div>
            HOTEL SAI VASUDEV RESIDENCY &bull; SHIRDI PMS STORAGE ENGINE
          </div>
        </div>
      </div>

      {/* Lightbox / Full Document Preview Modal */}
      {previewFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10020,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{previewFile.filename}</h4>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{previewFile.object_key}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: 4, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
                >
                  ↗ Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', minHeight: 300 }}>
              {/\.(jpe?g|png|webp|svg|gif)$/i.test(previewFile.filename) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
                />
              ) : /\.pdf$/i.test(previewFile.filename) ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.filename}
                  style={{ width: '80vw', height: '70vh', border: 'none' }}
                />
              ) : (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <span style={{ fontSize: 48 }}>📄</span>
                  <p style={{ marginTop: 12, fontSize: 14, color: '#334155' }}>
                    Preview not available directly in browser for this file type.
                  </p>
                  <a
                    href={previewFile.url}
                    download
                    style={{ display: 'inline-block', marginTop: 8, background: '#0284c7', color: '#fff', padding: '6px 14px', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}
                  >
                    ⬇ Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
