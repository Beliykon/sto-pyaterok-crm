import React, { useState } from 'react';
import { Tutor, Appointment } from '../lib/types';
import { X, Layers, Calendar, Clock, Sparkles, Check, ArrowRight, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface MultiSubjectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: Tutor[];
  appointments: Appointment[];
  onBookCombo: (bookings: Array<{
    tutorId: string;
    tutorName: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
    studentName: string;
    parentPhone: string;
    grade: string;
    dealValue: number;
    notes?: string;
  }>) => void;
}

const HOURS = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const SUBJECTS = [
  'Математика (профиль)',
  'Русский язык',
  'Обществознание',
  'Физика',
  'Английский язык',
  'Химия & Биология',
];

export default function MultiSubjectBookingModal({
  isOpen,
  onClose,
  tutors,
  appointments,
  onBookCombo,
}: MultiSubjectBookingModalProps) {
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+7 ');
  const [grade, setGrade] = useState('11 класс (ЕГЭ Профиль)');
  
  // Subjects
  const [subject1, setSubject1] = useState('Математика (профиль)');
  const [subject2, setSubject2] = useState('Русский язык');

  // Days & preferred start time
  const [selectedDay, setSelectedDay] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [preferredStartTime, setPreferredStartTime] = useState('16:00');
  const [comboMode, setComboMode] = useState<'back-to-back' | 'different-days'>('back-to-back');
  const [secondDay, setSecondDay] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  if (!isOpen) return null;

  // Find candidate tutors for Subject 1
  const tutorsSubj1 = tutors.filter(t => 
    t.subjects.some(s => s.toLowerCase().includes(subject1.toLowerCase().split(' ')[0]))
  );

  // Find candidate tutors for Subject 2
  const tutorsSubj2 = tutors.filter(t => 
    t.subjects.some(s => s.toLowerCase().includes(subject2.toLowerCase().split(' ')[0]))
  );

  const tutor1 = tutorsSubj1[0] || tutors[0];
  const tutor2 = tutorsSubj2.find(t => t.id !== tutor1.id) || tutorsSubj2[0] || tutors[1] || tutors[0];

  // Timing for back-to-back
  const timeSlot1 = preferredStartTime;
  const hour1Num = Number(preferredStartTime.split(':')[0]);
  const endSlot1 = `${String(hour1Num + 1).padStart(2, '0')}:00`;

  // Second lesson starts right after (with 10-min buffer or next hour)
  const timeSlot2 = `${String(hour1Num + 1).padStart(2, '0')}:10`;
  const endSlot2 = `${String(hour1Num + 2).padStart(2, '0')}:10`;

  // Check conflicts
  const isConflict1 = appointments.some(
    a => a.tutorId === tutor1.id && a.date === selectedDay && a.startTime === timeSlot1 && a.status !== 'cancelled'
  );

  const date2 = comboMode === 'back-to-back' ? selectedDay : secondDay;
  const time2 = comboMode === 'back-to-back' ? timeSlot2 : preferredStartTime;
  const endTime2 = comboMode === 'back-to-back' ? endSlot2 : `${String(Number(time2.split(':')[0]) + 1).padStart(2, '0')}:00`;

  const isConflict2 = appointments.some(
    a => a.tutorId === tutor2.id && a.date === date2 && a.startTime === time2 && a.status !== 'cancelled'
  );

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    onBookCombo([
      {
        tutorId: tutor1.id,
        tutorName: tutor1.name,
        subject: subject1,
        date: selectedDay,
        startTime: timeSlot1,
        endTime: endSlot1,
        studentName: studentName.trim(),
        parentPhone: parentPhone.trim(),
        grade,
        dealValue: 38400,
        notes: `Пакетное комбо «Всё в одном месте»: Предмет 1 (${subject1}) + Предмет 2 (${subject2}). Оффер: Грант 30%`,
      },
      {
        tutorId: tutor2.id,
        tutorName: tutor2.name,
        subject: subject2,
        date: date2,
        startTime: time2,
        endTime: endTime2,
        studentName: studentName.trim(),
        parentPhone: parentPhone.trim(),
        grade,
        dealValue: 38400,
        notes: `Пакетное комбо «Всё в одном месте»: Предмет 2 (${subject2}) в связке с (${subject1}).`,
      },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold leading-tight">Пакетная стыковка предметов (Мульти-запись)</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  УТП «Всё в одном месте»
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Авто-подбор парных слотов для 2 предметов без накладок в расписании
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 overflow-y-auto space-y-5">
          {/* Client Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Имя ученика *</label>
              <input
                type="text"
                required
                placeholder="Матвей Морозов"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Телефон родителя *</label>
              <input
                type="tel"
                required
                placeholder="+7 (999) 000-00-00"
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Класс / Цель</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="11 класс (ЕГЭ Профиль)">11 класс (ЕГЭ Профиль)</option>
                <option value="9 класс (ОГЭ на 5)">9 класс (ОГЭ на 5)</option>
                <option value="10 класс (Подготовка к ЕГЭ)">10 класс (Подготовка к ЕГЭ)</option>
                <option value="7-8 класс (Подтянуть оценки)">7-8 класс (Подтянуть оценки)</option>
              </select>
            </div>
          </div>

          {/* Subjects Selection */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Пара предметов для комплексной подготовки</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Subject 1 */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-indigo-700 uppercase">Предмет №1</span>
                <select
                  value={subject1}
                  onChange={e => setSubject1(e.target.value)}
                  className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-1">
                  <span>Репетитор:</span>
                  <strong className="text-indigo-900">{tutor1.shortName}</strong>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Конверсия {tutor1.salesConversionRate}%
                  </span>
                </div>
              </div>

              {/* Subject 2 */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-violet-700 uppercase">Предмет №2</span>
                <select
                  value={subject2}
                  onChange={e => setSubject2(e.target.value)}
                  className="w-full text-xs font-bold px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {SUBJECTS.filter(s => s !== subject1).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-1">
                  <span>Репетитор:</span>
                  <strong className="text-violet-900">{tutor2.shortName}</strong>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    Конверсия {tutor2.salesConversionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Mode: Back-to-back vs Different days */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Формат расписания:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setComboMode('back-to-back')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  comboMode === 'back-to-back'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold">⚡ Подряд в один день (С перерывом)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Уроки идут друг за другом с 10-мин буфером отдыха</div>
              </button>

              <button
                type="button"
                onClick={() => setComboMode('different-days')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  comboMode === 'different-days'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold">📅 В разные дни недели</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Например: Вторник + Четверг в одно и то же время</div>
              </button>
            </div>
          </div>

          {/* Timing parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {comboMode === 'back-to-back' ? 'День для обоих предметов' : 'День для первого предмета'}
              </label>
              <input
                type="date"
                value={selectedDay}
                min="2025-01-01"
                max="2028-12-31"
                onChange={e => setSelectedDay(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            {comboMode === 'different-days' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  День для второго предмета
                </label>
                <input
                  type="date"
                  value={secondDay}
                  min="2025-01-01"
                  max="2028-12-31"
                  onChange={e => setSecondDay(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Удобное время старта</label>
              <select
                value={preferredStartTime}
                onChange={e => setPreferredStartTime(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-lg border border-slate-200 bg-white"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Matching Result Preview */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 uppercase tracking-wider">Сформированная стыковка:</span>
              <span className="text-[11px] text-emerald-400 font-semibold">Скидка 15% на 2-й предмет</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Slot 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <strong>{subject1}</strong> ({tutor1.shortName})
                </div>
                <div className="font-mono text-indigo-200">
                  {selectedDay} • {timeSlot1} – {endSlot1}
                </div>
              </div>

              {/* Transition arrow */}
              <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 py-0.5">
                <ArrowRight size={12} />
                <span>{comboMode === 'back-to-back' ? '10 мин перерыв на чай ☕' : 'Следующий урок через 2 дня'}</span>
              </div>

              {/* Slot 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/10 border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  <strong>{subject2}</strong> ({tutor2.shortName})
                </div>
                <div className="font-mono text-violet-200">
                  {date2} • {time2} – {endTime2}
                </div>
              </div>
            </div>

            {(isConflict1 || isConflict2) ? (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>Внимание: у одного из преподавателей это время уже занято. Сдвиньте час начала.</span>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-1.5">
                <CheckCircle2 size={15} />
                <span>Оба слота свободны! Пакетное бронирование в 1 клик.</span>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isConflict1 || isConflict2 || !studentName.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
            >
              <Layers size={14} />
              <span>Забронировать комбо-пакет</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
