/**
 * Logic nghiệp vụ tab Tồn kho: phân loại trạng thái OOS, lọc, sắp xếp, tổng hợp.
 * Hàm thuần — không phụ thuộc DOM.
 */

/** Thông tin hiển thị của từng trạng thái, sắp theo mức ưu tiên (1 = khẩn cấp nhất). */
export const STOCK_STATUS = Object.freeze({
  oos: { label: 'Hết hàng', priority: 1, icon: '🔴' },
  danger: { label: 'Nguy hiểm', priority: 2, icon: '🟠' },
  warning: { label: 'Cảnh báo', priority: 3, icon: '🟡' },
  safe: { label: 'An toàn', priority: 4, icon: '🟢' }
});

/** Giá trị thay thế cho oosDays = null khi sắp xếp (coi như còn hàng rất lâu). */
const UNKNOWN_DAYS = 999999;

/** Kiểm tra ngưỡng hợp lệ. Trả về thông báo lỗi hoặc null. */
export function validateThresholds({ danger, warning }) {
  if (!Number.isInteger(danger) || danger < 1) {
    return { field: 'danger', message: 'Ngưỡng nguy hiểm phải là số nguyên ≥ 1 ngày.' };
  }
  if (!Number.isInteger(warning) || warning <= danger) {
    return { field: 'warning', message: `Ngưỡng cảnh báo phải lớn hơn ngưỡng nguy hiểm (phải > ${danger} ngày).` };
  }
  return null;
}

export function getStockStatus(item, { danger, warning }) {
  if (item.stock === 0 || item.oosDays === 0) return 'oos';
  if (item.oosDays !== null && item.oosDays <= danger) return 'danger';
  if (item.oosDays !== null && item.oosDays <= warning) return 'warning';
  return 'safe';
}

/** Gán status/statusLabel/statusPriority cho từng item (thay đổi tại chỗ). */
export function classifyStockItems(items, thresholds) {
  items.forEach(item => {
    const status = getStockStatus(item, thresholds);
    item.status = status;
    item.statusLabel = STOCK_STATUS[status].label;
    item.statusPriority = STOCK_STATUS[status].priority;
  });
  return items;
}

export function filterStockItems(items, { filter, searchQuery }) {
  return items.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (searchQuery && !item.sku.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
}

const daysOrUnknown = item => (item.oosDays !== null ? item.oosDays : UNKNOWN_DAYS);

const COMPARATORS = {
  priority: (a, b) => (a.statusPriority - b.statusPriority) || (daysOrUnknown(a) - daysOrUnknown(b)),
  sku: (a, b) => a.sku.localeCompare(b.sku),
  stock: (a, b) => a.stock - b.stock,
  soldMonth: (a, b) => a.soldMonth - b.soldMonth,
  rateDay: (a, b) => a.rateDay - b.rateDay,
  rateMonth: (a, b) => a.rateMonth - b.rateMonth,
  oosdays: (a, b) => daysOrUnknown(a) - daysOrUnknown(b),
  revenue: (a, b) => a.revenue - b.revenue,
  status: (a, b) => a.statusPriority - b.statusPriority
};

/** Trả về mảng mới đã sắp xếp. */
export function sortStockItems(items, { column, direction }) {
  const compare = COMPARATORS[column] || (() => 0);
  const factor = direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => compare(a, b) * factor);
}

/** Chiều sort mặc định khi click vào một cột lần đầu. */
export function getDefaultStockSortDirection(column) {
  return ['sku', 'oosdays', 'status'].includes(column) ? 'asc' : 'desc';
}

export function summarizeStock(items) {
  const counts = { oos: 0, danger: 0, warning: 0, safe: 0 };
  let totalRevenue = 0;

  items.forEach(item => {
    if (item.status in counts) counts[item.status]++;
    totalRevenue += item.revenue;
  });

  return { total: items.length, counts, totalRevenue };
}

export function sumStockAndRevenue(items) {
  return items.reduce(
    (sum, item) => ({ stock: sum.stock + item.stock, revenue: sum.revenue + item.revenue }),
    { stock: 0, revenue: 0 }
  );
}

