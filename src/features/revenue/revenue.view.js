/**
 * Render DOM cho tab Doanh thu.
 */

import { byId, $$, escapeHtml, setText, setVisible } from '../../utils/dom.js';
import { formatCurrency, formatPercent, getChangeClass } from '../../utils/format.js';

const CARET_EXPANDED = '▼';
const CARET_COLLAPSED = '▶';
const TABLE_COLUMNS = 6;

export function createRevenueView() {
  const els = {
    status: byId('dashboardStatus'),
    refreshBtn: byId('refreshDashboardBtn'),
    lastMonthTotal: byId('lastMonthTotal'),
    thisMonthTotal: byId('thisMonthTotal'),
    thisMonthTrending: byId('thisMonthTrending'),
    change: byId('dashboardChange'),
    searchInput: byId('dashboardSearch'),
    searchSummaryBar: byId('searchSummaryBar'),
    searchTotalLastMonth: byId('searchTotalLastMonth'),
    searchTotalThisMonth: byId('searchTotalThisMonth'),
    searchTotalTrending: byId('searchTotalTrending'),
    searchTotalChange: byId('searchTotalChange'),
    toggleAllBtn: byId('toggleAllVariantsBtn'),
    toggleAllIcon: byId('toggleAllVariantsIcon'),
    treeBody: byId('revenueTreeBody'),
    sortHeaders: $$('#dashboardPanel .sortable')
  };

  function renderMonthLabels({ thisMonth, lastMonth }) {
    setText(byId('labelLastMonthName'), lastMonth);
    setText(byId('labelThisMonthName'), thisMonth);
    setText(byId('sectionSortMonthName'), thisMonth);
    setText(byId('searchSummaryLastMonthLabel'), `${lastMonth}:`);
    setText(byId('searchSummaryThisMonthLabel'), `${thisMonth}:`);
    setText(byId('thLastMonthLabel'), lastMonth);
    setText(byId('thThisMonthLabel'), thisMonth);
  }

  function renderSummary({ lastTotal, thisTotal, trendingTotal, diff, percent }) {
    setText(els.lastMonthTotal, formatCurrency(lastTotal));
    setText(els.thisMonthTotal, formatCurrency(thisTotal));
    setText(els.thisMonthTrending, formatCurrency(trendingTotal));
    setText(els.change, formatPercent(percent));
    if (els.change) els.change.className = getChangeClass(diff);
  }

  /** @param {null | { lastRevenue, thisRevenue, trendingRevenue, diff, percent }} totals  null = ẩn */
  function renderSearchSummary(totals) {
    if (!totals) {
      setVisible(els.searchSummaryBar, false);
      return;
    }

    setText(els.searchTotalLastMonth, formatCurrency(totals.lastRevenue));
    setText(els.searchTotalThisMonth, formatCurrency(totals.thisRevenue));
    setText(els.searchTotalTrending, formatCurrency(totals.trendingRevenue));
    setText(els.searchTotalChange, formatPercent(totals.percent));
    if (els.searchTotalChange) els.searchTotalChange.className = getChangeClass(totals.diff);
    setVisible(els.searchSummaryBar, true, 'flex');
  }

  function renderToggleAllIcon(allExpanded) {
    setText(els.toggleAllIcon, allExpanded ? CARET_EXPANDED : CARET_COLLAPSED);
  }

  function renderTree(products, { collapsedIds, emptyMessage }) {
    if (!products.length) {
      els.treeBody.innerHTML = `<tr><td colspan="${TABLE_COLUMNS}">${emptyMessage}</td></tr>`;
      return;
    }

    els.treeBody.innerHTML = products.map(product => {
      const isCollapsed = collapsedIds.has(product.key);
      const productRow = renderRow(product, { isProduct: true, isCollapsed });
      const variantRows = product.variants
        .map(variant => renderRow(variant, { isProduct: false, isCollapsed }))
        .join('');

      return productRow + variantRows;
    }).join('');
  }

  /** Cập nhật caret + ẩn/hiện các dòng phân loại của 1 sản phẩm mà không render lại bảng. */
  function setProductCollapsed(toggleBtn, productId, collapsed) {
    toggleBtn.textContent = collapsed ? CARET_COLLAPSED : CARET_EXPANDED;
    const variantRows = els.treeBody.querySelectorAll(
      `.revenue-variant-row[data-product-id="${CSS.escape(productId)}"]`
    );
    variantRows.forEach(row => {
      row.style.display = collapsed ? 'none' : '';
    });
  }

  return {
    els,
    renderMonthLabels,
    renderSummary,
    renderSearchSummary,
    renderToggleAllIcon,
    renderTree,
    setProductCollapsed
  };
}

function renderRow(row, { isProduct, isCollapsed }) {
  const productId = isProduct ? row.key : row.productId;
  const displayCode = isProduct ? productId : row.label;
  const rowClass = isProduct ? 'revenue-product-row' : 'revenue-variant-row';
  const escapedName = escapeHtml(row.name || '-');
  const hiddenStyle = !isProduct && isCollapsed ? 'style="display: none;"' : '';

  let toggleBtn = '';
  if (isProduct) {
    toggleBtn = row.variants && row.variants.length > 0
      ? `<button class="toggle-variants-btn" data-product-id="${escapeHtml(productId)}" aria-label="Thu gọn/mở rộng phân loại">${isCollapsed ? CARET_COLLAPSED : CARET_EXPANDED}</button> `
      : '<span class="toggle-placeholder"></span>';
  }

  return `
    <tr class="${rowClass}" ${hiddenStyle} data-product-id="${escapeHtml(productId)}">
      <td>${toggleBtn}${escapeHtml(displayCode || '-')}</td>
      <td class="name-cell">
        <span class="name-ellipsis" title="${escapedName}">${escapedName}</span>
      </td>
      <td>${formatCurrency(row.lastRevenue)}</td>
      <td>${formatCurrency(row.thisRevenue)}</td>
      <td>${formatCurrency(row.trendingRevenue)}</td>
      <td class="percent-cell ${getChangeClass(row.diff)}">
        ${formatPercent(row.percent)}
        <div class="percent-bar">
          <span class="percent-fill" style="--bar-width: ${getPercentBarWidth(row.percent)}%"></span>
        </div>
      </td>
    </tr>
  `;
}

function getPercentBarWidth(percent) {
  if (percent === null || !Number.isFinite(percent)) {
    return 100;
  }
  return Math.min(Math.abs(percent), 100);
}

