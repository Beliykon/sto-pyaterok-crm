import React, { useState } from 'react';
import { Appointment, Tutor, LessonType, UserRole } from '../lib/types';
import { 
  Search, 
  Filter, 
  Phone, 
  ExternalLink, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  User, 
  Download, 
  MessageSquare, 
  Sparkles,
  XCircle,
  Lock,
  ShieldCheck,
  Target,
  DollarSign,
  Tag
} from 'lucide-react';
import { format, isToday } from 'date-fns';

interface BookingsListProps {
  appointments: Appointment[];
  tutors: Tutor[];
  onCancelAppointment: (id: string) => void;
  onOpenBooking: () => void;
  onOpenLessonDetail?: (appointment: Appointment) => void;
  role?: UserRole;
  currentTutorId?: string;
  selectedGradeFilter?: string;
  selectedGoalFilter?: string;
  onSelectGradeFilter?: (grade: string) => void;
  onSelectGoalFilter?: (goal: string) => void;
}

export default function BookingsList({
  appointments,
  tutors,
  onCancelAppointment,
  onOpenBooking,
  onOpenLessonDetail,
  role = 'manager',
  currentTutorId,
  selectedGradeFilter = 'all',
  selectedGoalFilter = 'all',
  onSelectGradeFilter,
  onSelectGoalFilter,
}: BookingsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all'); // all, purchased, declined, thinking
  const [filterTutor, setFilterTutor] = useState<string>(
    role === 'tutor' && currentTutorId ? currentTutorId : 'all'
  );

  const isTutor = role === 'tutor';

  const filtered = appointments.filter(app => {
    if (app.status === 'cancelled') return false;

    // Search
    const matchesSearch = 
      app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.parentPhone.includes(searchTerm) ||
      (app.notes && app.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Type filter
    if (filterType === 'trial' && app.type !== 'trial') return false;
    if (filterType === 'regular' && app.type !== 'regular') return false;
    if (filterType === 'today' && app.date !== format(new Date(), 'yyyy-MM-dd')) return false;

    // Trial Outcome filter
    if (filterOutcome === 'purchased' && app.trialResult?.outcome !== 'purchased') return false;
    if (filterOutcome === 'declined' && app.trialResult?.outcome !== 'declined') return false;
    if (filterOutcome === 'thinking' && app.trialResult?.outcome !== 'thinking') return false;

    // Tutor filter
    if (filterTutor !== 'all' && app.tutorId !== filterTutor) return false;

    // Grade filter
    if (selectedGradeFilter !== 'all') {
      if (!app.grade.toLowerCase().includes(selectedGradeFilter.toLowerCase())) {
        return false;
      }
    }

    // Goal filter
    if (selectedGoalFilter !== 'all') {
      const g = selectedGoalFilter.toLowerCase();
      const hasGoal = 
        app.learningGoalCategory === g ||
        app.studentGoal?.toLowerCase().includes(g) ||
        app.grade.toLowerCase().includes(g) ||
        (app.notes && app.notes.toLowerCase().includes(g));
      if (!hasGoal) return false;
    }

    return true;
  });

  const exportCSV = () => {
    const headers = ['Дата', 'Время', 'Преподаватель', 'Ученик', 'Телефон', 'Класс', 'Предмет', 'Тип', 'Запрос МОП', 'Результат продажи', 'Сумма'];
    const escapeCsv = (val: string | number | undefined | null) => {
      const s = String(val ?? '');
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = filtered.map(a => [
      escapeCsv(a.date),
      escapeCsv(`${a.startTime}-${a.endTime}`),
      escapeCsv(a.tutorName),
      escapeCsv(a.studentName),
      escapeCsv(a.parentPhone),
      escapeCsv(a.grade),
      escapeCsv(a.subject),
      escapeCsv(a.type === 'trial' ? 'Пробный' : 'Регулярный'),
      escapeCsv(a.mopRequest ? `${a.mopRequest.goal}: ${a.mopRequest.requestText}` : a.notes || ''),
      escapeCsv(a.trialResult ? a.trialResult.outcome : 'В процессе'),
      escapeCsv(a.trialResult?.purchaseAmount ? `${a.trialResult.purchaseAmount} руб` : '')
    ]);

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `100_pyaterok_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Журнал записей отдела продаж</span>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                {filtered.length} записей
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Учет лидов на пробные, запросы клиентов и конверсии в оплаченные абонементы
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {!isTutor && (
              <button
                onClick={exportCSV}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Экспорт CSV</span>
              </button>
            )}
            <button
              onClick={onOpenBooking}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Sparkles size={14} />
              <span>+ Новая запись (МОП)</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по ученику, преподавателю, запросу..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Quick Type Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все уроки
            </button>
            <button
              onClick={() => setFilterType('trial')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'trial' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔵 Пробные
            </button>
            <button
              onClick={() => setFilterType('today')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterType === 'today' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Сегодня
            </button>
          </div>

          {/* Sales outcome filter */}
          <select
            value={filterOutcome}
            onChange={e => setFilterOutcome(e.target.value)}
            className="text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
          >
            <option value="all">Все результаты</option>
            <option value="purchased">✅ Купили абонемент</option>
            <option value="declined">❌ Отказ после пробного</option>
            <option value="thinking">⏳ Клиент думает</option>
          </select>

          {/* Tutor Filter */}
          {!isTutor && (
            <select
              value={filterTutor}
              onChange={e => setFilterTutor(e.target.value)}
              className="text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 max-w-[160px] truncate"
            >
              <option value="all">Все преподаватели</option>
              {tutors.map(t => (
                <option key={t.id} value={t.id}>
                  {t.shortName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 text-[11px]">
              <th className="py-3 px-4">Дата и время</th>
              <th className="py-3 px-4">Ученик / Класс</th>
              <th className="py-3 px-4">Запрос МОП</th>
              <th className="py-3 px-4">Контакты</th>
              <th className="py-3 px-4">Преподаватель</th>
              <th className="py-3 px-4">Тип</th>
              <th className="py-3 px-4">Статус продажи</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Записей по вашему фильтру не найдено
                </td>
              </tr>
            ) : (
              filtered.map(app => (
                <tr 
                  key={app.id} 
                  onClick={() => onOpenLessonDetail && onOpenLessonDetail(app)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  {/* Date & Time */}
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <CalendarIcon size={13} className="text-slate-400" />
                      <span>{app.date}</span>
                    </div>
                    <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
                      {app.startTime} – {app.endTime}
                    </div>
                  </td>

                  {/* Student & Grade */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{app.studentName}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{app.grade}</div>
                  </td>

                  {/* MOP Request (Point 2) */}
                  <td className="py-3 px-4 max-w-[240px]">
                    {app.mopRequest ? (
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                          {app.mopRequest.goal}
                        </div>
                        <div className="text-xs text-slate-700 font-medium truncate" title={app.mopRequest.requestText}>
                          {app.mopRequest.requestText}
                        </div>
                      </div>
                    ) : app.notes ? (
                      <div className="text-xs text-slate-600 italic truncate max-w-[200px]" title={app.notes}>
                        {app.notes}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {isTutor ? (
                      <div className="flex items-center space-x-1.5 text-slate-700 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded">
                        <Lock size={11} className="text-amber-600" />
                        <span>{app.parentPhone.slice(0, 6)}•••-••-{app.parentPhone.slice(-2)}</span>
                      </div>
                    ) : (
                      <div className="text-slate-800 font-medium text-xs">
                        {app.parentPhone}
                      </div>
                    )}
                  </td>

                  {/* Tutor & Subject */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{app.tutorName}</div>
                    <span className="inline-block text-[10px] font-medium text-slate-500">
                      {app.subject}
                    </span>
                  </td>

                  {/* Lesson Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : app.type === 'trial'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {app.status === 'completed' ? '✓ Проведён' : app.type === 'trial' ? '🔵 Пробный' : '🟣 Регулярный'}
                    </span>
                  </td>

                  {/* Sales Result Badge (Point 4) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {app.trialResult ? (
                      app.trialResult.outcome === 'purchased' ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          <span>Купил ({(app.trialResult.purchaseAmount || 27200).toLocaleString('ru-RU')} ₽)</span>
                        </span>
                      ) : app.trialResult.outcome === 'declined' ? (
                        <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                          <XCircle size={12} className="text-rose-700" />
                          <span>Отказ</span>
                        </span>
                      ) : app.trialResult.outcome === 'thinking' ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                          <Clock size={12} className="text-amber-700" />
                          <span>Думает</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Неявка</span>
                      )
                    ) : app.type === 'trial' ? (
                      <span className="text-blue-600 font-semibold text-[11px] hover:underline">
                        Указать результат →
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
