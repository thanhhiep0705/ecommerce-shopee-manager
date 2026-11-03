/**
 * Đọc/ghi tham số trên URL (ưu tiên hash `#key=value`, sau đó query `?key=value`).
 */

/** Trả về giá trị chuỗi của tham số, hoặc null nếu không có. */
export function getUrlParam(name) {
  try {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has(name)) return hashParams.get(name);

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(name)) return searchParams.get(name);
  } catch (error) {
    console.error(`Lỗi khi đọc "${name}" từ URL:`, error);
  }
  return null;
}

/** Ghi tham số vào hash (không tạo history entry). `null`/'' sẽ xóa tham số. */
export function setHashParam(name, value) {
  try {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (value === null || value === undefined || value === '') {
      hashParams.delete(name);
    } else {
      hashParams.set(name, String(value));
    }

    const newHash = hashParams.toString();
    if (window.location.hash.substring(1) !== newHash) {
      const { pathname, search } = window.location;
      history.replaceState(null, document.title, pathname + search + (newHash ? `#${newHash}` : ''));
    }
  } catch (error) {
    console.error('Lỗi khi đồng bộ hash URL:', error);
  }
}

