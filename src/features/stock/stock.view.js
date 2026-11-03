/**
 * Render DOM cho tab Tồn kho.
 */

import { byId, $$, escapeHtml, setText, setVisible } from '../../utils/dom.js';
import { formatCurrency, formatNumber } from '../../utils/format.js';
import { STOCK_STATUS } from './stock.model.js';

const TABLE_COLUMNS = 8;

export function createStockView() {
  const els = {
    status: byId('stockStatus'),
    refreshBtn: byId('refreshStockBtn'),
    exportBtn: byId('exportStockExcelBtn'),
    monthBadge: byId('stockMonthLabelBadge'),
    labelDangerDays: byId('labelCardDangerDays'),
    labelWarningRange: byId('labelCardWarningRange'),
    labelSafeDays: byId('labelCardSafeDays'),
    safeHint: byId('hintSafeVal'),
    count: {
      oos: byId('stockCountOOS'),
      danger: byId('stockCountDanger'),
      warning: byId('stockCountWarning'),
      safe: byId('stockCountSafe')
    },
    pillCount: {
      all: byId('pillCountAll'),
      oos: byId('pillCountOOS'),
      danger: byId('pillCountDanger'),
      warning: byId('pillCountWarning'),
      safe: byId('pillCountSafe')
    },
    totalRevenue: byId('stockTotalRevenue'),
    totalSku: byId('stockTotalSKU'),
    filterPills: $$('.stock-filter-pill'),
    summaryCards: $$('.stock-summary .metric[data-stock-filter]'),
    searchInput: byId('stockSearchInput'),
    infoBar: byId('stockFilterInfoBar'),
    filteredCount: byId('stockFilteredCount'),
    filteredTotal: byId('stockFilteredTotal'),
    filteredStock: byId('stockFilteredTotalStock'),
    filteredRevenue: byId('stockFilteredTotalRevenue'),
    resetFilterBtn: byId('stockResetFilterBtn'),
    tableBody: byId('stockTableBody'),
    sortHeaders: $$('.stock-sortable')
  };

  function renderMonthBadge(label) {
    setText(els.monthBadge, label);
  }

  function renderThresholdLabels({ danger, warning }) {
    setText(els.labelDangerDays, danger);
    setText(els.labelWarningRange, `${danger + 1}–${warning}`);
    setText(els.labelSafeDays, warning);
    setText(els.safeHint, `> ${warning} ngày`);
  }

  function renderSummary({ total, counts, totalRevenue }) {
    Object.entries(counts).forEach(([status, count]) => {
      setText(els.count[status], formatNumber(count));
      setText(els.pillCount[status], formatNumber(count));
    });
    setText(els.pillCount.all, formatNumber(total));
    setText(els.totalSku, formatNumber(total));
    setText(els.totalRevenue, `${formatCurrency(totalRevenue)} ₫`);
  }

  function renderFilterState(filter) {
    els.filterPills.forEach(pill => pill.classList.toggle('active', pill.dataset.filter === filter));
    els.summaryCards.forEach(card => card.classList.toggle('filter-active', card.dataset.stockFilter === filter));
  }

  /** @param {null | { count, total, stock, revenue }} info  null = ẩn thanh thông tin */
  function renderInfoBar(info) {
    if (!info) {
      setVisible(els.infoBar, false);
      return;
    }

    setVisible(els.infoBar, true, 'flex');
    setText(els.filteredCount, formatNumber(info.count));
    setText(els.filteredTotal, formatNumber(info.total));
    setText(els.filteredStock, formatNumber(info.stock));
    setText(els.filteredRevenue, `${formatCurrency(info.revenue)} ₫`);
  }

  function renderTable(items, thresholds) {
    if (!els.tableBody) return;

    if (items.length === 0) {
      els.tableBody.innerHTML = `
        <tr>
          <td colspan="${TABLE_COLUMNS}" style="text-align: center; padding: 36px; color: var(--muted);">
            Không tìm thấy SKU nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    const maxBarScale = Math.max(thresholds.warning * 2, 60);
    els.tableBody.innerHTML = items.map(item => renderRow(item, maxBarScale)).join('');
  }

  function renderError(message) {
    if (!els.tableBody) return;
    els.tableBody.innerHTML = `<tr><td colspan="${TABLE_COLUMNS}" style="text-align: center; color: var(--danger); padding: 24px;">Lỗi tải dữ liệu: ${escapeHtml(message)}</td></tr>`;
  }

  return {
    els,
    renderMonthBadge,
    renderThresholdLabels,
    renderSummary,
    renderFilterState,
    renderInfoBar,
    renderTable,
    renderError
  };
}

/** Text + thanh tiến trình cho cột "Ngày còn hàng". */
function getOosDisplay(item, maxBarScale) {
  const scaled = Math.round((item.oosDays / maxBarScale) * 100);

  if (item.status === 'oos') {
    return { text: '0 ngày (Hết hàng)', textClass: 'oos-text-danger', barClass: 'fill-oos', percent: 100 };
  }
  if (item.status === 'danger') {
    return { text: `${item.oosDays} ngày`, textClass: 'oos-text-danger', barClass: 'fill-danger', percent: Math.max(10, Math.min(100, scaled)) };
  }
  if (item.status === 'warning') {
    return { text: `${item.oosDays} ngày`, textClass: 'oos-text-warning', barClass: 'fill-warning', percent: Math.max(15, Math.min(100, scaled)) };
  }
  if (item.isNa) {
    return { text: 'N/A (Chưa bán)', textClass: 'oos-text-muted', barClass: 'fill-na', percent: 100 };
  }
  return { text: `${item.oosDays} ngày`, textClass: 'oos-text-safe', barClass: 'fill-safe', percent: Math.min(100, Math.max(20, scaled)) };
}

function renderRow(item, maxBarScale) {
  const oos = getOosDisplay(item, maxBarScale);

  return `
    <tr class="stock-row-${item.status}">
      <td><strong>${escapeHtml(item.sku)}</strong></td>
      <td class="numeric-cell"><span class="${item.stock === 0 ? 'text-danger font-bold' : ''}">${formatNumber(item.stock)}</span></td>
      <td class="numeric-cell">${formatNumber(item.soldMonth)}</td>
      <td class="numeric-cell">${formatNumber(item.rateDay)}</td>
      <td class="numeric-cell">${formatNumber(item.rateMonth)}</td>
      <td>
        <div class="stock-oos-cell">
          <div class="stock-oos-header">
            <span class="oos-text ${oos.textClass}">${oos.text}</span>
          </div>
          <div class="stock-progress-track">
            <div class="stock-progress-fill ${oos.barClass}" style="width: ${oos.percent}%;"></div>
          </div>
        </div>
      </td>
      <td class="numeric-cell font-bold">${formatCurrency(item.revenue)} ₫</td>
      <td>
        <span class="stock-badge badge-${item.status}">
          ${STOCK_STATUS[item.status].icon} ${item.statusLabel}
        </span>
      </td>
    </tr>
  `;
}

