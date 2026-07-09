type CsvColumn = {
  key: string;
  label: string;
};

type CsvRow = Record<string, string>;

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(columns: CsvColumn[], rows: CsvRow[]): string {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvValue(row[column.key] ?? "")).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}
