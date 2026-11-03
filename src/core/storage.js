/**
 * Wrapper an toàn cho localStorage (tự JSON hóa, nuốt lỗi khi storage bị chặn).
 */

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn(`Không đọc được "${key}" từ localStorage:`, error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Không lưu được "${key}" vào localStorage:`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Không xóa được "${key}" khỏi localStorage:`, error);
    }
  }
};

