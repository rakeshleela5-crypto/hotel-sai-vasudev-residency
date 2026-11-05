/**
 * Validation and Date Utilities for SRI SAI VASUDEV RESIDENCY
 * Strictly compliant with IST timezone, Indian mobile number formats, and hotel math.
 */

export const getTodayIST = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if Intl timeZone is not supported
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (330 * 60000)); // +5:30
    const y = istTime.getFullYear();
    const m = String(istTime.getMonth() + 1).padStart(2, '0');
    const d = String(istTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return getTodayIST();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const nextY = date.getUTCFullYear();
  const nextM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextD = String(date.getUTCDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
};

export const calculateNights = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 1;
  const [y1, m1, d1] = checkIn.split('-').map(Number);
  const [y2, m2, d2] = checkOut.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

export const validateIndianPhone = (phone: string): { isValid: boolean; sanitized: string; error?: string } => {
  let cleaned = phone.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  if (!cleaned) {
    return { isValid: false, sanitized: cleaned, error: 'Mobile number is required' };
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return { 
      isValid: false, 
      sanitized: cleaned, 
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9440289999)' 
    };
  }

  return { isValid: true, sanitized: cleaned };
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};
