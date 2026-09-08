import { saveAs } from "file-saver";

export async function exportExcel(rows, sheetName, filename) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const columns = Object.keys(rows[0] || {});
  sheet.addRow(columns);
  rows.forEach((row) => sheet.addRow(columns.map((column) => row[column])));
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

export function toCSV(rows) {
  const columns = Object.keys(rows[0] || {});
  const escape = (value) => {
    let text = String(value ?? "");
    if (typeof value === "string" && /^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return [columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(escape).join(",")).join("\r\n");
}

export function exportCSV(rows, filename) {
  saveAs(new Blob(["\uFEFF", toCSV(rows)], { type: "text/csv;charset=utf-8;" }), filename);
}
