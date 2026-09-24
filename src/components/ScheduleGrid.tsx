import React, { useState, useEffect } from 'react';
import { Tutor, Appointment, UserRole } from '../lib/types';
import { format, isSameDay, isBefore } from 'date-fns';
import { getRuDayShort } from '../lib/dateUtils';
import { 
  matchesGradeFilter, 
  matchesGoalFilter, 
  matchesLessonTypeFilter, 
  tutorMatchesFilters, 
  isTrialLesson 
} from '../lib/filterUtils';
import { 
  Clock, 
  Plus, 
  GripVertical, 
  Move, 
  CheckCircle2, 
  Sparkles, 
  User,
  ToggleLeft,
  ToggleRight,
  Award,
  Lock,
  Zap,
  Tag,
  DollarSign,
  XCircle,
  Clock4
} from 'lucide-react';

interface ScheduleGridProps {
  tutors: Tutor[];
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekDays: Date[];
  role: UserRole;
  selectedTutorId?: string;
  openSlots: Record<string, boolean>; // key: `${tutorId}_${date}_${hour}`
  onToggleSlot: (tutorId: string, date: string, hour: string) => void;
  onOpenBooking: (tutorId?: string, dateStr?: string, timeStr?: string) => void;
  onOpenLessonDetail: (appointment: Appointment) => void;
  onRescheduleAppointment: (
    appointmentId: string, 
    newTutorId: string, 
    newDate: string, 
    newStartTime: string
  ) => void;
  selectedSubject: string;
  selectedGradeFilter?: string;
  selectedGoalFilter?: string;
  selectedTypeFilter?: string;
  onOpenTutorSlotsModal?: (tutor: Tutor) => void;
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function ScheduleGrid({
  tutors,
  appointments,
  selectedDate,
  onSelectDate,
  weekDays,
  role,
  selectedTutorId,
  openSlots,
  onToggleSlot,
  onOpenBooking,
  onOpenLessonDetail,
  onRescheduleAppointment,
  selectedSubject,
  selectedGradeFilter = 'all',
  selectedGoalFilter = 'all',
  selectedTypeFilter = 'all',
  onOpenTutorSlotsModal,
}: ScheduleGridProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{
    tutorId: string;
    hour: string;
    isOccupied: boolean;
  } | null>(null);

  // Feature 1: Current Time Red Line State (updates every 30 seconds)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  // Red line calculations: grid is 09:00 to 22:00 (13 rows, each 80px, header ~64px)
  const isToday = isSameDay(selectedDate, currentTime);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isTimeInGrid = currentHour >= 9 && currentHour <= 21;
  const redLineTopPx = 64 + ((currentHour - 9) + currentMinute / 60) * 80;

  // Filter tutors by selected subject, grade, goal and specific tutor if tutor role
  const filteredTutors = tutors.filter(t => {
    // Tutor single view filter
    if (role === 'tutor' && selectedTutorId && t.id !== selectedTutorId) {
      return false;
    }
    return tutorMatchesFilters(
      t,
      {
        subject: selectedSubject,
        grade: selectedGradeFilter || 'all',
        goal: selectedGoalFilter || 'all',
        type: selectedTypeFilter || 'all',
      },
      appointments
    );
  });

  const draggedAppointment = appointments.find(a => a.id === draggedAppId);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, app: Appointment) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', app.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(app.id);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, tutorId: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isOccupied ? 'none' : 'move';
    if (!dragOverCell || dragOverCell.tutorId !== tutorId || dragOverCell.hour !== hour) {
      setDragOverCell({ tutorId, hour, isOccupied });
    }
  };

  const handleDrop = (e: React.DragEvent, tutorId: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    setDragOverCell(null);

    if (isOccupied) return;
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    onRescheduleAppointment(appId, tutorId, formattedSelectedDate, hour);
    setDraggedAppId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 1. Day of Week Switcher (Mon - Sun) */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50/60 overflow-x-auto p-1.5 gap-1 shrink-0">
        {weekDays.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isSameDay(day, currentTime);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl text-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-white text-indigo-900 font-black shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {getRuDayShort(day)}
              </div>
              <div className="text-sm font-bold flex items-center justify-center space-x-1">
                <span>{format(day, 'd MMM')}</span>
                {isCurrentDay && (
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 shadow-xs"
                    title="Сегодня"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Main Schedule Grid with Horizontal Scroll */}
      <div className="flex-1 overflow-auto relative">
        {/* Red Current Time Line */}
        {isToday && isTimeInGrid && (
          <div
            className="absolute left-0 right-0 z-30 pointer-events-none flex items-center transition-all duration-300"
            style={{ top: `${redLineTopPx}px` }}
          >
            {/* Red time bubble label on the left */}
            <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-r-md shadow-md ml-0 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>{format(currentTime, 'HH:mm')}</span>
            </div>
            {/* Bright red horizontal line across schedule */}
            <div className="flex-1 h-[2px] bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
        )}

        <table className="min-w-full border-collapse border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
              {/* Time header */}
              <th className="sticky left-0 z-30 bg-slate-50 w-20 px-3 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                Время
              </th>

              {/* Tutor columns */}
              {filteredTutors.map(tutor => (
                <th
                  key={tutor.id}
                  className="min-w-[220px] max-w-[250px] px-4 py-3 text-left border-r border-slate-200 bg-white font-normal"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={tutor.avatar}
                        alt={tutor.shortName}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                          {tutor.shortName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tutor.subjects[0]}
                        </p>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                            ★ {tutor.rating}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {tutor.experienceYears ? `${tutor.experienceYears} л.` : `${tutor.activeStudents} уч.`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Open Slots button for this tutor */}
                    {onOpenTutorSlotsModal && (
                      <button
                        type="button"
                        onClick={() => onOpenTutorSlotsModal(tutor)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-colors shrink-0 shadow-2xs"
                        title={`Открыть и заполнить свободные слоты для ${tutor.shortName}`}
                      >
                        <Zap size={11} className="text-emerald-600" />
                        <span>Слоты</span>
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {HOURS.map(hour => (
              <tr key={hour} className="hover:bg-slate-50/50 transition-colors">
                {/* Time cell */}
                <td className="sticky left-0 z-10 bg-slate-50/95 backdrop-blur-xs px-3 py-3 border-r border-slate-200 text-xs font-bold text-slate-500 align-top">
                  <div className="flex items-center space-x-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>{hour}</span>
                  </div>
                </td>

                {/* Tutor cells */}
                {filteredTutors.map(tutor => {
                  const appointment = appointments.find(
                    a =>
                      a.tutorId === tutor.id &&
                      a.date === formattedSelectedDate &&
                      a.startTime === hour &&
                      a.status !== 'cancelled'
                  );

                  const slotKey = `${tutor.id}_${formattedSelectedDate}_${hour}`;
                  const isOpenSlot = !!openSlots[slotKey];
                  const isOccupied = !!appointment;
                  const isOverThisCell =
                    dragOverCell?.tutorId === tutor.id && dragOverCell?.hour === hour;
                  const isCardBeingDragged = draggedAppId === appointment?.id;

                  const hasActiveFilters = 
                    (selectedGradeFilter && selectedGradeFilter !== 'all') ||
                    (selectedGoalFilter && selectedGoalFilter !== 'all') ||
                    (selectedTypeFilter && selectedTypeFilter !== 'all');

                  const matchesActiveFilters = appointment
                    ? matchesGradeFilter(appointment.grade, selectedGradeFilter || 'all') &&
                      matchesGoalFilter(appointment, selectedGoalFilter || 'all') &&
                      matchesLessonTypeFilter(appointment, selectedTypeFilter || 'all')
                    : true;

                  const isTrial = appointment ? isTrialLesson(appointment) : false;

                  const [slotY, slotM, slotD] = formattedSelectedDate.split('-').map(Number);
                  const [slotH, slotMin] = hour.split(':').map(Number);
                  const slotDateTime = new Date(slotY, slotM - 1, slotD, slotH, slotMin, 0, 0);
                  const isPastSlot = slotDateTime.getTime() < currentTime.getTime();

                  return (
                    <td
                      key={`${tutor.id}-${hour}`}
                      className={`px-2 py-2 border-r border-slate-200 align-top h-20 transition-colors ${
                        isOverThisCell && !isOccupied
                          ? 'bg-emerald-100/70 ring-2 ring-emerald-500 ring-inset rounded-lg'
                          : isOverThisCell && isOccupied
                          ? 'bg-rose-100/70 ring-2 ring-rose-400 ring-inset'
                          : ''
                      }`}
                      onDragOver={e => handleDragOver(e, tutor.id, hour, isOccupied)}
                      onDragLeave={() => {
                        if (dragOverCell?.tutorId === tutor.id && dragOverCell?.hour === hour) {
                          setDragOverCell(null);
                        }
                      }}
                      onDrop={e => handleDrop(e, tutor.id, hour, isOccupied)}
                    >
                      {appointment ? (
                        /* Booked Lesson Card */
                        <div
                          draggable={true}
                          onDragStart={e => handleDragStart(e, appointment)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onOpenLessonDetail(appointment)}
                          className={`group relative p-2 rounded-xl border text-left cursor-pointer transition-all hover:shadow-xs ${
                            isCardBeingDragged ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                          } ${
                            hasActiveFilters && !matchesActiveFilters
                              ? 'opacity-35 grayscale hover:opacity-100 hover:grayscale-0 border-slate-300 bg-slate-100/80 text-slate-500'
                              : hasActiveFilters && matchesActiveFilters
                              ? 'ring-2 ring-indigo-500 shadow-xs ' + (isTrial ? 'bg-blue-50 border-blue-300 text-blue-950' : 'bg-purple-50 border-purple-300 text-purple-950')
                              : appointment.status === 'completed'
                              ? 'bg-slate-100 border-slate-300 text-slate-700'
                              : isTrial
                              ? 'bg-blue-50/90 border-blue-200 text-blue-950 hover:border-blue-400'
                              : 'bg-purple-50/90 border-purple-200 text-purple-950 hover:border-purple-400'
                          }`}
                          title={hasActiveFilters && !matchesActiveFilters ? 'Занятие не соответствует текущему фильтру (нажмите для просмотра)' : 'Нажмите для просмотра карточки или зажмите для переноса'}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                appointment.status === 'completed'
                                  ? 'bg-slate-200 text-slate-700'
                                  : isTrial
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {appointment.status === 'completed'
                                ? '⚪ Проведён'
                                : isTrial
                                ? '🔵 Пробный'
                                : '🟣 Урок'}
                            </span>

                            {/* Trial Sales Outcome Badge */}
                            {appointment.trialResult && (
                              <span className="text-[9px] font-bold">
                                {appointment.trialResult.outcome === 'purchased' ? (
                                  <span className="text-emerald-700 font-black bg-emerald-100 px-1 rounded flex items-center">
                                    ✓ Оплачен
                                  </span>
                                ) : appointment.trialResult.outcome === 'declined' ? (
                                  <span className="text-rose-700 font-bold bg-rose-100 px-1 rounded">
                                    ✕ Отказ
                                  </span>
                                ) : appointment.trialResult.outcome === 'thinking' ? (
                                  <span className="text-amber-800 font-bold bg-amber-100 px-1 rounded">
                                    ⏳ Думает
                                  </span>
                                ) : null}
                              </span>
                            )}

                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {appointment.startTime}
                              </span>
                              <GripVertical
                                size={11}
                                className="text-slate-400 opacity-60 group-hover:opacity-100"
                              />
                            </div>
                          </div>

                          <div className="text-xs font-bold truncate leading-tight flex items-center justify-between">
                            <span>
                              {role === 'tutor' && selectedTutorId && appointment.tutorId !== selectedTutorId
                                ? `${appointment.studentName.split(' ')[0]} •••`
                                : appointment.studentName}
                            </span>
                            {role === 'tutor' && selectedTutorId && appointment.tutorId !== selectedTutorId && (
                              <span title="Контакты скрыты политикой школы">
                                <Lock size={10} className="text-slate-400 shrink-0 ml-1" />
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center space-x-1">
                            <span>{appointment.grade}</span>
                            {appointment.learningGoalCategory && (
                              <span className="text-indigo-700 bg-indigo-50 px-1 rounded font-bold uppercase text-[9px]">
                                {appointment.learningGoalCategory === 'olympiad' ? '🏆 Олимпиада' : appointment.learningGoalCategory === 'ege' ? '🎯 ЕГЭ' : appointment.learningGoalCategory === 'oge' ? '📘 ОГЭ' : '📈 Успеваемость'}
                              </span>
                            )}
                          </div>

                          {/* MOP Request / Note preview */}
                          {(appointment.mopRequest || appointment.notes) && (
                            <div className="text-[10px] text-slate-600 italic truncate mt-1 bg-white/70 px-1 py-0.5 rounded border border-slate-200/60">
                              {appointment.mopRequest ? `Запрос: ${appointment.mopRequest.requestText}` : appointment.notes}
                            </div>
                          )}
                        </div>
                      ) : role === 'tutor' ? (
                        /* Tutor Mode: Toggle Slot Button */
                        <button
                          type="button"
                          onClick={() => onToggleSlot(tutor.id, formattedSelectedDate, hour)}
                          className={`w-full h-full min-h-[58px] rounded-xl border transition-all flex flex-col items-center justify-center p-1.5 ${
                            isOpenSlot
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                              : 'border-dashed border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                          title={isOpenSlot ? 'Нажмите, чтобы закрыть окно' : 'Нажмите, чтобы открыть окно'}
                        >
                          {isOpenSlot ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1"></span>
                              <span className="text-[11px] font-bold">Окно открыто</span>
                              <span className="text-[9px] text-slate-500 mt-0.5">Клик = закрыть</span>
                            </>
                          ) : (
                            <>
                              <Plus size={14} className="mb-0.5" />
                              <span className="text-[11px] font-semibold">+ Открыть окно</span>
                            </>
                          )}
                        </button>
                      ) : (
                        /* Manager Mode: Slot Button */
                        <button
                          type="button"
                          onClick={() => onOpenBooking(tutor.id, formattedSelectedDate, hour)}
                          className={`w-full h-full min-h-[58px] rounded-xl border transition-all flex flex-col items-center justify-center p-1.5 group ${
                            isPastSlot
                              ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                              : isOverThisCell
                              ? 'border-2 border-dashed border-emerald-500 bg-emerald-100 text-emerald-800'
                              : isOpenSlot
                              ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                              : 'border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600'
                          }`}
                          title={
                            isPastSlot
                              ? 'Невозможно записать, т.к. время уже прошло'
                              : isOpenSlot
                              ? 'Свободное окно репетитора. Кликните для быстрой записи ученика'
                              : 'Кликните для записи'
                          }
                        >
                          {isOpenSlot ? (
                            <>
                              <div className="flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Свободно</span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-800/90 mt-0.5 group-hover:underline">
                                + Пробный 0 ₽
                              </span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} className="opacity-40 group-hover:opacity-100" />
                              <span className="text-[10px] opacity-40 group-hover:opacity-100 mt-0.5 font-medium">
                                Пробный 0 ₽
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
