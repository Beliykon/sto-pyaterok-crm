import React, { useState } from 'react';
import { Tutor, Appointment } from '../lib/types';
import { format, isSameDay } from 'date-fns';
import { getRuDayShort } from '../lib/dateUtils';
import { 
  User, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter,
  MessageSquare,
  AlertCircle,
  GripVertical,
  ArrowRight,
  Move
} from 'lucide-react';

interface MatrixViewProps {
  tutors: Tutor[];
  appointments: Appointment[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekDays: Date[];
  onOpenBooking: (tutorId?: string, dateStr?: string, timeStr?: string) => void;
  onCancelAppointment: (id: string) => void;
  onRescheduleAppointment: (
    appointmentId: string, 
    newTutorId: string, 
    newDate: string, 
    newStartTime: string
  ) => void;
  onOpenLeadConfirmation: (appointment: Appointment) => void;
  selectedSubject: string;
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function MatrixView({
  tutors,
  appointments,
  selectedDate,
  onSelectDate,
  weekDays,
  onOpenBooking,
  onCancelAppointment,
  onRescheduleAppointment,
  onOpenLeadConfirmation,
  selectedSubject,
}: MatrixViewProps) {
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Drag and Drop States
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{
    tutorId: string;
    hour: string;
    isOccupied: boolean;
  } | null>(null);

  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

  // Filter tutors by subject if needed
  const filteredTutors = tutors.filter(t => {
    if (selectedSubject === 'all') return true;
    return t.subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()));
  });

  const draggedAppointment = appointments.find(a => a.id === draggedAppId);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, app: Appointment) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', app.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAppId(app.id);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverCell(null);
  };

  // Handle Drag Over slot
  const handleDragOver = (e: React.DragEvent, tutorId: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isOccupied ? 'none' : 'move';
    if (!dragOverCell || dragOverCell.tutorId !== tutorId || dragOverCell.hour !== hour) {
      setDragOverCell({ tutorId, hour, isOccupied });
    }
  };

  // Handle Drop onto slot
  const handleDrop = (e: React.DragEvent, tutorId: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    
    if (appId && !isOccupied) {
      onRescheduleAppointment(appId, tutorId, formattedSelectedDate, hour);
    }
    
    setDraggedAppId(null);
    setDragOverCell(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Top Banner: Drag notice or Date switcher tabs */}
      {draggedAppointment ? (
        <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-inner text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Move size={15} className="animate-bounce" />
            <span className="font-bold">
              Перенос занятия: <span className="underline">{draggedAppointment.studentName}</span> ({draggedAppointment.subject})
            </span>
            <span className="opacity-80">
              — наведите на любой свободный пунктирный слот и отпустите мышь
            </span>
          </div>
          <button 
            onClick={() => setDraggedAppId(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md font-semibold"
          >
            Отмена
          </button>
        </div>
      ) : (
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              День недели:
            </span>
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayAppsCount = appointments.filter(a => a.date === dayStr && a.status !== 'cancelled').length;

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="font-bold">{getRuDayShort(day)}</span>
                    <span className={`text-[11px] opacity-80`}>{format(day, 'd.MM')}</span>
                    {dayAppsCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {dayAppsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1.5 text-xs text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2.5 py-1 rounded-lg">
              <Move size={13} />
              <span className="font-medium">Зажмите карточку для переноса (Drag & Drop)</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Репетиторов: <strong className="text-slate-800">{filteredTutors.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* The Master Grid */}
      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
                {/* Time header */}
                <th className="sticky left-0 z-30 bg-slate-50 w-24 px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  Время
                </th>

                {/* Tutor columns */}
                {filteredTutors.map((tutor) => {
                  const dayAppointments = appointments.filter(
                    a => a.tutorId === tutor.id && a.date === formattedSelectedDate && a.status !== 'cancelled'
                  );

                  return (
                    <th
                      key={tutor.id}
                      className="min-w-[210px] max-w-[240px] px-4 py-3 text-left border-r border-slate-200 bg-white font-normal"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={tutor.avatar}
                          alt={tutor.shortName}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                            {tutor.shortName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {tutor.subjects[0]}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              ★ {tutor.rating}
                            </span>
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded" title="Конверсия из пробного в продажу">
                              Конверсия {tutor.salesConversionRate}% 🔥
                            </span>
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {HOURS.map((hour) => (
                <tr key={hour} className="hover:bg-slate-50/40 transition-colors">
                  {/* Time label column */}
                  <td className="sticky left-0 z-10 bg-slate-50/90 backdrop-blur-xs px-3 py-3.5 border-r border-slate-200 text-xs font-semibold text-slate-500 align-top">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} className="text-slate-400" />
                      <span>{hour}</span>
                    </div>
                  </td>

                  {/* Tutor cells */}
                  {filteredTutors.map((tutor) => {
                    const appointment = appointments.find(
                      a => a.tutorId === tutor.id && 
                           a.date === formattedSelectedDate && 
                           a.startTime === hour && 
                           a.status !== 'cancelled'
                    );

                    const isOccupied = !!appointment;
                    const isOverThisCell = dragOverCell?.tutorId === tutor.id && dragOverCell?.hour === hour;
                    const isCardBeingDragged = draggedAppId === appointment?.id;

                    return (
                      <td
                        key={`${tutor.id}-${hour}`}
                        className={`px-2 py-2 border-r border-slate-200 align-top h-20 transition-all ${
                          isOverThisCell && !isOccupied
                            ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-inset rounded-lg'
                            : isOverThisCell && isOccupied
                            ? 'bg-rose-50/80 ring-2 ring-rose-400 ring-inset'
                            : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, tutor.id, hour, isOccupied)}
                        onDragLeave={() => {
                          if (dragOverCell?.tutorId === tutor.id && dragOverCell?.hour === hour) {
                            setDragOverCell(null);
                          }
                        }}
                        onDrop={(e) => handleDrop(e, tutor.id, hour, isOccupied)}
                      >
                        {appointment ? (
                          /* Booked appointment card - fully Draggable */
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setActiveAppointment(appointment)}
                            className={`group relative p-2.5 rounded-xl border text-left cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                              isCardBeingDragged ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                            } ${
                              appointment.type === 'trial'
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200 hover:border-amber-300'
                                : 'bg-gradient-to-br from-indigo-50/70 to-blue-50/40 border-indigo-200 hover:border-indigo-300'
                            }`}
                            title="Зажмите и перетащите для переноса в другой слот"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  appointment.type === 'trial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {appointment.type === 'trial' ? 'Пробный (0₽)' : 'Занятие'}
                              </span>
                              
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {appointment.startTime}
                                </span>
                                <GripVertical size={12} className="text-slate-400 opacity-60 group-hover:opacity-100" />
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-900 truncate leading-snug">
                              {appointment.studentName}
                            </div>

                            <div className="text-[11px] text-slate-600 truncate mt-0.5">
                              {appointment.grade}
                            </div>

                            {/* Sto-Pyaterok Offer Badge if available */}
                            {appointment.quizContext?.primaryOffer && (
                              <div className="mt-1 flex items-center space-x-1">
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                  appointment.quizContext.primaryOffer === 'grant30' 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : appointment.quizContext.primaryOffer === 'matkapital'
                                    ? 'bg-violet-100 text-violet-900 border border-violet-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}>
                                  {appointment.quizContext.primaryOffer === 'grant30' ? '🎁 Грант 30%' :
                                   appointment.quizContext.primaryOffer === 'matkapital' ? '🏛️ Маткапитал' : '⚡ 0₽ Пробный'}
                                </span>
                              </div>
                            )}

                            {/* Attendance Traffic Light & Messenger (Telegram/Max) Quick Button */}
                            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenLeadConfirmation(appointment);
                                }}
                                className="flex items-center space-x-1 text-[10px] font-bold hover:underline"
                                title="Контроль явки: нажмите для отправки напоминания родителю"
                              >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  appointment.confirmationStatus === 'confirmed' 
                                    ? 'bg-emerald-500 ring-2 ring-emerald-200' 
                                    : appointment.confirmationStatus === 'reminded'
                                    ? 'bg-amber-500 ring-2 ring-amber-200'
                                    : 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
                                }`} />
                                <span className={
                                  appointment.confirmationStatus === 'confirmed' 
                                    ? 'text-emerald-700' 
                                    : appointment.confirmationStatus === 'reminded'
                                    ? 'text-amber-700'
                                    : 'text-rose-600'
                                }>
                                  {appointment.confirmationStatus === 'confirmed' 
                                    ? 'Явка 🟢' 
                                    : appointment.confirmationStatus === 'reminded' 
                                    ? 'Напомнили 🟡' 
                                    : 'Не подтв. 🔴'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenLeadConfirmation(appointment);
                                }}
                                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition-colors"
                                title="Написать родителю для подтверждения"
                              >
                                <MessageSquare size={11} />
                              </button>
                            </div>

                            {appointment.notes && (
                              <div className="text-[10px] text-slate-500 truncate mt-1 italic flex items-center space-x-1">
                                <MessageSquare size={10} className="text-slate-400 flex-shrink-0" />
                                <span className="truncate">{appointment.notes}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Free slot with magnetic drop detection */
                          <button
                            onClick={() => onOpenBooking(tutor.id, formattedSelectedDate, hour)}
                            className={`w-full h-full min-h-[58px] rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 group ${
                              isOverThisCell
                                ? 'border-2 border-dashed border-emerald-500 bg-emerald-100/60 text-emerald-800 scale-[1.02] shadow-sm'
                                : 'border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-400 hover:text-indigo-600'
                            }`}
                          >
                            {isOverThisCell ? (
                              <div className="flex flex-col items-center animate-in zoom-in-90">
                                <Sparkles size={16} className="text-emerald-600 animate-spin" />
                                <span className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                                  Перенести сюда
                                </span>
                              </div>
                            ) : (
                              <>
                                <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  {draggedAppId ? 'Свободно' : 'Записать'}
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

      {/* Appointment Detail Modal / Slide-over */}
      {activeAppointment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setActiveAppointment(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  activeAppointment.type === 'trial' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {activeAppointment.type === 'trial' ? 'Бесплатный пробный урок' : 'Регулярное занятие'}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ID: #{activeAppointment.id}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {activeAppointment.studentName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeAppointment.grade} • {activeAppointment.subject}
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block">Дата и время</span>
                  <strong className="text-slate-800 font-bold text-sm block mt-0.5">
                    {activeAppointment.date} • {activeAppointment.startTime} - {activeAppointment.endTime}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Преподаватель</span>
                  <strong className="text-slate-800 font-bold text-sm block mt-0.5">
                    {activeAppointment.tutorName}
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Телефон родителя:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-800">{activeAppointment.parentPhone}</span>
                    <div className="inline-flex items-center rounded border border-slate-200 overflow-hidden text-[9px] font-bold">
                      <a
                        href={`https://t.me/+${activeAppointment.parentPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1 py-0.5 text-sky-700 bg-sky-50 hover:bg-sky-100 border-r border-slate-200"
                        title="Написать в Telegram"
                      >
                        TG
                      </a>
                      <a
                        href={`https://max.ru/u/${activeAppointment.parentPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1 py-0.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        title="Написать в MAX"
                      >
                        Max
                      </a>
                    </div>
                  </div>
                </div>

                {activeAppointment.parentName && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Родитель:</span>
                    <span className="font-semibold text-slate-800">{activeAppointment.parentName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Записал менеджер:</span>
                  <span className="font-semibold text-slate-800">{activeAppointment.managerName}</span>
                </div>

                {activeAppointment.notes && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-amber-900 mt-2">
                    <span className="font-bold block mb-0.5">Заметки к уроку:</span>
                    <p className="leading-relaxed">{activeAppointment.notes}</p>
                  </div>
                )}
              </div>

              {/* Attendance Button */}
              <button
                onClick={() => {
                  onOpenLeadConfirmation(activeAppointment);
                  setActiveAppointment(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm shadow-emerald-200 transition-colors"
              >
                <MessageSquare size={14} />
                <span>Контроль явки & Отправить напоминание</span>
              </button>

              {activeAppointment.meetingUrl && (
                <a
                  href={activeAppointment.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-indigo-200"
                >
                  <ExternalLink size={14} />
                  <span>Войти в виртуальный класс (Телемост)</span>
                </a>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => {
                    onCancelAppointment(activeAppointment.id);
                    setActiveAppointment(null);
                  }}
                  className="text-rose-600 hover:text-rose-700 font-medium hover:underline text-xs"
                >
                  Отменить занятие
                </button>
                <button
                  onClick={() => setActiveAppointment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
