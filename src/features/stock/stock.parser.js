/**
 * Parse sheet "Follow STOCK" thành danh sách SKU.
 * Hàm thuần — không phụ thuộc DOM.
 */

import { cleanCell, parseOptionalNumber } from '../../utils/parse.js';

/** Vị trí các cột trong sheet. Đổi layout sheet thì chỉ cần sửa ở đây. */
export const STOCK_COLUMNS = Object.freeze({
  SKU: 0,
  REVENUE: 1,
  SOLD_MONTH: 2,
  STOCK: 3,
  OOS_DAYS: 4,
  RATE_DAY: 5,
  RATE_MONTH: 6,
  /** Ô tiêu đề của cột này chứa nhãn tháng, ví dụ "Oct 2026". */
  MONTH_LABEL: 7
});

/**
 * @param {string[][]} rows
 * @returns {{ items: StockItem[], monthLabel: string|null }}
 */
export function parseStockRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { items: [], monthLabel: null };
  }

  const headerRow = rows[0] || [];
  const monthLabel = cleanCell(headerRow[STOCK_COLUMNS.MONTH_LABEL]) || null;

  const items = [];
  for (const row of rows) {
    if (!row || !row[STOCK_COLUMNS.SKU]) continue;

    const sku = cleanCell(row[STOCK_COLUMNS.SKU]);
    if (!sku || sku === 'SKU' || sku.toLowerCase() === 'grand total') continue;

    items.push(parseStockRow(row, sku));
  }

  return { items, monthLabel };
}

/**
 * @typedef {Object} StockItem
 * @property {string} sku
 * @property {number} revenue
 * @property {number} soldMonth
 * @property {number} stock
 * @property {number|null} oosDays   null khi không xác định (N/A)
 * @property {string} rawOos
 * @property {boolean} isNa          true khi sheet ghi "N/A" (chưa bán)
 * @property {number} rateDay
 * @property {number} rateMonth
 */
function parseStockRow(row, sku) {
  const numberAt = column => parseOptionalNumber(row[column]) || 0;

  const rawOos = cleanCell(row[STOCK_COLUMNS.OOS_DAYS]);
  const isNa = rawOos.toUpperCase().includes('N/A');
  let oosDays = null;
  if (!isNa) {
    const match = rawOos.match(/(\d+)/);
    if (match) oosDays = parseInt(match[1], 10);
  }

  return {
    sku,
    revenue: numberAt(STOCK_COLUMNS.REVENUE),
    soldMonth: numberAt(STOCK_COLUMNS.SOLD_MONTH),
    stock: numberAt(STOCK_COLUMNS.STOCK),
    oosDays,
    rawOos,
    isNa,
    rateDay: numberAt(STOCK_COLUMNS.RATE_DAY),
    rateMonth: numberAt(STOCK_COLUMNS.RATE_MONTH)
  };
}
