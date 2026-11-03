/**
 * Tiện ích thao tác DOM dùng chung.
 */

export const byId = id => document.getElementById(id);

export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Gán textContent an toàn (bỏ qua nếu phần tử không tồn tại). */
export function setText(el, text) {
  if (el) el.textContent = text;
}

/** Ẩn/hiện phần tử bằng inline style. */
export function setVisible(el, visible, display = '') {
  if (el) el.style.display = visible ? display : 'none';
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

