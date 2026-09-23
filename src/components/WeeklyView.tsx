import React, { useState } from 'react';
import { Tutor, Appointment } from '../lib/types';
import { format, isSameDay } from 'date-fns';
import { getRuDayShort, formatRu } from '../lib/dateUtils';
import { Clock, Plus, ExternalLink, MessageSquare, Phone, Move, Sparkles, GripVertical } from 'lucide-react';

interface WeeklyViewProps {
  tutors: Tutor[];
  appointments: Appointment[];
  selectedTutorId: string;
  onSelectTutorId: (id: string) => void;
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
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function WeeklyView({
  tutors,
  appointments,
  selectedTutorId,
  onSelectTutorId,
  weekDays,
  onOpenBooking,
  onCancelAppointment,
  onRescheduleAppointment,
  onOpenLeadConfirmation,
}: WeeklyViewProps) {
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);

  // Drag and Drop State
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{
    dateStr: string;
    hour: string;
    isOccupied: boolean;
  } | null>(null);

  const selectedTutor = tutors.find(t => t.id === selectedTutorId) || tutors[0];
  const draggedAppointment = appointments.find(a => a.id === draggedAppId);

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

  const handleDragOver = (e: React.DragEvent, dateStr: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = isOccupied ? 'none' : 'move';
    if (!dragOverCell || dragOverCell.dateStr !== dateStr || dragOverCell.hour !== hour) {
      setDragOverCell({ dateStr, hour, isOccupied });
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, hour: string, isOccupied: boolean) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId && !isOccupied) {
      onRescheduleAppointment(appId, selectedTutor.id, dateStr, hour);
    }
    setDraggedAppId(null);
    setDragOverCell(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      {/* Top Banner when dragging */}
      {draggedAppointment ? (
        <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-inner text-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Move size={15} className="animate-bounce" />
            <span className="font-bold">
              Перенос занятия ({draggedAppointment.studentName})
            </span>
            <span className="opacity-80">
              — бросьте в свободный слот любого дня недели
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
        /* Top Filter Bar */
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Преподаватель:
            </span>
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {tutors.map(tutor => (
                <button
                  key={tutor.id}
                  onClick={() => onSelectTutorId(tutor.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                    selectedTutorId === tutor.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <img src={tutor.avatar} alt={tutor.shortName} className="w-4 h-4 rounded-full object-cover" />
                  <span>{tutor.shortName}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                    selectedTutorId === tutor.id ? 'bg-indigo-700 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tutor.salesConversionRate}% 🔥
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">Предмет:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              {selectedTutor.subjects.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
                <th className="sticky left-0 z-30 bg-slate-50 w-20 px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                  Время
                </th>
                {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayApps = appointments.filter(
                    a => a.tutorId === selectedTutor.id && a.date === dayStr && a.status !== 'cancelled'
                  );

                  return (
                    <th
                      key={day.toISOString()}
                      className={`min-w-[140px] px-3 py-2.5 text-center border-r border-slate-200 ${
                        isToday ? 'bg-indigo-50/40' : 'bg-white'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {getRuDayShort(day)}
                      </div>
                      <div className={`text-sm font-extrabold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {formatRu(day, 'd MMMM')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {dayApps.length > 0 ? `${dayApps.length} зан.` : '—'}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {HOURS.map(hour => (
                <tr key={hour} className="hover:bg-slate-50/40 transition-colors">
                  <td className="sticky left-0 z-10 bg-slate-50/90 backdrop-blur-xs px-3 py-3 border-r border-slate-200 text-xs font-semibold text-slate-500 align-top">
                    {hour}
                  </td>

                  {weekDays.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const appointment = appointments.find(
                      a => a.tutorId === selectedTutor.id && 
                           a.date === dayStr && 
                           a.startTime === hour && 
                           a.status !== 'cancelled'
                    );

                    const isOccupied = !!appointment;
                    const isOverThisCell = dragOverCell?.dateStr === dayStr && dragOverCell?.hour === hour;
                    const isCardBeingDragged = draggedAppId === appointment?.id;

                    return (
                      <td
                        key={`${dayStr}-${hour}`}
                        className={`px-2 py-1.5 border-r border-slate-200 align-top h-20 min-w-[140px] transition-all ${
                          isOverThisCell && !isOccupied
                            ? 'bg-emerald-50/80 ring-2 ring-emerald-500 ring-inset rounded-lg'
                            : isOverThisCell && isOccupied
                            ? 'bg-rose-50/80 ring-2 ring-rose-400 ring-inset'
                            : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, dayStr, hour, isOccupied)}
                        onDragLeave={() => {
                          if (dragOverCell?.dateStr === dayStr && dragOverCell?.hour === hour) {
                            setDragOverCell(null);
                          }
                        }}
                        onDrop={(e) => handleDrop(e, dayStr, hour, isOccupied)}
                      >
                        {appointment ? (
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedApp(appointment)}
                            className={`p-2 rounded-xl border text-left cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                              isCardBeingDragged ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''
                            } ${
                              appointment.type === 'trial'
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            }`}
                            title="Зажмите и перетащите для переноса на другой день или время"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                              <span>{appointment.type === 'trial' ? 'Пробный 0₽' : 'Урок'}</span>
                              <div className="flex items-center space-x-1">
                                <span className="opacity-70">{appointment.startTime}</span>
                                <GripVertical size={11} className="text-slate-400 opacity-60" />
                              </div>
                            </div>
                            <div className="text-xs font-bold truncate">
                              {appointment.studentName}
                            </div>
                            <div className="text-[11px] opacity-80 truncate">
                              {appointment.grade}
                            </div>

                            {/* Attendance Traffic Light & WhatsApp Quick Button */}
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenLeadConfirmation(appointment);
                                }}
                                className="flex items-center space-x-1 text-[9px] font-bold"
                                title="Контроль явки: нажмите для отправки напоминания"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
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
                                className="p-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition-colors"
                                title="Написать родителю для подтверждения"
                              >
                                <MessageSquare size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenBooking(selectedTutor.id, dayStr, hour)}
                            className={`w-full h-full min-h-[50px] rounded-lg border transition-all flex items-center justify-center group ${
                              isOverThisCell
                                ? 'border-2 border-dashed border-emerald-500 bg-emerald-100/60 text-emerald-800 scale-[1.02]'
                                : 'border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-300 hover:text-indigo-600'
                            }`}
                          >
                            {isOverThisCell ? (
                              <span className="text-[10px] font-extrabold text-emerald-700">
                                Сюда ({hour})
                              </span>
                            ) : (
                              <Plus size={14} className="group-hover:scale-110 transition-transform" />
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

      {/* Appointment Detail Popup */}
      {selectedApp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSelectedApp(null)}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {selectedApp.type === 'trial' ? 'Пробный урок (0₽)' : 'Занятие'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{selectedApp.date} {selectedApp.startTime}</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">{selectedApp.studentName}</h4>
            <p className="text-xs text-slate-500">{selectedApp.grade} • {selectedApp.subject}</p>
            <div className="mt-3 py-2 border-t border-b border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Преподаватель:</span>
                <span className="font-semibold text-slate-800">{selectedApp.tutorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Телефон:</span>
                <span className="font-semibold text-indigo-600">{selectedApp.parentPhone}</span>
              </div>
              {selectedApp.notes && (
                <div className="pt-1 text-slate-600 italic">«{selectedApp.notes}»</div>
              )}
            </div>
            {/* Attendance button */}
            <button
              onClick={() => {
                onOpenLeadConfirmation(selectedApp);
                setSelectedApp(null);
              }}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
            >
              <MessageSquare size={13} />
              <span>Контроль явки & Отправить напоминание</span>
            </button>

            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  onCancelAppointment(selectedApp.id);
                  setSelectedApp(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Отменить
              </button>
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
