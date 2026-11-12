/**
 * CSV for admin exports. Every value is quoted; values that a spreadsheet would run as a
 * formula (starting with = + - @ or a tab/return) get a leading apostrophe.
 */
export type CsvValue = string | number | boolean | Date | null | undefined;

export function csvCell(v: CsvValue): string {
    if (v === null || v === undefined) return '""';
    let s = v instanceof Date ? v.toISOString() : String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
    return [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
