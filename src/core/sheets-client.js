/**
 * Client đọc dữ liệu Google Sheet qua endpoint gviz (JSONP).
 * Sheet cần được share "Anyone with the link can view".
 */

import { GOOGLE_SHEET_ID, SHEET_REQUEST_TIMEOUT_MS } from '../config.js';
import { cleanCell } from '../utils/parse.js';

/**
 * Tải một sheet và trả về mảng 2 chiều: [headerRow, ...bodyRows].
 * @param {{ sheetName?: string, gid?: string, sheetId?: string }} options
 * @returns {Promise<string[][]>}
 */
export function loadSheetRows({ sheetName, gid, sheetId = GOOGLE_SHEET_ID } = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `googleSheetCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheet phản hồi quá lâu. Kiểm tra kết nối mạng hoặc quyền share của sheet.'));
    }, SHEET_REQUEST_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = response => {
      cleanup();

      try {
        if (!response || response.status === 'error') {
          const message = response && response.errors && response.errors[0]
            ? response.errors[0].detailed_message || response.errors[0].message
            : 'Không đọc được dữ liệu Google Sheet.';
          reject(new Error(message));
          return;
        }

        resolve(convertGoogleTableToRows(response.table));
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Không tải được Google Sheet. Sheet cần được share "Anyone with the link can view".'));
    };

    const query = new URLSearchParams({
      tqx: `out:json;responseHandler:${callbackName}`
    });

    if (gid) query.set('gid', gid);
    if (sheetName) query.set('sheet', sheetName);

    script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${query.toString()}`;
    document.body.appendChild(script);
  });
}

function convertGoogleTableToRows(table) {
  if (!table || !Array.isArray(table.rows)) {
    throw new Error('Dữ liệu Google Sheet không đúng định dạng.');
  }

  const header = table.cols.map(col => cleanCell(col.label || col.id));
  const body = table.rows.map(row =>
    table.cols.map((_, index) => {
      const cell = row.c && row.c[index];
      if (!cell) return '';
      return cleanCell(cell.f || cell.v);
    })
  );

  return [header, ...body];
}

