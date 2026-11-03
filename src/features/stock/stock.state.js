/**
 * State của tab Tồn kho.
 */

import { DEFAULT_STOCK_THRESHOLDS } from '../../config.js';
import { getMonthYearLabel } from '../../utils/date.js';

export const stockState = {
  items: [],
  loaded: false,
  /** Promise của lần tải đang chạy (tránh gọi trùng). */
  loading: null,
  /** 'all' | 'oos' | 'danger' | 'warning' | 'safe' */
  filter: 'all',
  /** Chuỗi tìm kiếm đã chuẩn hóa (trim + lowercase). */
  searchQuery: '',
  sort: { column: 'priority', direction: 'asc' },
  monthLabel: getMonthYearLabel(),
  thresholds: { ...DEFAULT_STOCK_THRESHOLDS }
};

