/**
 * Logic tính toán cho tab Doanh thu: so sánh 2 tháng, dựng cây sản phẩm/phân loại,
 * lọc, sắp xếp, tính tổng. Hàm thuần — không phụ thuộc DOM.
 */

import { cleanCell } from '../../utils/parse.js';

/** Tăng trưởng của `current` so với `previous`. percent = null khi previous = 0. */
export function computeGrowth(previous, current) {
  const diff = current - previous;
  const percent = previous === 0 ? null : (diff / previous) * 100;
  return { diff, percent };
}

/** Như computeGrowth nhưng coi 0 → 0 là 0% (thay vì "Mới"). */
function computeRowGrowth(previous, current) {
  const diff = current - previous;
  const percent = previous === 0
    ? (current === 0 ? 0 : null)
    : (diff / previous) * 100;
  return { diff, percent };
}

function compareRevenueMaps(lastMonthMap, thisMonthMap) {
  const keys = new Set([...lastMonthMap.keys(), ...thisMonthMap.keys()]);

  return [...keys].map(key => {
    const last = lastMonthMap.get(key);
    const current = thisMonthMap.get(key);
    const lastRevenue = last ? last.revenue : 0;
    const thisRevenue = current ? current.revenue : 0;
    const trendingRevenue = current ? current.trending : (last ? last.revenue : 0);
    const source = current || last;

    return {
      key,
      label: source.label,
      productId: source.productId,
      name: source.name || '',
      lastRevenue,
      thisRevenue,
      trendingRevenue,
      ...computeRowGrowth(lastRevenue, trendingRevenue)
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/**
 * Dựng cây: mỗi sản phẩm kèm danh sách phân loại, sắp xếp theo doanh thu lớn nhất.
 */
export function buildRevenueTree(lastMonthData, thisMonthData) {
  const productRows = compareRevenueMaps(lastMonthData.products, thisMonthData.products);
  const variantRows = compareRevenueMaps(lastMonthData.variants, thisMonthData.variants);
  const variantsByProduct = new Map();

  variantRows.forEach(variant => {
    if (!variantsByProduct.has(variant.productId)) {
      variantsByProduct.set(variant.productId, []);
    }
    variantsByProduct.get(variant.productId).push(variant);
  });

  const getSortKey = item => Math.max(item.lastRevenue, item.thisRevenue, item.trendingRevenue);

  return productRows.map(product => ({
    ...product,
    variants: (variantsByProduct.get(product.key) || [])
      .sort((a, b) => getSortKey(b) - getSortKey(a))
  })).sort((a, b) => getSortKey(b) - getSortKey(a));
}

/** Sắp xếp cây (cả sản phẩm và phân loại) tại chỗ theo cột đang chọn. */
export function sortRevenueTree(tree, { column, direction }) {
  if (!column) return tree;

  const factor = direction === 'asc' ? 1 : -1;

  const compare = (a, b) => {
    if (column === 'name') {
      return (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' }) * factor;
    }

    const valueA = a[column] ?? -Infinity;
    const valueB = b[column] ?? -Infinity;

    if (valueA !== valueB) {
      return (valueA - valueB) * factor;
    }
    return (a.key || '').localeCompare(b.key || '');
  };

  tree.sort(compare);
  tree.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      product.variants.sort(compare);
    }
  });

  return tree;
}

const matchesSearch = (value, normalizedQuery) => cleanCell(value).toLowerCase().includes(normalizedQuery);

/**
 * Lọc theo mã/tên. Sản phẩm khớp → giữ nguyên toàn bộ phân loại;
 * chỉ phân loại khớp → giữ sản phẩm với các phân loại khớp.
 */
export function filterRevenueTree(products, query) {
  const normalizedQuery = cleanCell(query).toLowerCase();
  if (!normalizedQuery) {
    return products;
  }

  return products.reduce((filteredProducts, product) => {
    const productMatches = matchesSearch(product.key, normalizedQuery) ||
      matchesSearch(product.name, normalizedQuery);

    if (productMatches) {
      filteredProducts.push(product);
      return filteredProducts;
    }

    const matchingVariants = product.variants.filter(variant =>
      matchesSearch(variant.label, normalizedQuery) ||
      matchesSearch(variant.name, normalizedQuery)
    );

    if (matchingVariants.length) {
      filteredProducts.push({ ...product, variants: matchingVariants });
    }

    return filteredProducts;
  }, []);
}

/** Tổng doanh thu của kết quả lọc (cộng theo phân loại nếu sản phẩm có phân loại). */
export function summarizeRevenueTree(products) {
  let lastRevenue = 0;
  let thisRevenue = 0;
  let trendingRevenue = 0;

  const add = row => {
    lastRevenue += row.lastRevenue || 0;
    thisRevenue += row.thisRevenue || 0;
    trendingRevenue += row.trendingRevenue || 0;
  };

  products.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(add);
    } else {
      add(product);
    }
  });

  return {
    lastRevenue,
    thisRevenue,
    trendingRevenue,
    ...computeRowGrowth(lastRevenue, trendingRevenue)
  };
}

