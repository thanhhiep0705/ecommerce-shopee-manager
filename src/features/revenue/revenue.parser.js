/**
 * Parse dữ liệu doanh thu từ sheet thô thành cấu trúc products/variants.
 * Hàm thuần — không phụ thuộc DOM.
 */

import { cleanCell, normalizeHeader, parseOptionalNumber } from '../../utils/parse.js';

const GRAND_TOTAL = 'grand total';

/**
 * @param {string[][]} rows
 * @param {string} sheetName  dùng cho thông báo lỗi
 * @returns {{
 *   products: Map<string, RevenueEntry>,
 *   variants: Map<string, RevenueEntry>,
 *   totalRevenue: number,
 *   totalTrending: number
 * }}
 */
export function parseRevenueRows(rows, sheetName) {
  const headerIndex = findRevenueHeaderIndex(rows);
  if (headerIndex === -1) {
    throw new Error(`Không tìm thấy dòng tiêu đề trong sheet "${sheetName}".`);
  }

  const dataRows = rows.slice(headerIndex + 1);
  const headers = rows[headerIndex].map(normalizeHeader);
  const columns = {
    product: headers.findIndex(header => header === 'ma san pham' || header.includes('ma san pham')),
    variant: headers.findIndex(header => header.includes('ma phan loai')),
    productName: headers.findIndex(header => header === 'san pham' || header.includes('ten san pham')),
    variantName: headers.findIndex(header => header.includes('ten phan loai')),
    revenue: findRevenueColumn(headers, dataRows),
    trending: headers.findIndex(header => header === 'trending' || header.includes('trending'))
  };

  if (columns.product === -1 || columns.revenue === -1) {
    throw new Error(`Sheet "${sheetName}" cần có cột Mã sản phẩm và cột doanh thu.`);
  }

  const cellAt = (row, index) => (index === -1 ? '' : cleanCell(row[index]));

  const explicitProductRevenue = new Map();
  const variantProductRevenue = new Map();
  const variants = new Map();
  let currentProductId = '';

  for (const row of dataRows) {
    const productCell = cellAt(row, columns.product);
    const variantId = cellAt(row, columns.variant);
    const productName = cellAt(row, columns.productName);
    const variantName = cellAt(row, columns.variantName);
    const revenue = parseOptionalNumber(row[columns.revenue]);
    const hasVariant = Boolean(variantId && variantId !== '-');
    const isProductRow = Boolean(productCell) && productCell.toLowerCase() !== GRAND_TOTAL;

    if (isProductRow) {
      currentProductId = productCell;
    }

    if (!currentProductId || revenue === null) {
      continue;
    }

    const trendingValue = columns.trending === -1 ? null : parseOptionalNumber(row[columns.trending]);
    const trending = trendingValue === null ? revenue : trendingValue;

    if (hasVariant) {
      addRevenue(variantProductRevenue, currentProductId, { label: currentProductId, revenue, trending, name: productName });
      addRevenue(variants, `${currentProductId}||${variantId}`, {
        label: variantId,
        revenue,
        trending,
        productId: currentProductId,
        name: variantName
      });
    } else if (isProductRow) {
      addRevenue(explicitProductRevenue, currentProductId, { label: currentProductId, revenue, trending, name: productName });
    }
  }

  const products = mergeProductRevenue(explicitProductRevenue, variantProductRevenue);
  const productList = [...products.values()];
  const totalRevenue = productList.reduce((total, product) => total + product.revenue, 0);
  const totalTrending = productList.reduce((total, product) => total + product.trending, 0);

  return { products, variants, totalRevenue, totalTrending };
}

/** Ưu tiên doanh thu khai báo trực tiếp ở dòng sản phẩm; nếu không có thì cộng từ các phân loại. */
function mergeProductRevenue(explicitProductRevenue, variantProductRevenue) {
  const products = new Map();
  const productIds = new Set([
    ...explicitProductRevenue.keys(),
    ...variantProductRevenue.keys()
  ]);

  productIds.forEach(productId => {
    products.set(productId, explicitProductRevenue.get(productId) || variantProductRevenue.get(productId));
  });

  return products;
}

const isRevenueHeader = header =>
  header.includes('doanh thu') ||
  header.includes('revenue') ||
  header.includes('vnd');

function findRevenueHeaderIndex(rows) {
  return rows.findIndex(row => {
    const normalized = row.map(normalizeHeader);
    return normalized.some(header => header.includes('ma san pham')) &&
      normalized.some(isRevenueHeader);
  });
}

/** Tìm cột doanh thu theo tên; nếu không có thì chọn cột có nhiều giá trị số nhất. */
function findRevenueColumn(headers, dataRows) {
  const directMatch = headers.findIndex(isRevenueHeader);
  if (directMatch !== -1) {
    return directMatch;
  }

  let bestIndex = -1;
  let bestNumericCount = 0;

  headers.forEach((header, index) => {
    if (header.includes('ma ') || header.includes('ten ')) {
      return;
    }

    const numericCount = dataRows.reduce((count, row) => (
      parseOptionalNumber(row[index]) === null ? count : count + 1
    ), 0);

    if (numericCount > bestNumericCount) {
      bestNumericCount = numericCount;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * @typedef {Object} RevenueEntry
 * @property {string} key
 * @property {string} label
 * @property {string} productId
 * @property {string} name
 * @property {number} revenue
 * @property {number} trending
 */
function addRevenue(map, key, { label, revenue, trending, productId = '', name = '' }) {
  const current = map.get(key) || {
    key,
    label,
    productId,
    name,
    revenue: 0,
    trending: 0
  };

  if (!current.name && name) {
    current.name = name;
  }

  current.revenue += revenue;
  current.trending += trending;
  map.set(key, current);
}

