/**
 * State của tab Doanh thu.
 */
export const revenueState = {
  /** Cây sản phẩm → phân loại sau khi so sánh 2 tháng. */
  tree: [],
  loaded: false,
  /** Promise của lần tải đang chạy (tránh gọi trùng). */
  loading: null,
  sort: { column: '', direction: 'desc' },
  /** Mã các sản phẩm đang thu gọn phân loại. */
  collapsedIds: new Set(),
  searchQuery: ''
};

