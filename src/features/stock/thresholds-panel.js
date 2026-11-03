/**
 * Panel cài đặt ngưỡng ngày cảnh báo OOS (Nguy hiểm / Cảnh báo).
 */

import { DEFAULT_STOCK_THRESHOLDS } from '../../config.js';
import { byId, setText, setVisible } from '../../utils/dom.js';
import { validateThresholds } from './stock.model.js';

/**
 * @param {{
 *   getThresholds: () => { danger: number, warning: number },
 *   onSave: (thresholds: { danger: number, warning: number }) => void,
 *   onReset: () => void
 * }} handlers
 */
export function createThresholdsPanel({ getThresholds, onSave, onReset }) {
  const els = {
    panel: byId('stockThresholdPanel'),
    toggleBtn: byId('stockConfigBtn'),
    closeBtn: byId('closeStockConfigBtn'),
    cancelBtn: byId('cancelStockConfigBtn'),
    saveBtn: byId('saveStockThresholdsBtn'),
    resetBtn: byId('resetStockThresholdsBtn'),
    dangerInput: byId('inputDangerDays'),
    warningInput: byId('inputWarningDays'),
    safeHint: byId('hintSafeVal')
  };

  if (!els.panel) return;

  fillInputs(getThresholds());

  els.toggleBtn?.addEventListener('click', () => {
    const isOpening = els.panel.style.display === 'none';
    if (isOpening) {
      open();
    } else {
      close();
    }
  });
  els.closeBtn?.addEventListener('click', close);
  els.cancelBtn?.addEventListener('click', close);
  els.dangerInput?.addEventListener('input', updateSafeHint);
  els.warningInput?.addEventListener('input', updateSafeHint);
  els.saveBtn?.addEventListener('click', save);
  els.resetBtn?.addEventListener('click', reset);

  function open() {
    setVisible(els.panel, true, 'block');
    els.toggleBtn?.classList.add('active');
    fillInputs(getThresholds());
  }

  /** Đóng panel và bỏ các thay đổi chưa lưu. */
  function close() {
    setVisible(els.panel, false);
    els.toggleBtn?.classList.remove('active');
    fillInputs(getThresholds());
  }

  function save() {
    const thresholds = {
      danger: parseInt(els.dangerInput.value, 10),
      warning: parseInt(els.warningInput.value, 10)
    };

    const error = validateThresholds(thresholds);
    if (error) {
      alert(error.message);
      (error.field === 'danger' ? els.dangerInput : els.warningInput).focus();
      return;
    }

    onSave(thresholds);
    close();
  }

  function reset() {
    fillInputs(DEFAULT_STOCK_THRESHOLDS);
    onReset();
    close();
  }

  function fillInputs({ danger, warning }) {
    if (els.dangerInput) els.dangerInput.value = danger;
    if (els.warningInput) els.warningInput.value = warning;
    updateSafeHint();
  }

  function updateSafeHint() {
    const fallback = getThresholds().warning;
    const warning = parseInt(els.warningInput ? els.warningInput.value : fallback, 10) || fallback;
    setText(els.safeHint, `> ${warning} ngày`);
  }
}

