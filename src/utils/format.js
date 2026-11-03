/**
 * Các hàm định dạng hiển thị. Hàm thuần — không phụ thuộc DOM.
 */

const LOCALE = 'vi-VN';

/** Số tiền làm tròn, phân cách hàng nghìn kiểu VN (không kèm ký hiệu ₫). */
export function formatCurrency(value) {
  return Math.round(value).toLocaleString(LOCALE);
}

/** Số lượng (SKU, tồn kho, ...) làm tròn, phân cách hàng nghìn. */
export function formatNumber(value) {
  return Math.round(value).toLocaleString(LOCALE);
}

/** Phần trăm có dấu, ví dụ "+12.3%". `null` nghĩa là không có kỳ so sánh → "Mới". */
export function formatPercent(percent) {
  if (percent === null) {
    return 'Mới';
  }

  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`;
}

/** Class CSS thể hiện chiều thay đổi: tăng / giảm / không đổi. */
export function getChangeClass(value) {
  if (value > 0) return 'change-up';
  if (value < 0) return 'change-down';
  return 'change-flat';
}

