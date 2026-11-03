/**
 * Điểm khởi động ứng dụng.
 *
 * Thêm tính năng (tab) mới:
 *   1. Tạo thư mục src/features/<ten-feature>/ với index.js export { id, panelId, init, onActivate }
 *   2. Thêm nút tab + <section class="tab-panel"> trong index.html
 *   3. Import và thêm feature vào mảng bên dưới
 *   4. (Nếu có CSS riêng) tạo styles/features/<ten-feature>.css và @import trong styles/main.css
 */

import { registerFeatures } from './core/feature-registry.js';
import revenue from './features/revenue/index.js';
import stock from './features/stock/index.js';

registerFeatures([
  revenue,
  stock
]);

