import React, { useMemo } from 'react';
import { Tutor, TutorSlot, Appointment } from '../lib/types';
import { 
  X, 
  Calendar, 
  Clock, 
  Check, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TutorSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  weekStart: Date;
  openSlots: TutorSlot[];
  appointments: Appointment[];
  onToggleSlot: (tutorId: string, date: string, time: string) => void;
  onBatchSetSlots: (newSlots: TutorSlot[], weekDateStrs: string[]) => void;
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function TutorSlotsModal({
  isOpen,
  onClose,
  tutor,
  weekStart,
  openSlots,
  appointments,
  onToggleSlot,
  onBatchSetSlots,
}: TutorSlotsModalProps) {
  if (!isOpen) return null;

  // 7 days of the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Check if slot has appointment
  const hasAppointment = (dateStr: string, time: string) => {
    return appointments.some(
      a => a.tutorId === tutor.id && a.date === dateStr && a.startTime === time && a.status !== 'cancelled'
    );
  };

  const getAppointmentName = (dateStr: string, time: string) => {
    const app = appointments.find(
      a => a.tutorId === tutor.id && a.date === dateStr && a.startTime === time && a.status !== 'cancelled'
    );
    return app ? app.studentName : null;
  };

  // Check if slot is open
  const isSlotOpen = (dateStr: string, time: string) => {
    return openSlots.some(
      s => s.tutorId === tutor.id && s.date === dateStr && s.time === time
    );
  };

  // Count open slots for this tutor this week
  const currentWeekDateStrs = weekDays.map(d => format(d, 'yyyy-MM-dd'));
  const activeWeekOpenSlotsCount = openSlots.filter(
    s => s.tutorId === tutor.id && currentWeekDateStrs.includes(s.date)
  ).length;

  // Template: Weekdays evening (15:00 - 21:00)
  const applyTemplateWeekdayEvenings = () => {
    const newSlots = [...openSlots];
    const targetHours = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    
    // Days 0 to 4 (Mon to Fri)
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const dateStr = format(weekDays[dayIdx], 'yyyy-MM-dd');
      targetHours.forEach(time => {
        if (!hasAppointment(dateStr, time) && !isSlotOpen(dateStr, time)) {
          newSlots.push({
            id: `slot-${tutor.id}-${dateStr}-${time}`,
            tutorId: tutor.id,
            date: dateStr,
            time,
            isBooked: false,
          });
        }
      });
    }
    onBatchSetSlots(newSlots, currentWeekDateStrs);
  };

  // Template: Full day weekdays (11:00 - 20:00)
  const applyTemplateWeekdayFull = () => {
    const newSlots = [...openSlots];
    const targetHours = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    
    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const dateStr = format(weekDays[dayIdx], 'yyyy-MM-dd');
      targetHours.forEach(time => {
        if (!hasAppointment(dateStr, time) && !isSlotOpen(dateStr, time)) {
          newSlots.push({
            id: `slot-${tutor.id}-${dateStr}-${time}`,
            tutorId: tutor.id,
            date: dateStr,
            time,
            isBooked: false,
          });
        }
      });
    }
    onBatchSetSlots(newSlots, currentWeekDateStrs);
  };

  // Template: Weekend slots (10:00 - 18:00)
  const applyTemplateWeekends = () => {
    const newSlots = [...openSlots];
    const targetHours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    // Sat (idx 5) and Sun (idx 6)
    [5, 6].forEach(dayIdx => {
      const dateStr = format(weekDays[dayIdx], 'yyyy-MM-dd');
      targetHours.forEach(time => {
        if (!hasAppointment(dateStr, time) && !isSlotOpen(dateStr, time)) {
          newSlots.push({
            id: `slot-${tutor.id}-${dateStr}-${time}`,
            tutorId: tutor.id,
            date: dateStr,
            time,
            isBooked: false,
          });
        }
      });
    });
    onBatchSetSlots(newSlots, currentWeekDateStrs);
  };

  // Clear this week's open slots
  const handleClearWeekSlots = () => {
    const filtered = openSlots.filter(
      s => !(s.tutorId === tutor.id && currentWeekDateStrs.includes(s.date))
    );
    onBatchSetSlots(filtered, currentWeekDateStrs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Управление свободными слотами расписания
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {activeWeekOpenSlotsCount} окон открыто
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Преподаватель: <strong className="text-slate-700">{tutor.name}</strong> • Неделя с {format(weekStart, 'd MMMM', { locale: ru })} по {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: ru })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates Banner */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-indigo-900">
            <Zap size={15} className="text-indigo-600 shrink-0" />
            <span className="font-semibold">Быстрое заполнение по шаблону:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={applyTemplateWeekdayEvenings}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
              title="Открыть Пн-Пт с 15:00 до 21:00"
            >
              <span>🌙 Будни вечер (15–21)</span>
            </button>

            <button
              type="button"
              onClick={applyTemplateWeekdayFull}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
              title="Открыть Пн-Пт с 11:00 до 20:00"
            >
              <span>☀️ Будни весь день (11–20)</span>
            </button>

            <button
              type="button"
              onClick={applyTemplateWeekends}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
              title="Открыть Сб-Вс с 10:00 до 18:00"
            >
              <span>🎯 Выходные (10–18)</span>
            </button>

            <button
              type="button"
              onClick={handleClearWeekSlots}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
              title="Очистить все свободные окна этой недели"
            >
              <Trash2 size={12} />
              <span>Очистить неделю</span>
            </button>
          </div>
        </div>

        {/* Instructions strip */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200/70 text-[11px] text-slate-600 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <Info size={13} className="text-slate-400" />
            <span>Кликайте по ячейкам, чтобы включить/выключить свободный слот для записи МОП. Зелёные слоты видны отделу продаж!</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-emerald-800">Свободно для МОП</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="font-semibold text-indigo-800">Занято уроком</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span className="font-semibold text-slate-500">Закрыто</span>
            </span>
          </div>
        </div>

        {/* Interactive Grid Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="min-w-[650px] border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Table Header: 7 Days */}
            <div className="grid grid-cols-8 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-700">
              <div className="p-2.5 text-center border-r border-slate-200 bg-slate-200/60 flex items-center justify-center">
                <Clock size={14} className="text-slate-500 mr-1" />
                <span>Время</span>
              </div>
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = idx >= 5;
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 text-center border-r last:border-r-0 border-slate-200 ${
                      isToday ? 'bg-indigo-50 text-indigo-900 font-black' : isWeekend ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="uppercase text-[10px] tracking-wider text-slate-500">
                      {format(day, 'EEEEEE', { locale: ru })}
                    </div>
                    <div className="text-xs">
                      {format(day, 'd MMM', { locale: ru })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Body: Hours */}
            <div className="divide-y divide-slate-100">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 text-xs hover:bg-slate-50/50 transition-colors">
                  {/* Hour label */}
                  <div className="p-2 text-center font-bold text-slate-500 border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                    {hour}
                  </div>

                  {/* 7 Days cells */}
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const booked = hasAppointment(dateStr, hour);
                    const student = getAppointmentName(dateStr, hour);
                    const open = isSlotOpen(dateStr, hour);

                    if (booked) {
                      return (
                        <div
                          key={`${dateStr}-${hour}`}
                          className="p-1.5 border-r last:border-r-0 border-slate-200 bg-indigo-50/70 text-indigo-900 flex flex-col items-center justify-center text-[10px] font-semibold cursor-not-allowed select-none"
                          title={`Занято уроком: ${student}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mb-0.5"></span>
                          <span className="truncate max-w-[80px] font-bold">{student}</span>
                          <span className="text-[9px] text-indigo-600">Урок</span>
                        </div>
                      );
                    }

                    if (open) {
                      return (
                        <button
                          key={`${dateStr}-${hour}`}
                          type="button"
                          onClick={() => onToggleSlot(tutor.id, dateStr, hour)}
                          className="p-1.5 border-r last:border-r-0 border-slate-200 bg-emerald-100/80 hover:bg-rose-100 text-emerald-900 hover:text-rose-800 transition-colors flex flex-col items-center justify-center group relative cursor-pointer"
                          title="Кликните, чтобы закрыть окно"
                        >
                          <span className="flex items-center space-x-1 font-bold text-[11px] group-hover:hidden">
                            <Check size={11} className="text-emerald-700 stroke-[3]" />
                            <span>Свободно</span>
                          </span>
                          <span className="hidden group-hover:flex items-center space-x-1 font-bold text-[11px] text-rose-700">
                            <X size={11} className="stroke-[3]" />
                            <span>Закрыть</span>
                          </span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={`${dateStr}-${hour}`}
                        type="button"
                        onClick={() => onToggleSlot(tutor.id, dateStr, hour)}
                        className="p-1.5 border-r last:border-r-0 border-slate-200 bg-white hover:bg-emerald-50 text-slate-300 hover:text-emerald-700 transition-colors flex items-center justify-center group cursor-pointer"
                        title="Кликните, чтобы открыть слот для записи МОП"
                      >
                        <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 text-emerald-700">
                          <span>+ Открыть</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            Всего доступно слотов на эту неделю: <strong className="text-emerald-700 font-bold">{activeWeekOpenSlotsCount}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Check size={14} />
            <span>Готово (Сохранено)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
