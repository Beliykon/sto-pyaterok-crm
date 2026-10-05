import React, { useState, useMemo } from 'react';
import { 
  Appointment, 
  Tutor, 
  Manager, 
  CurrentUser, 
  ConfirmationStatus, 
  TrialSalesResult, 
  TrialOutcome, 
  DeclineReason 
} from '../lib/types';
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Briefcase,
  Flame,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  Users,
  Calendar,
  ChevronRight,
  Send,
  AlertCircle,
  Plus,
  ExternalLink,
  DollarSign,
  Award,
  Layers,
  Check,
  X,
  RefreshCw,
  Zap,
  Target,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import LeadConfirmationModal from './LeadConfirmationModal';

interface ManagerPortalViewProps {
  currentUser: CurrentUser;
  managers: Manager[];
  tutors: Tutor[];
  appointments: Appointment[];
  openSlots: Record<string, boolean>;
  onOpenBooking: (prefill?: { tutorId?: string; date?: string; time?: string }) => void;
  onOpenLessonDetail: (appointment: Appointment) => void;
  onSaveTrialResult: (appointmentId: string, result: TrialSalesResult) => void;
  onUpdateConfirmationStatus: (appointmentId: string, status: ConfirmationStatus) => void;
  onOpenSchedule: () => void;
  onOpenReschedule: (appointment: Appointment) => void;
  onSelectManager?: (manager: Manager) => void;
}

const PACKAGES = [
  { id: '4_lessons', label: 'Пакет 4 занятия', price: 6800 },
  { id: '8_lessons', label: 'Пакет 8 занятий', price: 13600 },
  { id: '16_lessons', label: 'Пакет 16 занятий (Популярный 🔥)', price: 27200 },
  { id: '32_lessons', label: 'Пакет 32 занятия (Полный курс)', price: 51200 },
];

export default function ManagerPortalView({
  currentUser,
  managers,
  tutors,
  appointments,
  openSlots,
  onOpenBooking,
  onOpenLessonDetail,
  onSaveTrialResult,
  onUpdateConfirmationStatus,
  onOpenSchedule,
  onOpenReschedule,
  onSelectManager,
}: ManagerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'smart_booking' | 'confirmations' | 'sales_history'>('pipeline');
  
  // Selected manager for view (defaults to current manager or first)
  const currentManagerId = currentUser.managerId || (managers[0]?.id ?? 'mgr-1');
  const [selectedManagerId, setSelectedManagerId] = useState<string>(currentManagerId);

  const activeManager = managers.find(m => m.id === selectedManagerId) || managers[0] || {
    id: 'mgr-1',
    name: currentUser.name,
    role: 'manager',
    email: 'manager@sto-pyaterok.ru',
    phone: '+7 (926) 111-22-33',
    active: true,
    createdAt: '2026-01-01',
  };

  // State for closing deals modal
  const [closingDealApp, setClosingDealApp] = useState<Appointment | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'4_lessons' | '8_lessons' | '16_lessons' | '32_lessons' | 'custom'>('16_lessons');
  const [customAmount, setCustomAmount] = useState<string>('27200');

  // State for decline modal
  const [decliningDealApp, setDecliningDealApp] = useState<Appointment | null>(null);
  const [declineReason, setDeclineReason] = useState<DeclineReason>('expensive');
  const [declineComment, setDeclineComment] = useState('');

  // State for "Client thinking" modal
  const [thinkingDealApp, setThinkingDealApp] = useState<Appointment | null>(null);
  const [thinkingComment, setThinkingComment] = useState('');

  // Lead confirmation modal
  const [confirmingApp, setConfirmingApp] = useState<Appointment | null>(null);

  // Smart Booking filters in tab 2
  const [searchSubject, setSearchSubject] = useState<string>('all');
  const [searchGrade, setSearchGrade] = useState<string>('all');
  const [searchGoal, setSearchGoal] = useState<string>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // 1. KPI Calculations
  const trials = appointments.filter(a => a.type === 'trial' && a.status !== 'cancelled');
  
  // Hot leads: trial lessons that have teacher recommendation & feedback
  const hotLeads = appointments.filter(
    a => a.postLessonFeedback && a.status !== 'cancelled' && (!a.trialResult || a.trialResult.outcome === 'thinking')
  );

  // Purchased deals
  const purchasedDeals = appointments.filter(
    a => a.trialResult?.outcome === 'purchased'
  );

  const totalRevenue = purchasedDeals.reduce((sum, a) => {
    return sum + (a.trialResult?.purchaseAmount || 27200);
  }, 0);

  const closedTrialsCount = appointments.filter(
    a => a.trialResult && (a.trialResult.outcome === 'purchased' || a.trialResult.outcome === 'declined')
  ).length;

  const conversionRate = closedTrialsCount > 0 
    ? Math.round((purchasedDeals.length / closedTrialsCount) * 100) 
    : 72;

  // Confirmations needed (today & tomorrow)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const upcomingToConfirm = appointments.filter(a => {
    if (a.status === 'cancelled') return false;
    return (a.date === todayStr || a.date === tomorrowStr) && a.confirmationStatus !== 'confirmed';
  });

  // Calculate available open slots count for selected date
  const openSlotsCount = useMemo(() => {
    return Object.keys(openSlots).filter(k => {
      if (!openSlots[k]) return false;
      return k.includes(`_${bookingDateFilter}_`);
    }).length;
  }, [openSlots, bookingDateFilter]);

  // Handle closing deal (Purchase)
  const handleConfirmPurchase = () => {
    if (!closingDealApp) return;
    const amount = selectedPackage === 'custom' 
      ? parseInt(customAmount, 10) || 27200 
      : PACKAGES.find(p => p.id === selectedPackage)?.price || 27200;

    const result: TrialSalesResult = {
      outcome: 'purchased',
      purchasedPackage: selectedPackage,
      purchaseAmount: amount,
      updatedAt: new Date().toISOString(),
      managerName: activeManager.name,
    };

    onSaveTrialResult(closingDealApp.id, result);
    setClosingDealApp(null);
  };

  // Handle decline
  const handleConfirmDecline = () => {
    if (!decliningDealApp) return;
    const result: TrialSalesResult = {
      outcome: 'declined',
      declineReason,
      declineComment: declineComment.trim(),
      updatedAt: new Date().toISOString(),
      managerName: activeManager.name,
    };

    onSaveTrialResult(decliningDealApp.id, result);
    setDecliningDealApp(null);
    setDeclineComment('');
  };

  // Handle thinking
  const handleConfirmThinking = () => {
    if (!thinkingDealApp) return;
    const result: TrialSalesResult = {
      outcome: 'thinking',
      declineComment: thinkingComment.trim(),
      updatedAt: new Date().toISOString(),
      managerName: activeManager.name,
    };

    onSaveTrialResult(thinkingDealApp.id, result);
    setThinkingDealApp(null);
    setThinkingComment('');
  };

  // Filter tutors for Smart Booking
  const filteredTutorsForBooking = useMemo(() => {
    return tutors.filter(t => {
      if (searchSubject !== 'all') {
        const matchesSubj = t.subjects.some(s => s.toLowerCase().includes(searchSubject.toLowerCase()));
        if (!matchesSubj) return false;
      }
      return true;
    });
  }, [tutors, searchSubject]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Manager Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-white font-black text-xl shadow-inner">
              <Briefcase size={28} className="text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  Отдел продаж и сопровождения (МОП)
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>В сети</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
                Кабинет менеджера: {activeManager.name}
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Воронка вводных уроков, подбор свободных слотов репетиторов и дожим клиентов
              </p>
            </div>
          </div>

          {/* Quick Actions & Manager Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Manager Picker (if Admin or multiple managers) */}
            {currentUser.role === 'admin' && managers.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className="text-indigo-200 text-[11px]">Менеджер:</span>
                <select
                  value={selectedManagerId}
                  onChange={e => {
                    setSelectedManagerId(e.target.value);
                    const found = managers.find(m => m.id === e.target.value);
                    if (found && onSelectManager) onSelectManager(found);
                  }}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {managers.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Book Trial Button */}
            <button
              onClick={() => onOpenBooking()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Plus size={15} />
              <span>Записать на вводный урок</span>
            </button>

            {/* Jump to Schedule Grid */}
            <button
              onClick={onOpenSchedule}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center space-x-1.5"
              title="Открыть общее расписание школы"
            >
              <Calendar size={14} />
              <span>Шахматка школы</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
              <span>Горячие лиды</span>
              <Flame size={14} className="text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{hotLeads.length}</div>
            <div className="text-[10px] text-amber-300 font-medium mt-0.5">готовы к оплате</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
              <span>Звонки-напоминания</span>
              <Phone size={14} className="text-rose-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{upcomingToConfirm.length}</div>
            <div className="text-[10px] text-rose-300 font-medium mt-0.5">на сегодня и завтра</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
              <span>Конверсия пробных</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{conversionRate}%</div>
            <div className="text-[10px] text-emerald-300 font-medium mt-0.5">из урока в продажу</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
              <span>Оплат пакетов</span>
              <Award size={14} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{purchasedDeals.length}</div>
            <div className="text-[10px] text-indigo-300 font-medium mt-0.5">закрытых сделок</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-semibold">
              <span>Выручка с пакетов</span>
              <DollarSign size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
              {totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="text-[10px] text-slate-300 font-medium mt-0.5">общий объём продаж</div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { 
            id: 'pipeline', 
            label: '🔥 Воронка дожима и Оплаты', 
            count: hotLeads.length > 0 ? hotLeads.length : undefined,
            color: 'bg-amber-500'
          },
          { 
            id: 'smart_booking', 
            label: '⚡ Умный подбор слота и запись',
          },
          { 
            id: 'confirmations', 
            label: '📞 Доходимость и Подтверждения', 
            count: upcomingToConfirm.length > 0 ? upcomingToConfirm.length : undefined,
            color: 'bg-rose-500'
          },
          { 
            id: 'sales_history', 
            label: `💰 Архив оплат (${purchasedDeals.length})` 
          },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] text-white px-1.5 py-0.2 rounded-full font-black ${tab.color || 'bg-indigo-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Pipeline & Closing Deals */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Hot leads grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Flame size={18} className="text-amber-500" />
                  <span>Ученики после проведенного вводного урока ({hotLeads.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Преподаватель заполнил экспресс-отчет и рекомендовал курс. Позвоните родителю и закройте сделку!
                </p>
              </div>
            </div>

            {hotLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Сейчас нет горячих заявок, ожидающих решения после вводного урока.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotLeads.map(lead => {
                  const fb = lead.postLessonFeedback!;
                  return (
                    <div
                      key={lead.id}
                      className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 hover:bg-white hover:border-amber-400 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900">{lead.studentName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                              {lead.subject}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {lead.grade} • Учитель: <strong className="text-slate-700">{lead.tutorName}</strong>
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            fb.readyToBuy === 'high'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fb.readyToBuy === 'medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {fb.readyToBuy === 'high' ? '🔥 Готов покупать' : '⚡ Тёплый интерес'}
                        </span>
                      </div>

                      {/* Tutor Recommendation Quote */}
                      <div className="p-3 bg-white rounded-xl border border-amber-200/60 text-xs space-y-1">
                        <div className="font-bold text-amber-900 flex items-center space-x-1">
                          <Sparkles size={12} className="text-amber-600" />
                          <span>Рекомендация преподавателя:</span>
                        </div>
                        <div className="font-semibold text-slate-800">{fb.recommendation}</div>
                        {fb.studentLevel && (
                          <div className="text-[11px] text-slate-600">
                            Уровень: <strong>{fb.studentLevel}</strong>
                          </div>
                        )}
                        {fb.notes && (
                          <div className="text-[10px] text-slate-500 italic pt-0.5 border-t border-slate-100 mt-1">
                            «{fb.notes}»
                          </div>
                        )}
                      </div>

                      {/* Parent Phone & Actions */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-[11px] text-slate-400 block">Телефон родителя:</span>
                          <span className="font-extrabold text-slate-900">{lead.parentPhone}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setThinkingDealApp(lead)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                            title="Клиент думает"
                          >
                            Думает
                          </button>

                          <button
                            type="button"
                            onClick={() => setDecliningDealApp(lead)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors border border-rose-200"
                            title="Отказ от покупки"
                          >
                            Отказ
                          </button>

                          <button
                            type="button"
                            onClick={() => setClosingDealApp(lead)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 size={13} />
                            <span>Оформить оплату</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Smart Tutor Matching & Instant Booking */}
      {activeTab === 'smart_booking' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Zap size={18} className="text-amber-500" />
              <span>Умный подбор преподавателя и свободного слота</span>
            </h3>
            <p className="text-xs text-slate-500">
              Быстро найдите свободного учителя нужного предмета и запишите ученика прямо во время звонка
            </p>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Дата урока:
                </label>
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={e => setBookingDateFilter(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Предмет:
                </label>
                <select
                  value={searchSubject}
                  onChange={e => setSearchSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="all">Все предметы</option>
                  <option value="Математика">Математика</option>
                  <option value="Русский язык">Русский язык</option>
                  <option value="Физика">Физика</option>
                  <option value="Информатика">Информатика</option>
                  <option value="Обществознание">Обществознание</option>
                  <option value="Английский язык">Английский язык</option>
                  <option value="Химия">Химия</option>
                  <option value="Биология">Биология</option>
                </select>
              </div>

              {/* Quick stats on date */}
              <div className="flex flex-col justify-end">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Свободных окон на {bookingDateFilter}:</span>
                  <span className="font-black text-sm text-emerald-700 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                    {openSlotsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tutor cards with their available slots on selected date */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorsForBooking.map(tutor => {
              // Find slots for this tutor on the selected date
              const tutorSlots = Object.keys(openSlots).filter(k => {
                return openSlots[k] === true && k.startsWith(`${tutor.id}_${bookingDateFilter}_`);
              }).map(k => k.split('_')[2]).sort();

              return (
                <div
                  key={tutor.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-3">
                      <img
                        src={tutor.avatar}
                        alt={tutor.name}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{tutor.name}</h4>
                        <p className="text-[11px] text-slate-500">{tutor.subjects.join(', ')}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Конверсия: {tutor.salesConversionRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Available Open Slots */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Окна на {bookingDateFilter}:</span>
                        <span className="text-[10px] text-slate-400">кликните для записи</span>
                      </div>

                      {tutorSlots.length === 0 ? (
                        <div className="text-center py-2 bg-slate-50 rounded-lg text-[11px] text-slate-400">
                          Нет открытых окон на эту дату
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {tutorSlots.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                onOpenBooking({
                                  tutorId: tutor.id,
                                  date: bookingDateFilter,
                                  time: time,
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200/90 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
                              title={`Записать ученика к ${tutor.shortName} на ${time}`}
                            >
                              <Clock size={11} />
                              <span>{time}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenBooking({
                        tutorId: tutor.id,
                        date: bookingDateFilter,
                      });
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Записать на другое время</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Confirmations & Show-rate */}
      {activeTab === 'confirmations' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Phone size={18} className="text-indigo-600" />
                <span>Контроль доходимости и подтверждения (Сегодня и Завтра)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Позвоните или напишите родителям за 2–4 часа до начала вводного урока, чтобы обеспечить 100% явку
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {appointments
              .filter(a => (a.date === todayStr || a.date === tomorrowStr) && a.status !== 'cancelled')
              .map(app => {
                const isConfirmed = app.confirmationStatus === 'confirmed';
                const isReminded = app.confirmationStatus === 'reminded';

                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                        app.date === todayStr ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <span>{app.date === todayStr ? 'Сегодня' : 'Завтра'}</span>
                        <span className="text-[10px]">{app.startTime}</span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{app.studentName}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            app.type === 'trial' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {app.type === 'trial' ? 'Пробный' : 'Урок'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {app.grade} • {app.subject} • Преподаватель: <strong className="text-slate-700">{app.tutorName}</strong>
                        </p>
                        <p className="text-[11px] text-slate-700 mt-0.5">
                          Телефон: <strong className="text-indigo-900">{app.parentPhone}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      {/* Status indicator */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isReminded
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isConfirmed ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Подтверждён ✓</span>
                          </>
                        ) : isReminded ? (
                          <>
                            <Send size={13} />
                            <span>Напомнили</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} />
                            <span>Требует звонка</span>
                          </>
                        )}
                      </span>

                      {/* Quick Confirm button */}
                      {!isConfirmed && (
                        <button
                          type="button"
                          onClick={() => onUpdateConfirmationStatus(app.id, 'confirmed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                        >
                          Подтвердить в 1 клик
                        </button>
                      )}

                      {/* Send template message via Telegram / SMS modal */}
                      <button
                        type="button"
                        onClick={() => setConfirmingApp(app)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-lg border border-indigo-200 transition-colors flex items-center space-x-1"
                        title="Открыть шаблон напоминания со ссылкой на онлайн-класс"
                      >
                        <MessageSquare size={13} />
                        <span>Шаблон родителю</span>
                      </button>

                      {/* Reschedule */}
                      <button
                        type="button"
                        onClick={() => onOpenReschedule(app)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Перенести
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 4: Sales Archive & Revenue */}
      {activeTab === 'sales_history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign size={18} className="text-emerald-600" />
                <span>Журнал оплаченных пакетов уроков</span>
              </h3>
              <p className="text-xs text-slate-500">
                Все успешные продажи курсов обучения
              </p>
            </div>
            <div className="text-sm font-black text-slate-900 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-xl">
              Сумма: {totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {purchasedDeals.map(deal => (
              <div key={deal.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{deal.studentName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {deal.grade} • {deal.subject} • Преподаватель: {deal.tutorName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-700 text-sm">
                    +{(deal.trialResult?.purchaseAmount || 27200).toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {deal.trialResult?.purchasedPackage === '4_lessons' ? '4 занятия' :
                     deal.trialResult?.purchasedPackage === '8_lessons' ? '8 занятий' :
                     deal.trialResult?.purchasedPackage === '16_lessons' ? '16 занятий' :
                     deal.trialResult?.purchasedPackage === '32_lessons' ? '32 занятия' : 'Пакет'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for closing deals, declining, thinking */}
      {/* 1. Purchase Confirmation Dialog */}
      {closingDealApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>Фиксация оплаты пакета</span>
              </h3>
              <button
                onClick={() => setClosingDealApp(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">Ученик:</p>
              <p className="font-bold text-slate-900 text-sm">{closingDealApp.studentName} ({closingDealApp.grade})</p>
              <p className="text-xs text-slate-600">Предмет: {closingDealApp.subject} • Учитель: {closingDealApp.tutorName}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Выберите оплаченный пакет:</label>
              <div className="space-y-1.5">
                {PACKAGES.map(pkg => (
                  <label
                    key={pkg.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedPackage === pkg.id 
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="deal_pkg"
                        checked={selectedPackage === pkg.id}
                        onChange={() => setSelectedPackage(pkg.id as any)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">{pkg.label}</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 font-mono">
                      {pkg.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClosingDealApp(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Зафиксировать оплату ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Client Thinking Dialog */}
      {thinkingDealApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Статус: Клиент думает</h3>
              <button onClick={() => setThinkingDealApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Укажите комментарий (например: «Ждут зарплату 15-го числа», «Сравнивают с оффлайн репетитором»):
            </p>

            <textarea
              value={thinkingComment}
              onChange={e => setThinkingComment(e.target.value)}
              placeholder="Комментарий менеджера..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 h-24"
            />

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setThinkingDealApp(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmThinking}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Decline Dialog */}
      {decliningDealApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base text-rose-600">Отказ от покупки</h3>
              <button onClick={() => setDecliningDealApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Причина отказа:</label>
              <select
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value as DeclineReason)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="expensive">Дорого / нет бюджета</option>
                <option value="tutor_mismatch">Не подошел репетитор</option>
                <option value="competitor">Выбрали конкурента</option>
                <option value="schedule_conflict">Не сошлись по расписанию</option>
                <option value="changed_mind">Передумали заниматься</option>
                <option value="other">Другая причина</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Комментарий:</label>
              <textarea
                value={declineComment}
                onChange={e => setDeclineComment(e.target.value)}
                placeholder="Подробности..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 h-20"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDecliningDealApp(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Зафиксировать отказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <LeadConfirmationModal
        isOpen={!!confirmingApp}
        onClose={() => setConfirmingApp(null)}
        appointment={confirmingApp}
        onUpdateStatus={(appId, status) => {
          onUpdateConfirmationStatus(appId, status);
          setConfirmingApp(null);
        }}
      />
    </div>
  );
}
