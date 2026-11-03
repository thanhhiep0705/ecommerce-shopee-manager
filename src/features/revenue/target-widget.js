/**
 * Widget "Trending vs Target": xem/sửa mục tiêu doanh thu,
 * lưu vào localStorage và đồng bộ lên URL hash (#target=...) để chia sẻ link.
 */

import { STORAGE_KEYS } from '../../config.js';
import { storage } from '../../core/storage.js';
import { getUrlParam, setHashParam } from '../../core/url-state.js';
import { byId, setText, setVisible } from '../../utils/dom.js';
import { formatCurrency, formatPercent, getChangeClass } from '../../utils/format.js';
import { parseDigits } from '../../utils/parse.js';
import { computeGrowth } from './revenue.model.js';

const URL_PARAM = 'target';

export function createTargetWidget() {
  const els = {
    viewMode: byId('targetViewMode'),
    editMode: byId('targetEditMode'),
    input: byId('dashboardTarget'),
    valueText: byId('targetValueText'),
    comparison: byId('trendingVsTarget'),
    editBtn: byId('editTargetBtn'),
    saveBtn: byId('saveTargetBtn'),
    cancelBtn: byId('cancelTargetBtn')
  };

  let target = loadInitialTarget();
  let trendingTotal = 0;
  let valueBeforeEdit = '';

  bindEvents();
  if (els.input) els.input.value = formatCurrency(target);
  persist(target);
  render();

  function bindEvents() {
    els.editBtn?.addEventListener('click', enterEditMode);
    els.saveBtn?.addEventListener('click', () => exitEditMode(true));
    els.cancelBtn?.addEventListener('click', () => exitEditMode(false));

    if (!els.input) return;
    els.input.addEventListener('input', formatInputWhileTyping);
    els.input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        exitEditMode(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitEditMode(false);
      }
    });
  }

  function enterEditMode() {
    if (!els.viewMode || !els.editMode) return;
    setVisible(els.viewMode, false);
    setVisible(els.editMode, true, 'flex');
    if (els.input) {
      valueBeforeEdit = els.input.value;
      els.input.focus();
      els.input.select();
    }
  }

  function exitEditMode(save) {
    if (!els.viewMode || !els.editMode) return;

    if (save) {
      target = parseDigits(els.input.value);
      storage.set(STORAGE_KEYS.REVENUE_TARGET, target);
      persist(target);
      render();
    } else if (els.input) {
      els.input.value = valueBeforeEdit;
    }

    setVisible(els.viewMode, true, 'flex');
    setVisible(els.editMode, false);
  }

  function render() {
    setText(els.valueText, target > 0 ? `${formatCurrency(target)} ₫` : 'Chưa đặt');
    if (!els.comparison) return;

    if (target <= 0) {
      els.comparison.textContent = 'Chưa đặt';
      els.comparison.className = 'change-flat';
      return;
    }

    const { diff, percent } = computeGrowth(target, trendingTotal);
    els.comparison.textContent = formatPercent(percent);
    els.comparison.className = getChangeClass(diff);
  }

  return {
    /** Cập nhật doanh thu dự báo để so sánh với mục tiêu. */
    setTrendingTotal(total) {
      trendingTotal = total;
      render();
    }
  };
}

/** Ưu tiên giá trị trên URL (và lưu lại), nếu không có thì đọc từ localStorage. */
function loadInitialTarget() {
  const urlValue = getUrlParam(URL_PARAM);
  if (urlValue !== null) {
    const parsed = parseInt(urlValue, 10);
    if (!Number.isNaN(parsed)) {
      storage.set(STORAGE_KEYS.REVENUE_TARGET, parsed);
      return parsed;
    }
  }

  return parseInt(storage.get(STORAGE_KEYS.REVENUE_TARGET, 0), 10) || 0;
}

function persist(target) {
  setHashParam(URL_PARAM, target > 0 ? target : null);
}

/** Định dạng phân cách hàng nghìn khi đang gõ, giữ vị trí con trỏ. */
function formatInputWhileTyping(event) {
  const input = event.target;
  const originalLength = input.value.length;
  const cursorPosition = input.selectionStart;

  const digits = input.value.replace(/[^\d]/g, '');
  if (!digits) {
    input.value = '';
    return;
  }

  const formatted = parseInt(digits, 10).toLocaleString('vi-VN');
  input.value = formatted;

  const newCursorPos = Math.max(0, Math.min(cursorPosition + formatted.length - originalLength, formatted.length));
  input.setSelectionRange(newCursorPos, newCursorPos);
}

