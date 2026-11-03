/**
 * Feature: Doanh thu (so sánh tháng này với tháng trước theo sản phẩm / phân loại).
 */

import { REVENUE_MAX_PRODUCTS, SHEETS } from '../../config.js';
import { loadSheetRows } from '../../core/sheets-client.js';
import { createStatusBar } from '../../components/status-bar.js';
import { createSortableHeaders, nextSortState } from '../../components/sortable-header.js';
import { getMonthNames } from '../../utils/date.js';
import { parseRevenueRows } from './revenue.parser.js';
import {
  buildRevenueTree,
  computeGrowth,
  filterRevenueTree,
  sortRevenueTree,
  summarizeRevenueTree
} from './revenue.model.js';
import { revenueState as state } from './revenue.state.js';
import { createRevenueView } from './revenue.view.js';
import { createTargetWidget } from './target-widget.js';

let view;
let statusBar;
let sortHeaders;
let targetWidget;

function init() {
  view = createRevenueView();
  statusBar = createStatusBar(view.els.status);
  sortHeaders = createSortableHeaders(view.els.sortHeaders, {
    dataKey: 'sort',
    activeClass: 'active-sort',
    onSort: handleSort
  });

  view.renderMonthLabels(getMonthNames());
  targetWidget = createTargetWidget();

  view.els.refreshBtn.addEventListener('click', loadData);
  view.els.searchInput.addEventListener('input', event => {
    state.searchQuery = event.target.value.trim();
    render();
  });
  view.els.toggleAllBtn?.addEventListener('click', toggleAllProducts);
  view.els.treeBody.addEventListener('click', handleTreeClick);
}

function onActivate() {
  if (!state.loaded) loadData();
}

async function loadData() {
  if (state.loading) return state.loading;

  state.loading = (async () => {
    try {
      statusBar.show('Đang lấy dữ liệu Dashboard...');
      view.els.refreshBtn.disabled = true;

      const [lastMonthRows, thisMonthRows] = await Promise.all([
        loadSheetRows({ sheetName: SHEETS.LAST_MONTH_REVENUE }),
        loadSheetRows({ sheetName: SHEETS.THIS_MONTH_REVENUE })
      ]);

      const lastMonth = parseRevenueRows(lastMonthRows, SHEETS.LAST_MONTH_REVENUE);
      const thisMonth = parseRevenueRows(thisMonthRows, SHEETS.THIS_MONTH_REVENUE);

      state.tree = sortRevenueTree(buildRevenueTree(lastMonth, thisMonth), state.sort);
      state.loaded = true;

      view.renderSummary({
        lastTotal: lastMonth.totalRevenue,
        thisTotal: thisMonth.totalRevenue,
        trendingTotal: thisMonth.totalTrending,
        ...computeGrowth(lastMonth.totalRevenue, thisMonth.totalTrending)
      });
      targetWidget.setTrendingTotal(thisMonth.totalTrending);
      render();
      statusBar.show('Đã cập nhật Dashboard.', 'ok');
    } catch (error) {
      console.error(error);
      statusBar.show(`Lỗi: ${error.message}`, 'error');
    } finally {
      view.els.refreshBtn.disabled = false;
      state.loading = null;
    }
  })();

  return state.loading;
}

function render() {
  const filtered = filterRevenueTree(state.tree, state.searchQuery);

  sortHeaders.update(state.sort);
  view.renderToggleAllIcon(state.collapsedIds.size === 0);
  view.renderSearchSummary(state.searchQuery ? summarizeRevenueTree(filtered) : null);
  view.renderTree(filtered.slice(0, REVENUE_MAX_PRODUCTS), {
    collapsedIds: state.collapsedIds,
    emptyMessage: state.tree.length ? 'Không tìm thấy mã phù hợp.' : 'Chưa có dữ liệu.'
  });
}

function handleSort(column) {
  state.sort = nextSortState(state.sort, column, col => (col === 'name' ? 'asc' : 'desc'));
  sortRevenueTree(state.tree, state.sort);
  render();
}

function toggleAllProducts() {
  const shouldCollapseAll = state.collapsedIds.size === 0;

  if (shouldCollapseAll) {
    state.tree.forEach(product => state.collapsedIds.add(product.key));
  } else {
    state.collapsedIds.clear();
  }

  render();
}

function handleTreeClick(event) {
  const cell = event.target.closest('.revenue-product-row td:first-child');
  const toggleBtn = cell?.querySelector('.toggle-variants-btn');
  if (!toggleBtn) return;

  const { productId } = toggleBtn.dataset;
  const willCollapse = !state.collapsedIds.has(productId);

  if (willCollapse) {
    state.collapsedIds.add(productId);
  } else {
    state.collapsedIds.delete(productId);
  }

  view.setProductCollapsed(toggleBtn, productId, willCollapse);
  view.renderToggleAllIcon(state.collapsedIds.size === 0);
}

export default {
  id: 'revenue',
  panelId: 'dashboardPanel',
  init,
  onActivate
};

