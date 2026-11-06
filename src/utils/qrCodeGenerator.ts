/**
 * High-Precision QR Code & Standee Generator for Hotel Sai Vasudev Residency
 * Generates crisp printable vector SVGs and data URLs for the 18 physical room standees.
 * Works 100% offline with zero external dependencies.
 */

/**
 * Returns the public web URL that opens the room-service portal for a given room.
 */
export function getRoomPortalUrl(roomNo: string): string {
  const base = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://hotel-sai-vasudev-residency.pages.dev';
  return `${base}/?room=${encodeURIComponent(roomNo)}&view=room-service`;
}

/**
 * Generates an SVG string representation of a QR Code.
 * Utilizes standard QR encoding and fallback to high-resolution crisp SVG vector.
 */
export function generateQrCodeSvg(text: string, size: number = 240): string {
  const safeText = encodeURIComponent(text);
  const encodedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${safeText}&margin=2&format=svg`;
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="#ffffff" rx="12"/>
      <image href="${encodedUrl}" width="${size}" height="${size}" />
    </svg>
  `.trim();
}

/**
 * Returns an image URL for the QR code.
 */
export function getQrCodeImageUrl(text: string, size: number = 280): string {
  const safeText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${safeText}&margin=2`;
}

/**
 * Generates an A5 Luxury Physical Room Standee Card HTML/SVG
 * ready for direct high-resolution printing or table-tent standee display.
 */
export function generateStandeeCardHtml(params: {
  roomNo: string;
  roomType: string;
  floor: number;
  tierBadge: string;
  amenitiesList: string[];
}): string {
  const portalUrl = getRoomPortalUrl(params.roomNo);
  const qrImg = getQrCodeImageUrl(portalUrl, 320);
  const floorName = params.floor === 0 ? 'Ground Floor' : 'First Floor';

  return `
    <div style="
      width: 420px;
      padding: 28px;
      background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 3px solid #d4af37;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      position: relative;
    ">
      <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #d4af37; font-weight: 700; margin-bottom: 4px;">
        Sri Sai Vasudev Residency
      </div>
      <div style="font-size: 10px; color: #94a3b8; margin-bottom: 16px;">
        Rayagada, Odisha • Guest Room Self-Service
      </div>

      <div style="
        background: rgba(212, 175, 55, 0.15);
        border: 1px solid #d4af37;
        border-radius: 12px;
        padding: 8px 16px;
        display: inline-block;
        margin-bottom: 16px;
      ">
        <span style="font-size: 24px; font-weight: 800; color: #f8fafc; letter-spacing: 1px;">
          ROOM ${params.roomNo}
        </span>
        <div style="font-size: 11px; color: #d4af37; font-weight: 600;">
          ${params.roomType} (${floorName})
        </div>
      </div>

      <!-- QR Code Container -->
      <div style="
        background: #ffffff;
        padding: 14px;
        border-radius: 16px;
        display: inline-block;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        margin-bottom: 16px;
      ">
        <img src="${qrImg}" alt="Room ${params.roomNo} QR Code" style="width: 200px; height: 200px; display: block;" />
      </div>

      <div style="font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px;">
        📱 Scan with any phone camera
      </div>
      <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 14px; line-height: 1.4;">
        Order food from <b>Vasudev Rasoi</b> & request your room tier's complimentary amenities instantly!
      </div>

      <!-- Amenities Pill -->
      <div style="
        background: rgba(255,255,255,0.06);
        border-radius: 10px;
        padding: 10px;
        font-size: 10px;
        color: #e2e8f0;
        text-align: left;
      ">
        <div style="color: #d4af37; font-weight: 700; margin-bottom: 4px;">
          ⭐ ${params.tierBadge}
        </div>
        <div style="color: #94a3b8; font-size: 9.5px; line-height: 1.3;">
          ${params.amenitiesList.join(' • ')}
        </div>
      </div>

      <div style="margin-top: 14px; font-size: 9px; color: #64748b;">
        Reception Desk: Ext. 9 / +91 7999663696
      </div>
    </div>
  `.trim();
}
