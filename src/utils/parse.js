/**
 * Các hàm parse dữ liệu thô (từ Google Sheet / input người dùng).
 * Hàm thuần — không phụ thuộc DOM.
 */

export function cleanCell(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** Chuẩn hóa tiêu đề cột: chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng. */
export function normalizeHeader(value) {
  return cleanCell(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse số từ chuỗi có thể chứa dấu phân cách hàng nghìn / thập phân
 * theo kiểu VN (1.234,5) hoặc US (1,234.5). Trả về null nếu không parse được.
 */
export function parseOptionalNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = cleanCell(value);
  if (!text || text === '-') return null;

  const normalizedText = text
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');

  if (!normalizedText) return null;

  const lastComma = normalizedText.lastIndexOf(',');
  const lastDot = normalizedText.lastIndexOf('.');
  let numericText = normalizedText;

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    numericText = normalizedText
      .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (lastComma > -1) {
    numericText = normalizeSingleSeparatorNumber(normalizedText, ',');
  } else if (lastDot > -1) {
    numericText = normalizeSingleSeparatorNumber(normalizedText, '.');
  }

  const number = Number(numericText);
  return Number.isFinite(number) ? number : null;
}

function normalizeSingleSeparatorNumber(value, separator) {
  const parts = value.split(separator);

  if (parts.length > 2 || parts.at(-1).length === 3) {
    return parts.join('');
  }

  if (separator === ',') {
    return value.replace(',', '.');
  }

  return value;
}

/** Lấy số nguyên từ chuỗi bằng cách bỏ mọi ký tự không phải chữ số. Mặc định 0. */
export function parseDigits(value) {
  if (!value) return 0;
  const parsed = parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

