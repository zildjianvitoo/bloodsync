const newline = "\r\n";

function escapeValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (!rows.length) {
    const headerLine = (headers ?? []).map(escapeValue).join(",");
    return headerLine ? `${headerLine}${newline}` : "";
  }

  const columnOrder = headers ?? Object.keys(rows[0]!);
  const lines: string[] = [];
  lines.push(columnOrder.map(escapeValue).join(","));

  for (const row of rows) {
    lines.push(
      columnOrder
        .map((key) => {
          const value = row[key as keyof typeof row];
          if (value instanceof Date) {
            return escapeValue(value.toISOString());
          }
          return escapeValue(value as string | number | boolean | null | undefined);
        })
        .join(",")
    );
  }

  return lines.join(newline) + newline;
}
