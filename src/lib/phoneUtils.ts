/**
 * Utility functions for Russian phone numbers (+7 XXX XXX-XX-XX)
 */

export function extractRussianPhoneDigits(value: string): string {
  if (!value) return '';
  // Extract all digits
  let d = value.replace(/\D/g, '');

  // If user pasted or typed full number starting with 7 or 8:
  // e.g. "89161234567" (11 digits) -> strip first digit -> "9161234567"
  // or "+79161234567" (11 digits) -> strip first digit -> "9161234567"
  if (d.length > 10 && (d.startsWith('7') || d.startsWith('8'))) {
    d = d.slice(1);
  } else if (d.startsWith('7')) {
    // Input starts with 7 from the "+7" prefix
    d = d.slice(1);
  } else if (d.startsWith('8') && d.length > 1) {
    d = d.slice(1);
  }

  // Strictly up to 10 digits
  return d.slice(0, 10);
}

export function formatRussianPhone(digits: string): string {
  if (!digits || digits.length === 0) {
    return '+7 ';
  }
  let res = '+7 (';
  res += digits.slice(0, 3);
  if (digits.length >= 3) {
    res += ') ';
  }
  if (digits.length > 3) {
    res += digits.slice(3, 6);
  }
  if (digits.length >= 6) {
    res += '-';
  }
  if (digits.length > 6) {
    res += digits.slice(6, 8);
  }
  if (digits.length >= 8) {
    res += '-';
  }
  if (digits.length > 8) {
    res += digits.slice(8, 10);
  }
  return res;
}

export function isRussianPhoneValid(digits: string): boolean {
  return digits.length === 10;
}
