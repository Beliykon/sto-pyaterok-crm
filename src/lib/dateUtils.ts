import { format as dateFnsFormat, addMonths, addYears, subMonths, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

export const RU_DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const RU_DAYS_FULL = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export const RU_MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

/**
 * Returns clean Russian short day name: 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'
 */
export function getRuDayShort(date: Date): string {
  const dayIndex = date.getDay();
  return RU_DAYS_SHORT[dayIndex];
}

/**
 * Returns clean Russian full day name: 'Понедельник', 'Вторник', ...
 */
export function getRuDayFull(date: Date): string {
  const dayIndex = date.getDay();
  return RU_DAYS_FULL[dayIndex];
}

/**
 * Formats date in Russian locale
 */
export function formatRu(date: Date, formatStr: string): string {
  return dateFnsFormat(date, formatStr, { locale: ru });
}

/**
 * Returns readable Russian week range: "14 сентября – 20 сентября 2026"
 */
export function getRuWeekRange(startDate: Date): string {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const startStr = dateFnsFormat(weekStart, 'd MMMM', { locale: ru });
  const endStr = dateFnsFormat(weekEnd, 'd MMMM yyyy', { locale: ru });
  return `${startStr} – ${endStr}`;
}
