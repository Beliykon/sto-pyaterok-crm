import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addYears,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday as checkIsToday,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { RU_MONTHS, getRuDayShort } from '../lib/dateUtils';
import { Appointment } from '../lib/types';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
}

export default function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  appointments,
}: DatePickerModalProps) {
  const [currentViewDate, setCurrentViewDate] = useState<Date>(selectedDate);

  if (!isOpen) return null;

  const currentYear = currentViewDate.getFullYear();
  const currentMonthIndex = currentViewDate.getMonth();

  // Allowed years range: 2025 to 2028 (1 to 2 years ahead)
  const years = [2025, 2026, 2027, 2028];

  const handlePrevMonth = () => setCurrentViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentViewDate(prev => addMonths(prev, 1));

  const handleYearChange = (year: number) => {
    const next = new Date(currentViewDate);
    next.setFullYear(year);
    setCurrentViewDate(next);
  };

  const handleMonthChange = (monthIdx: number) => {
    const next = new Date(currentViewDate);
    next.setMonth(monthIdx);
    setCurrentViewDate(next);
  };

  const handleQuickJump = (action: 'today' | '+1m' | '+3m' | '+6m' | '+1y' | '+2y') => {
    const now = new Date();
    let target = new Date();
    if (action === 'today') {
      target = now;
    } else if (action === '+1m') {
      target = addMonths(now, 1);
    } else if (action === '+3m') {
      target = addMonths(now, 3);
    } else if (action === '+6m') {
      target = addMonths(now, 6);
    } else if (action === '+1y') {
      target = addYears(now, 1);
    } else if (action === '+2y') {
      target = addYears(now, 2);
    }

    setCurrentViewDate(target);
    onSelectDate(target);
    onClose();
  };

  // Generate day grid for currentViewDate month
  const monthStart = startOfMonth(currentViewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let dayCursor = calendarStart;
  while (dayCursor <= calendarEnd) {
    days.push(dayCursor);
    dayCursor = addDays(dayCursor, 1);
  }

  const weekDayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Календарь расписания</h3>
              <p className="text-[11px] text-slate-300">
                Быстрый выбор недели и даты на 1–2 года вперёд (2026–2028)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Jump Buttons */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Быстрый переход:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickJump('today')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors text-slate-700"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump('+1m')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors text-slate-700"
              >
                +1 месяц
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump('+3m')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors text-slate-700"
              >
                +3 месяца
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump('+6m')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors text-slate-700"
              >
                +6 месяцев
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump('+1y')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition-colors"
              >
                +1 год (2027)
              </button>
              <button
                type="button"
                onClick={() => handleQuickJump('+2y')}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition-colors"
              >
                +2 года (2028)
              </button>
            </div>
          </div>

          {/* Month & Year Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>

              <select
                value={currentMonthIndex}
                onChange={e => handleMonthChange(Number(e.target.value))}
                className="text-xs font-extrabold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
              >
                {RU_MONTHS.map((month, idx) => (
                  <option key={month} value={idx}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={e => handleYearChange(Number(e.target.value))}
                className="text-xs font-extrabold text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 outline-none"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y} год
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Direct date picker */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Точная дата:</span>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                min="2025-01-01"
                max="2028-12-31"
                onChange={e => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    const newD = new Date(y, m - 1, d);
                    onSelectDate(newD);
                    setCurrentViewDate(newD);
                    onClose();
                  }
                }}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2 text-[11px] font-bold text-slate-600 uppercase">
              {weekDayHeaders.map(day => (
                <div key={day} className={day === 'Сб' || day === 'Вс' ? 'text-amber-600' : ''}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
              {days.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentViewDate);
                const isDayToday = checkIsToday(day);
                const dayStr = format(day, 'yyyy-MM-dd');
                const appsOnDay = appointments.filter(
                  a => a.date === dayStr && a.status !== 'cancelled'
                ).length;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onSelectDate(day);
                      onClose();
                    }}
                    className={`h-12 p-1 relative flex flex-col items-center justify-between transition-colors ${
                      !isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'hover:bg-indigo-50/70 text-slate-800'
                    } ${isSelected ? 'bg-indigo-600 text-white font-extrabold hover:bg-indigo-600' : ''}`}
                  >
                    <span
                      className={`text-xs ${
                        isDayToday && !isSelected
                          ? 'w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {appsOnDay > 0 && (
                      <span
                        className={`text-[9px] px-1 rounded-full font-bold leading-tight ${
                          isSelected ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {appsOnDay}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Выбрано:{' '}
              <strong className="text-slate-800 font-bold">
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })} ({getRuDayShort(selectedDate)})
              </strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Применить дату
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
