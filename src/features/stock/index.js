/**
 * Feature: Theo dõi tồn kho & dự báo hết hàng (OOS).
 */

import { DEFAULT_STOCK_THRESHOLDS, SHEETS, STATUS_FLASH_MS } from '../../config.js';
import { loadSheetRows } from '../../core/sheets-client.js';
import { createStatusBar } from '../../components/status-bar.js';
import { createSortableHeaders, nextSortState } from '../../components/sortable-header.js';
import { parseStockRows } from './stock.parser.js';
import {
  classifyStockItems,
  filterStockItems,
  getDefaultStockSortDirection,
  sortStockItems,
  summarizeStock,
  sumStockAndRevenue
} from './stock.model.js';
import { stockState as state } from './stock.state.js';
import { clearThresholds, loadThresholds, saveThresholds } from './stock.thresholds.js';
import { createStockView } from './stock.view.js';
import { createThresholdsPanel } from './thresholds-panel.js';
import { exportStockItems } from './stock.export.js';

let view;
let statusBar;
let sortHeaders;

function init() {
  view = createStockView();
  statusBar = createStatusBar(view.els.status, { hideWhenEmpty: true });
  sortHeaders = createSortableHeaders(view.els.sortHeaders, {
    dataKey: 'stockSort',
    activeIconColor: 'var(--brand)',
    onSort: handleSort
  });

  state.thresholds = loadThresholds();
  view.renderThresholdLabels(state.thresholds);

  createThresholdsPanel({
    getThresholds: () => state.thresholds,
    onSave: thresholds => {
      saveThresholds(thresholds);
      applyThresholds(
        thresholds,
        `Đã áp dụng điều kiện mới: Nguy hiểm ≤ ${thresholds.danger} ngày, Cảnh báo ≤ ${thresholds.warning} ngày.`
      );
    },
    onReset: () => {
      clearThresholds();
      applyThresholds(
        { ...DEFAULT_STOCK_THRESHOLDS },
        `Đã khôi phục ngưỡng mặc định: ${DEFAULT_STOCK_THRESHOLDS.danger} ngày (Nguy hiểm), ${DEFAULT_STOCK_THRESHOLDS.warning} ngày (Cảnh báo).`
      );
    }
  });

  bindEvents();
}

function bindEvents() {
  const { els } = view;

  els.refreshBtn?.addEventListener('click', loadData);
  els.exportBtn?.addEventListener('click', exportCurrentView);

  els.filterPills.forEach(pill => {
    pill.addEventListener('click', () => setFilter(pill.dataset.filter));
  });

  // Click thẻ tổng hợp để lọc; click lại thẻ đang chọn để bỏ lọc.
  els.summaryCards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.dataset.stockFilter;
      setFilter(state.filter === filter ? 'all' : filter);
    });
  });

  els.searchInput?.addEventListener('input', event => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    renderTable();
  });

  els.resetFilterBtn?.addEventListener('click', () => {
    if (els.searchInput) els.searchInput.value = '';
    state.searchQuery = '';
    setFilter('all');
  });
}

function onActivate() {
  if (!state.loaded) loadData();
}

async function loadData() {
  if (state.loading) return state.loading;

  state.loading = (async () => {
    try {
      statusBar.show(`Đang tải dữ liệu tồn kho từ sheet "${SHEETS.STOCK}"...`);
      if (view.els.refreshBtn) view.els.refreshBtn.disabled = true;

      const rows = await loadSheetRows({ sheetName: SHEETS.STOCK });
      const { items, monthLabel } = parseStockRows(rows);

      state.items = classifyStockItems(items, state.thresholds);
      if (monthLabel) state.monthLabel = monthLabel;
      state.loaded = true;

      view.renderMonthBadge(state.monthLabel);
      render();
      statusBar.clear();
    } catch (error) {
      console.error('Lỗi tải dữ liệu tồn kho:', error);
      statusBar.show(`Không tải được sheet "${SHEETS.STOCK}": ${error.message}`, 'error');
      view.renderError(error.message);
    } finally {
      if (view.els.refreshBtn) view.els.refreshBtn.disabled = false;
      state.loading = null;
    }
  })();

  return state.loading;
}

function render() {
  view.renderSummary(summarizeStock(state.items));
  renderTable();
}

function renderTable() {
  const filtered = filterStockItems(state.items, state);
  const isFiltered = state.filter !== 'all' || Boolean(state.searchQuery);

  view.renderInfoBar(isFiltered
    ? { count: filtered.length, total: state.items.length, ...sumStockAndRevenue(filtered) }
    : null);
  sortHeaders.update(state.sort);
  view.renderTable(sortStockItems(filtered, state.sort), state.thresholds);
}

function setFilter(filter) {
  state.filter = filter || 'all';
  view.renderFilterState(state.filter);
  renderTable();
}

function handleSort(column) {
  state.sort = nextSortState(state.sort, column, getDefaultStockSortDirection);
  renderTable();
}

function applyThresholds(thresholds, message) {
  state.thresholds = thresholds;
  view.renderThresholdLabels(thresholds);
  classifyStockItems(state.items, thresholds);
  render();
  statusBar.flash(message, STATUS_FLASH_MS.SHORT);
}

function exportCurrentView() {
  if (!state.items.length) {
    alert('Chưa có dữ liệu tồn kho để xuất. Vui lòng đợi dữ liệu tải xong hoặc bấm "Cập nhật".');
    return;
  }

  // Xuất đúng danh sách đang lọc; nếu bộ lọc không có kết quả thì xuất toàn bộ.
  const filtered = filterStockItems(state.items, state);
  const items = filtered.length ? filtered : state.items;

  try {
    const { count, fileName } = exportStockItems(items, {
      thresholds: state.thresholds,
      monthLabel: state.monthLabel
    });
    statusBar.flash(`Đã xuất thành công ${count} SKU ra file ${fileName}!`, STATUS_FLASH_MS.LONG);
  } catch (error) {
    console.error('Lỗi khi xuất file:', error);
    alert('Có lỗi khi tạo file xuất: ' + error.message);
  }
}

export default {
  id: 'stock',
  panelId: 'stockPanel',
  init,
  onActivate
};
