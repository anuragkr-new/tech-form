/**
 * Tech Form → Google Sheets webhook
 *
 * Receives new form submissions from the Tech Form app and appends them
 * as rows in the active spreadsheet.
 *
 * After editing: Deploy → Manage deployments → Edit → New version → Deploy
 */

const WEBHOOK_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET";

// Tab name for submissions. Leave blank ("") to use the spreadsheet's first sheet.
const SHEET_NAME = "Submissions";

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!SHEET_NAME) {
    return spreadsheet.getSheets()[0];
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeaders(sheet, columns) {
  if (sheet.getLastRow() > 0) {
    return;
  }

  sheet.appendRow(
    columns.map(function (column) {
      return column.label;
    }),
  );
}

function rowsFromPayload(payload) {
  if (payload.row) {
    return [payload.row];
  }

  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }

  return null;
}

function replaceSheetData(sheet, columns, rows) {
  sheet.clearContents();

  const header = columns.map(function (column) {
    return column.label;
  });

  if (header.length === 0) {
    return;
  }

  sheet.getRange(1, 1, 1, header.length).setValues([header]);

  if (rows.length === 0) {
    return;
  }

  const values = rows.map(function (row) {
    return columns.map(function (column) {
      var value = row[column.key];
      return value === undefined || value === null ? "" : String(value);
    });
  });

  sheet.getRange(2, 1, values.length + 1, header.length).setValues(values);
}

function appendRows(sheet, columns, rows) {
  ensureHeaders(sheet, columns);

  rows.forEach(function (row) {
    const values = columns.map(function (column) {
      var value = row[column.key];
      return value === undefined || value === null ? "" : String(value);
    });
    sheet.appendRow(values);
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ error: "Missing request body" });
    }

    const payload = JSON.parse(e.postData.contents);

    if (!payload.secret || payload.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ error: "Unauthorized" });
    }

    if (!Array.isArray(payload.columns)) {
      return jsonResponse({ error: "Invalid payload: columns required" });
    }

    const rows = rowsFromPayload(payload);
    if (!rows) {
      return jsonResponse({ error: "Invalid payload: row or rows required" });
    }

    const sheet = getOrCreateSheet();

    if (payload.mode === "replace") {
      replaceSheetData(sheet, payload.columns, rows);
    } else {
      appendRows(sheet, payload.columns, rows);
    }

    // Flush writes before returning so the client always sees persisted data
    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      synced: rows.length,
      sheet: sheet.getName(),
    });
  } catch (error) {
    return jsonResponse({
      error: error && error.message ? error.message : "Unexpected error",
    });
  }
}

function doGet() {
  return jsonResponse({
    status: "ok",
    message: "Tech Form Google Sheets webhook is running",
  });
}
