export function startOfIsoWeek(d: Date) {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // 0 Mon .. 6 Sun
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day);
    return date;
}

export function isoWeekKey(d: Date) {
    const date = new Date(d);
    // ISO week number
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const firstThursdayDayNr = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNr + 3);
    const weekNo = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
    const year = target.getFullYear();
    const ww = String(weekNo).padStart(2, '0');
    return `${year}-W${ww}`;
}

export function getStartOfWeekFromIso(weekIso: string) {
    const [yearStr, weekStr] = weekIso.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    const simple = new Date(year, 0, 4);
    const day = (simple.getDay() + 6) % 7;
    simple.setDate(simple.getDate() - day + (week - 1) * 7);
    simple.setHours(0, 0, 0, 0);
    return simple;
}
