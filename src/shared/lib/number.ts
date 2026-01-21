/**
 * Formats a number with thousand separators.
 * @param value The number to format.
 * @param maximumFractionDigits Number of decimal places.
 */
export function formatNumber(value: number | string, maximumFractionDigits: number = 0): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    return num.toLocaleString('ru-RU', {
        maximumFractionDigits,
    });
}

/**
 * Parses a string with separators back to a number.
 */
export function parseFormattedNumber(value: string): number {
    // Remove non-breaking spaces and other common separators
    const cleaned = value.replace(/[\s\u00A0,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}
