/**
 * Thanh trạng thái (loading / ok / error) với hỗ trợ thông báo tự ẩn.
 */

/**
 * @param {HTMLElement|null} el
 * @param {{ baseClass?: string, hideWhenEmpty?: boolean }} options
 */
export function createStatusBar(el, { baseClass = 'status dashboard-status', hideWhenEmpty = false } = {}) {
  let flashTimer = null;

  function show(message, type = '') {
    window.clearTimeout(flashTimer);
    flashTimer = null;
    if (!el) return;

    el.textContent = message;
    el.className = type ? `${baseClass} ${type}` : baseClass;
    if (hideWhenEmpty) {
      el.style.display = message ? 'block' : 'none';
    }
  }

  /** Hiện thông báo rồi tự xóa sau `durationMs` (bị hủy nếu có thông báo mới). */
  function flash(message, durationMs, type = '') {
    show(message, type);
    flashTimer = window.setTimeout(() => show(''), durationMs);
  }

  return {
    show,
    flash,
    clear: () => show('')
  };
}

