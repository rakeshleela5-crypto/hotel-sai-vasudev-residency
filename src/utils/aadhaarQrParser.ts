/**
 * Aadhaar Card 2D Scanner & QR Code Parser for Hotel Sai Vasudev Residency
 * High-speed client-side parser supporting:
 * 1. Standard UIDAI XML format from physical PVC/paper cards:
 *    <PrintLetterBarcodeData uid="..." name="..." gender="..." yob="..." ... />
 * 2. Modern 2048-bit digital signature QR barcodes (UIDAI Secure QR):
 *    BigInteger compressed byte streams (GZIP / Deflate with 0xFF byte delimiter)
 * 3. Key-Value text from mobile scanner apps / test cards
 * 4. Delimited text format (comma, pipe, or newline separated)
 * 5. Automatic Age calculation from DOB/YOB
 * 6. Masked UID generation (e.g. XXXXXXXX1234)
 */

export interface ParsedAadhaarData {
  isValid: boolean;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  yob?: string;
  age: number;
  uid?: string;
  maskedUid: string;
  careOf?: string;
  house?: string;
  street?: string;
  landmark?: string;
  villageTownCity?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  postOffice?: string;
  district?: string;
  state: string;
  pincode: string;
  fullAddress: string;
  rawText: string;
}

export type AadhaarParsedData = ParsedAadhaarData;

function bigIntToBytes(bigIntStr: string): Uint8Array {
  try {
    const bigInt = BigInt(bigIntStr);
    let hex = bigInt.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

async function decompressGzipOrDeflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (bytes.length < 2) return null;
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const formats: ('gzip' | 'deflate' | 'deflate-raw')[] = isGzip
    ? ['gzip', 'deflate', 'deflate-raw']
    : ['deflate', 'gzip', 'deflate-raw'];

  for (const fmt of formats) {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream(fmt);
        const writer = ds.writable.getWriter();
        writer.write(bytes as any);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let totalLen = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            totalLen += value.byteLength;
          }
        }
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.byteLength;
        }
        if (result.length > 0) return result;
      }
    } catch {
      // Continue to next format
    }
  }
  return null;
}

function parseDecompressedAadhaarBytes(decompressed: Uint8Array, rawInput: string): ParsedAadhaarData {
  const result: ParsedAadhaarData = {
    isValid: false,
    name: '',
    gender: 'Male',
    age: 30,
    maskedUid: 'XXXXXXXX1234',
    state: 'Odisha',
    pincode: '765001',
    fullAddress: '',
    rawText: rawInput
  };

  // Modern UIDAI Secure QR byte stream separates fields with 255 (0xFF)
  const parts: Uint8Array[] = [];
  let start = 0;
  for (let i = 0; i < decompressed.length; i++) {
    if (decompressed[i] === 255) {
      parts.push(decompressed.subarray(start, i));
      start = i + 1;
    }
  }
  if (start < decompressed.length) {
    parts.push(decompressed.subarray(start));
  }

  const decoder = new TextDecoder('utf-8');
  const textParts = parts.map(p => {
    try {
      return decoder.decode(p).trim();
    } catch {
      return '';
    }
  });

  if (textParts.length >= 3) {
    // V2 specification indices:
    // 0: email/mobile presence, 1: ref ID (starts with last 4 digits of Aadhaar), 2: Name, 3: DOB, 4: Gender,
    // 5: Care of, 6: District, 7: Landmark, 8: House, 9: Location, 10: Pin, 11: PO, 12: State, 13: Street, 14: Sub-dist, 15: VTC
    const refId = textParts[1] || '';
    result.name = textParts[2] || '';
    result.dob = textParts[3] || undefined;
    const g = (textParts[4] || 'M').toUpperCase();
    result.gender = (g === 'F' || g === 'FEMALE') ? 'Female' : 'Male';
    result.careOf = textParts[5] || undefined;
    result.district = textParts[6] || undefined;
    result.landmark = textParts[7] || undefined;
    result.house = textParts[8] || undefined;
    const location = textParts[9] || undefined;
    result.pincode = textParts[10] || '765001';
    result.postOffice = textParts[11] || undefined;
    result.state = textParts[12] || 'Odisha';
    result.street = textParts[13] || undefined;
    result.villageTownCity = textParts[15] || textParts[14] || 'Rayagada';
    result.city = result.villageTownCity;

    if (refId.length >= 4) {
      const last4 = refId.substring(0, 4);
      result.maskedUid = `XXXXXXXX${last4}`;
    }

    if (result.dob) {
      const yrMatch = result.dob.match(/(\d{4})/);
      if (yrMatch) {
        result.yob = yrMatch[1];
        result.age = Math.max(18, new Date().getFullYear() - Number(yrMatch[1]));
      }
    }

    result.addressLine1 = [result.house, result.street].filter(Boolean).join(', ') || location || '';
    result.addressLine2 = [result.landmark, result.careOf].filter(Boolean).join(', ') || '';

    const addrParts = [
      result.careOf,
      result.house,
      result.street,
      result.landmark,
      location,
      result.villageTownCity,
      result.district,
      result.state,
      result.pincode
    ].filter(Boolean);

    result.fullAddress = addrParts.join(', ');
    result.isValid = Boolean(result.name && result.name.length >= 2);
  }

  return result;
}

export function parseAadhaarQrCode(rawInput: string): ParsedAadhaarData {
  const result: ParsedAadhaarData = {
    isValid: false,
    name: '',
    gender: 'Male',
    age: 30,
    maskedUid: 'XXXXXXXX1234',
    state: 'Odisha',
    pincode: '765001',
    fullAddress: '',
    rawText: rawInput || ''
  };

  if (!rawInput || typeof rawInput !== 'string') {
    return result;
  }

  const clean = rawInput.trim();

  // =========================================================================
  // 1. STANDARD UIDAI XML BARCODE DATA
  // Format: <PrintLetterBarcodeData uid="1234" name="..." gender="M" ... />
  // =========================================================================
  if (clean.includes('<PrintLetterBarcodeData') || clean.includes('<?xml')) {
    try {
      let xmlStr = clean;
      const startIdx = clean.indexOf('<PrintLetterBarcodeData');
      const endIdx = clean.indexOf('/>', startIdx);
      if (startIdx >= 0 && endIdx >= 0) {
        xmlStr = clean.substring(startIdx, endIdx + 2);
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      const root = xmlDoc.getElementsByTagName('PrintLetterBarcodeData')[0];

      if (root) {
        result.name = root.getAttribute('name') || '';
        const rawUid = root.getAttribute('uid') || '';
        result.uid = rawUid;
        result.maskedUid = rawUid.length >= 4 
          ? `XXXXXXXX${rawUid.slice(-4)}` 
          : (rawUid ? `XXXXXXXX${rawUid}` : 'XXXXXXXX1234');

        const g = (root.getAttribute('gender') || 'M').toUpperCase();
        result.gender = (g === 'F' || g === 'FEMALE') ? 'Female' : 'Male';

        result.yob = root.getAttribute('yob') || undefined;
        result.dob = root.getAttribute('dob') || undefined;

        if (result.yob && !isNaN(Number(result.yob))) {
          result.age = Math.max(18, new Date().getFullYear() - Number(result.yob));
        } else if (result.dob) {
          const yearMatch = result.dob.match(/(\d{4})/);
          if (yearMatch) {
            result.age = Math.max(18, new Date().getFullYear() - Number(yearMatch[1]));
          }
        }

        result.careOf = root.getAttribute('co') || undefined;
        result.house = root.getAttribute('house') || undefined;
        result.street = root.getAttribute('street') || undefined;
        result.landmark = root.getAttribute('lm') || undefined;
        result.villageTownCity = root.getAttribute('vtc') || root.getAttribute('po') || 'Rayagada';
        result.city = result.villageTownCity;
        result.postOffice = root.getAttribute('po') || undefined;
        result.district = root.getAttribute('dist') || 'Rayagada';
        result.state = root.getAttribute('state') || 'Odisha';
        result.pincode = root.getAttribute('pc') || '765001';

        result.addressLine1 = [result.house, result.street].filter(Boolean).join(', ') || result.landmark || '';
        result.addressLine2 = [result.landmark, result.careOf].filter(Boolean).join(', ') || '';

        const addrParts = [
          result.careOf,
          result.house,
          result.street,
          result.landmark,
          result.villageTownCity,
          result.district,
          result.state,
          result.pincode
        ].filter(Boolean);

        result.fullAddress = addrParts.join(', ');
        result.isValid = Boolean(result.name && result.name.length >= 2);
        return result;
      }
    } catch {
      // Fall through to regex-based fallback
    }
  }

  // =========================================================================
  // 2. REGEX EXTRACTION (Key-Value / Pipe / Test Card Formats)
  // =========================================================================
  const nameMatch = clean.match(/(?:Name|Guest)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (nameMatch) result.name = nameMatch[1].trim();

  const genderMatch = clean.match(/(?:Gender|Sex)\s*[:=\-]\s*([MFmaleFEMALE]+)/i);
  if (genderMatch) {
    const g = genderMatch[1].trim().toUpperCase();
    result.gender = g.startsWith('F') ? 'Female' : 'Male';
  }

  const dobMatch = clean.match(/(?:DOB|Date of Birth)\s*[:=\-]\s*([\d\/\.\-]+)/i);
  if (dobMatch) result.dob = dobMatch[1].trim();

  const yobMatch = clean.match(/(?:YOB|Year of Birth)\s*[:=\-]\s*(\d{4})/i);
  if (yobMatch) result.yob = yobMatch[1].trim();

  const uidMatch = clean.match(/(?:UID|Aadhaar(?: No)?)\s*[:=\-]\s*([\d\s]{12,16})/i) || clean.match(/(\d{4}\s\d{4}\s\d{4})/);
  if (uidMatch) {
    const rawUid = uidMatch[1].replace(/\s+/g, '');
    result.uid = rawUid;
    result.maskedUid = rawUid.length >= 4 ? `XXXXXXXX${rawUid.slice(-4)}` : 'XXXXXXXX1234';
  }

  const pinMatch = clean.match(/(?:Pin|Pincode|Postal Code)\s*[:=\-]?\s*(\d{6})/i) || clean.match(/\b([1-9]\d{5})\b/);
  if (pinMatch) result.pincode = pinMatch[1].trim();

  const stateMatch = clean.match(/(?:State)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (stateMatch) result.state = stateMatch[1].trim();

  const cityMatch = clean.match(/(?:City|VTC|Town|Dist)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (cityMatch) result.villageTownCity = cityMatch[1].trim();

  const addrMatch = clean.match(/(?:Address)\s*[:=\-]\s*([^\n\r;]+)/i);
  if (addrMatch) {
    result.fullAddress = addrMatch[1].trim();
  }

  // Calculate age
  if (result.yob && !isNaN(Number(result.yob))) {
    result.age = Math.max(18, new Date().getFullYear() - Number(result.yob));
  } else if (result.dob) {
    const yr = result.dob.match(/(\d{4})/);
    if (yr) {
      result.age = Math.max(18, new Date().getFullYear() - Number(yr[1]));
    }
  }

  // Fallback for simple line-by-line text
  if (!result.name) {
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0].length >= 3 && !lines[0].includes('=')) {
      result.name = lines[0];
      if (lines.length > 1) {
        result.fullAddress = lines.slice(1).join(', ');
      }
    }
  }

  if (!result.fullAddress && (result.villageTownCity || result.state || result.pincode)) {
    result.fullAddress = [result.villageTownCity || 'Rayagada', result.state || 'Odisha', result.pincode || '765001'].filter(Boolean).join(', ');
  }

  result.city = result.city || result.villageTownCity || 'Rayagada';
  if (!result.addressLine1 && result.fullAddress) {
    result.addressLine1 = result.fullAddress.split(',')[0] || '';
  }

  result.isValid = Boolean(result.name && result.name.length >= 2);
  return result;
}

/**
 * Modern UIDAI 2048-bit digital signature QR parser with DecompressionStream support
 */
export async function parseAadhaarQrCodeAsync(rawInput: string): Promise<ParsedAadhaarData> {
  if (!rawInput || typeof rawInput !== 'string') {
    return parseAadhaarQrCode(rawInput);
  }

  const clean = rawInput.trim();

  // If input is a BigInteger numeric stream (UIDAI Secure QR standard)
  if (/^\d{200,}$/.test(clean)) {
    try {
      const bytes = bigIntToBytes(clean);
      if (bytes.length > 0) {
        const decompressed = await decompressGzipOrDeflate(bytes);
        if (decompressed && decompressed.length > 0) {
          const parsed = parseDecompressedAadhaarBytes(decompressed, clean);
          if (parsed.isValid) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to standard parser
    }
  }

  return parseAadhaarQrCode(rawInput);
}
