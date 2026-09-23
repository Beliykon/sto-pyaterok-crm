import React from 'react';
import { Appointment, Tutor } from '../lib/types';
import { format } from 'date-fns';
import { Users, Calendar, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatsBannerProps {
  appointments: Appointment[];
  tutors: Tutor[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
}

const SUBJECT_BUTTONS = [
  { id: 'all', label: 'Все предметы' },
  { id: 'математика', label: 'Математика (ЕГЭ/ОГЭ)' },
  { id: 'русский', label: 'Русский язык' },
  { id: 'обществознание', label: 'Обществознание' },
  { id: 'английский', label: 'Английский' },
  { id: 'химия', label: 'Химия & Биология' },
  { id: 'физика', label: 'Физика & Информатика' },
];

export default function StatsBanner({
  appointments,
  tutors,
  selectedSubject,
  onSelectSubject,
}: StatsBannerProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeAppointments = appointments.filter(a => a.status !== 'cancelled');
  const todayAppointments = activeAppointments.filter(a => a.date === todayStr);
  const trialAppointments = activeAppointments.filter(a => a.type === 'trial');

  return (
    <div className="space-y-3">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Занятий сегодня</div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              {todayAppointments.length} <span className="text-xs font-normal text-slate-400">уроков</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Пробных (лидов)</div>
            <div className="text-lg font-black text-amber-600 leading-tight">
              {trialAppointments.length} <span className="text-xs font-normal text-slate-400">вводных</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">В штате репетиторов</div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              {tutors.length} <span className="text-xs font-normal text-slate-400">экспертов</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Загрузка слотов</div>
            <div className="text-lg font-black text-slate-900 leading-tight">
              78% <span className="text-xs font-normal text-emerald-600 font-semibold">+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 flex-shrink-0">
          Предмет:
        </span>
        {SUBJECT_BUTTONS.map(s => (
          <button
            key={s.id}
            onClick={() => onSelectSubject(s.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              selectedSubject === s.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
