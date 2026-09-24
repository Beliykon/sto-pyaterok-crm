import React, { useState } from 'react';
import { Tutor, Appointment } from '../lib/types';
import { X, ArrowRightLeft, Calendar, Clock, User, Check, AlertCircle } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  tutors: Tutor[];
  onReschedule: (appointmentId: string, newTutorId: string, newDate: string, newStartTime: string) => void;
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function RescheduleModal({
  isOpen,
  onClose,
  appointment,
  tutors,
  onReschedule,
}: RescheduleModalProps) {
  if (!isOpen || !appointment) return null;

  const [tutorId, setTutorId] = useState(appointment.tutorId);
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.startTime);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const [year, month, day] = date.split('-').map(Number);
    const [startH, startM] = time.split(':').map(Number);
    const chosenDateTime = new Date(year, month - 1, day, startH, startM, 0, 0);
    if (chosenDateTime.getTime() < Date.now()) {
      setValidationError('Невозможно записать, т.к. время уже прошло');
      return;
    }

    onReschedule(appointment.id, tutorId, date, time);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Перенос занятия</h3>
              <p className="text-xs text-slate-500">{appointment.studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Преподаватель
            </label>
            <select
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {tutors.map(t => (
                <option key={t.id} value={t.id}>
                  {t.shortName} ({t.subjects[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Новая дата
              </label>
              <input
                type="date"
                value={date}
                min="2025-01-01"
                max="2028-12-31"
                onChange={e => setDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Время
              </label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <Check size={14} />
              <span>Сохранить перенос</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
