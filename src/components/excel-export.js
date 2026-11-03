/**
 * Xuất dữ liệu dạng bảng ra file Excel (.xlsx qua SheetJS),
 * tự động chuyển sang CSV (UTF-8 BOM) nếu SheetJS không khả dụng.
 */

/**
 * @param {Object<string, any>[]} rows   mỗi phần tử là 1 dòng, key = tiêu đề cột
 * @param {{ fileName: string, sheetName?: string, columnWidths?: number[] }} options
 * @returns {{ fileName: string }} tên file đã xuất (kèm phần mở rộng)
 * @throws khi cả XLSX và CSV đều thất bại
 */
export function exportRowsToFile(rows, { fileName, sheetName = 'Sheet1', columnWidths = [] }) {
  if (window.XLSX && window.XLSX.utils) {
    try {
      const { XLSX } = window;
      const worksheet = XLSX.utils.json_to_sheet(rows);
      if (columnWidths.length) {
        worksheet['!cols'] = columnWidths.map(wch => ({ wch }));
      }
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      return { fileName: `${fileName}.xlsx` };
    } catch (error) {
      console.warn('Lỗi xuất với SheetJS, chuyển sang CSV:', error);
    }
  }

  downloadCsv(rows, `${fileName}.csv`);
  return { fileName: `${fileName}.csv` };
}

function downloadCsv(rows, fullFileName) {
  const headers = Object.keys(rows[0] || {});
  const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

