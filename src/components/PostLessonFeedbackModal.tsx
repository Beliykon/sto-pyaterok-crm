import React, { useState } from 'react';
import { Appointment, PostLessonFeedback } from '../lib/types';
import { X, Sparkles, CheckCircle2, Flame, Award, ArrowRight } from 'lucide-react';

interface PostLessonFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSubmitFeedback: (appointmentId: string, feedback: PostLessonFeedback) => void;
}

const PACKAGE_OPTIONS = [
  'Пакет 16 занятий (2 раза в нед) — 38 400 ₽ (Рекомендуемый)',
  'Пакет 32 занятия (интенсив ЕГЭ на 85+) — 69 900 ₽',
  'Пакет 8 занятий (1 раз в нед / поддержка) — 20 800 ₽',
  'Индивидуальный план подготовки к ОГЭ — 28 800 ₽',
];

export default function PostLessonFeedbackModal({
  isOpen,
  onClose,
  appointment,
  onSubmitFeedback,
}: PostLessonFeedbackModalProps) {
  const [recommendation, setRecommendation] = useState(PACKAGE_OPTIONS[0]);
  const [studentLevel, setStudentLevel] = useState('Средняя база (40-50 баллов, цель 80+)');
  const [readyToBuy, setReadyToBuy] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('Ученик очень заинтересован, контакт с мамой отличный. Предложите рассрочку на 16 уроков.');

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback(appointment.id, {
      completed: true,
      recommendation,
      studentLevel,
      readyToBuy,
      notes,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
              <Flame size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Экспресс-отчёт по итогам вводного урока
              </h3>
              <p className="text-[11px] text-slate-500">
                Передайте отделу продаж рекомендацию для связи с родителями и оформления абонемента
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Ученик:</span>
              <strong className="text-slate-900 text-sm">{appointment.studentName}</strong>
              <div className="text-[11px] text-slate-500">{appointment.grade} • {appointment.subject}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Родитель:</span>
              <strong className="text-indigo-600 text-xs">{appointment.parentPhone}</strong>
            </div>
          </div>

          {/* Readiness to buy */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Готовность клиента к покупке обучения:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', label: '🔥 Горячий (хотят начать)', bg: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                { id: 'medium', label: '⚡ Тёплый (думают над пакетом)', bg: 'border-amber-500 bg-amber-50 text-amber-800' },
                { id: 'low', label: '❄️ Холодный (сравнивают школы)', bg: 'border-slate-300 bg-slate-50 text-slate-700' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setReadyToBuy(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all ${
                    readyToBuy === opt.id
                      ? `${opt.bg} ring-2 ring-indigo-500/30 shadow-xs`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Package */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Рекомендованный пакет занятий (что предлагать менеджеру):
            </label>
            <select
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {PACKAGE_OPTIONS.map(pkg => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>
          </div>

          {/* Student Level */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Оценка уровня знаний ученика:
            </label>
            <input
              type="text"
              value={studentLevel}
              onChange={e => setStudentLevel(e.target.value)}
              placeholder="Например: Пробелы в геометрии, алгебра уверенно"
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Notes for Manager */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Подсказка менеджеру для закрытия сделки:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <Sparkles size={15} />
            <span>Передать в отдел продаж на закрытие сделки 🚀</span>
          </button>
        </form>
      </div>
    </div>
  );
}
