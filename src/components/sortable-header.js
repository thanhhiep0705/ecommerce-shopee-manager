/**
 * Header bảng có thể click để sort, hiển thị icon ▲ ▼ ↕.
 */

/**
 * Tính trạng thái sort mới khi người dùng click vào một cột.
 * Click lại cột đang sort → đảo chiều; click cột khác → dùng chiều mặc định của cột đó.
 * @param {{ column: string, direction: 'asc'|'desc' }} current
 * @param {string} column
 * @param {(column: string) => 'asc'|'desc'} getDefaultDirection
 */
export function nextSortState(current, column, getDefaultDirection) {
  if (current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { column, direction: getDefaultDirection(column) };
}

/**
 * @param {HTMLElement[]} headers  các <th> có data-attribute chứa key cột
 * @param {{
 *   dataKey: string,              // tên thuộc tính trong dataset, vd 'sort' cho data-sort
 *   onSort: (column: string) => void,
 *   activeClass?: string,         // class gắn vào <th> đang sort
 *   activeIconColor?: string      // màu inline cho icon của cột đang sort
 * }} options
 */
export function createSortableHeaders(headers, { dataKey, onSort, activeClass, activeIconColor }) {
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset[dataKey];
      if (column) onSort(column);
    });
  });

  function update({ column: activeColumn, direction }) {
    headers.forEach(header => {
      const isActive = header.dataset[dataKey] === activeColumn;
      const icon = header.querySelector('.sort-icon');

      if (icon) {
        icon.textContent = isActive ? (direction === 'asc' ? ' ▲' : ' ▼') : ' ↕';
        if (activeIconColor) {
          icon.style.color = isActive ? activeIconColor : '';
        }
      }

      if (activeClass) {
        header.classList.toggle(activeClass, isActive);
      }
    });
  }

  return { update };
}

