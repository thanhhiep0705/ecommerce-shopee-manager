/**
 * Xuất danh sách SKU tồn kho ra Excel.
 */

import { exportRowsToFile } from '../../components/excel-export.js';

const COLUMN_WIDTHS = [6, 22, 18, 16, 18, 20, 20, 22, 15, 35];

function getRecommendation(item, { danger, warning }) {
  switch (item.status) {
    case 'oos': return 'Hết hàng - Đặt hàng khẩn cấp';
    case 'danger': return `Nguy hiểm - Còn ≤ ${danger} ngày`;
    case 'warning': return `Cảnh báo - Còn ≤ ${warning} ngày`;
    default: return `An toàn (> ${warning} ngày)`;
  }
}

function toExportRow(item, index, thresholds) {
  return {
    'STT': index + 1,
    'Mã SKU': item.sku,
    'Tồn kho hiện tại': item.stock,
    'Đã bán tháng': item.soldMonth,
    'Tốc độ bán/ngày': item.rateDay,
    'Trending bán/tháng': item.rateMonth,
    'Ngày còn hàng (OOS)': item.status === 'oos' ? 0 : (item.isNa ? 'N/A' : item.oosDays),
    'Doanh thu tháng (VNĐ)': item.revenue,
    'Trạng thái': item.statusLabel,
    'Khuyến nghị xử lý': getRecommendation(item, thresholds)
  };
}

/**
 * @returns {{ count: number, fileName: string }}
 * @throws khi không tạo được file
 */
export function exportStockItems(items, { thresholds, monthLabel }) {
  const rows = items.map((item, index) => toExportRow(item, index, thresholds));
  const safeMonthName = monthLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);

  const { fileName } = exportRowsToFile(rows, {
    fileName: `Follow_STOCK_${safeMonthName}_${dateStr}`,
    sheetName: 'Follow STOCK',
    columnWidths: COLUMN_WIDTHS
  });

  return { count: rows.length, fileName };
}

