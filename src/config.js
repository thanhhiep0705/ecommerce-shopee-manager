/**
 * Cấu hình tập trung của ứng dụng.
 * Mọi hằng số (ID sheet, tên sheet, storage key, giá trị mặc định) đặt tại đây.
 */

export const GOOGLE_SHEET_ID = '1Pi__I2Uwd3OTGp7ff8Ju6qC0oQHidTZMu11ljZbNPM4';

export const SHEETS = Object.freeze({
  LAST_MONTH_REVENUE: 'Last Month',
  THIS_MONTH_REVENUE: 'This Month',
  STOCK: 'Follow STOCK'
});

export const SHEET_REQUEST_TIMEOUT_MS = 20000;

export const STORAGE_KEYS = Object.freeze({
  REVENUE_TARGET: 'flashSaleDashboardTarget',
  STOCK_THRESHOLDS: 'miSalesStockThresholds'
});

/** Số sản phẩm tối đa hiển thị trong bảng doanh thu. */
export const REVENUE_MAX_PRODUCTS = 100;

export const DEFAULT_STOCK_THRESHOLDS = Object.freeze({
  danger: 14,
  warning: 30
});

/** Thời gian (ms) hiển thị các thông báo tạm thời. */
export const STATUS_FLASH_MS = Object.freeze({
  SHORT: 3500,
  LONG: 4000
});

