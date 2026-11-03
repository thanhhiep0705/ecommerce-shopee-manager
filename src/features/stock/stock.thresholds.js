/**
 * Đọc/ghi ngưỡng cảnh báo OOS trong localStorage.
 */

import { DEFAULT_STOCK_THRESHOLDS, STORAGE_KEYS } from '../../config.js';
import { storage } from '../../core/storage.js';
import { validateThresholds } from './stock.model.js';

export function loadThresholds() {
  const saved = storage.get(STORAGE_KEYS.STOCK_THRESHOLDS);
  if (saved && validateThresholds(saved) === null) {
    return { danger: saved.danger, warning: saved.warning };
  }
  return { ...DEFAULT_STOCK_THRESHOLDS };
}

export function saveThresholds(thresholds) {
  storage.set(STORAGE_KEYS.STOCK_THRESHOLDS, thresholds);
}

export function clearThresholds() {
  storage.remove(STORAGE_KEYS.STOCK_THRESHOLDS);
}

