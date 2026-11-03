/**
 * Đăng ký các feature (mỗi feature ứng với một tab) và điều phối chuyển tab.
 *
 * Interface của một feature:
 * {
 *   id: string,           // định danh
 *   panelId: string,      // id của <section class="tab-panel"> tương ứng
 *   init(): void,         // gắn event, đọc config — gọi đúng 1 lần khi khởi động
 *   onActivate?(): void   // gọi mỗi khi tab được mở (dùng để lazy-load dữ liệu)
 * }
 */

import { $$, byId } from '../utils/dom.js';

export function registerFeatures(features) {
  const tabButtons = $$('.app-header .tab-button');
  const tabPanels = $$('.tab-panel');
  const featureByPanel = new Map(features.map(feature => [feature.panelId, feature]));

  features.forEach(feature => feature.init());

  tabButtons.forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  function activateTab(panelId) {
    if (!panelId) return;

    tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === panelId));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    const panel = byId(panelId);
    if (panel) panel.classList.add('active');

    featureByPanel.get(panelId)?.onActivate?.();
  }

  // Kích hoạt feature của tab đang mở sẵn khi tải trang.
  const initialPanel = tabPanels.find(panel => panel.classList.contains('active'));
  if (initialPanel) {
    featureByPanel.get(initialPanel.id)?.onActivate?.();
  }
}

