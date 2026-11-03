const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Tên viết tắt của tháng hiện tại và tháng trước, ví dụ { thisMonth: 'Nov', lastMonth: 'Oct' }. */
export function getMonthNames(date = new Date()) {
  const currentMonthIdx = date.getMonth();
  const lastMonthIdx = (currentMonthIdx + 11) % 12;

  return {
    thisMonth: MONTH_NAMES[currentMonthIdx],
    lastMonth: MONTH_NAMES[lastMonthIdx]
  };
}

/** Nhãn tháng + năm, ví dụ "Nov 2026". */
export function getMonthYearLabel(date = new Date()) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

