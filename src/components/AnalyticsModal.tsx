import React, { useState, useMemo } from 'react';
import { Appointment, Tutor } from '../lib/types';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Target, 
  BarChart3, 
  ArrowUpRight,
  Filter,
  PieChart,
  Download
} from 'lucide-react';
import { formatRu } from '../lib/dateUtils';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  tutors: Tutor[];
}

type PeriodFilter = 'all' | 'month' | 'week';

const REASON_LABELS: Record<string, string> = {
  expensive: 'Дорого / нет бюджета',
  tutor_mismatch: 'Не подошёл репетитор / темп',
  competitor: 'Выбрали конкурентов',
  changed_mind: 'Передумали / отложили',
  schedule_conflict: 'Не совпало расписание',
  other: 'Другая причина',
};

export default function AnalyticsModal({
  isOpen,
  onClose,
  appointments,
  tutors,
}: AnalyticsModalProps) {
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Filter trial appointments
  const trialAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (a.type !== 'trial') return false;
      if (selectedSubject !== 'all' && a.subject !== selectedSubject) return false;
      return true;
    });
  }, [appointments, selectedSubject]);

  // Overall statistics calculation
  const stats = useMemo(() => {
    const totalTrials = trialAppointments.length;
    
    // Show-ups: completed or marked with trial outcome
    const attended = trialAppointments.filter(
      a => a.status === 'completed' || (a.trialResult && a.trialResult.outcome !== 'no_show')
    ).length;

    const noShow = trialAppointments.filter(
      a => a.trialResult?.outcome === 'no_show'
    ).length;

    // Purchased
    const purchasedList = trialAppointments.filter(
      a => a.trialResult?.outcome === 'purchased'
    );
    const purchasedCount = purchasedList.length;

    // Declined
    const declinedList = trialAppointments.filter(
      a => a.trialResult?.outcome === 'declined'
    );
    const declinedCount = declinedList.length;

    // Thinking
    const thinkingCount = trialAppointments.filter(
      a => a.trialResult?.outcome === 'thinking'
    ).length;

    // Total Revenue from trials
    const totalRevenue = purchasedList.reduce(
      (sum, a) => sum + (a.trialResult?.purchaseAmount || a.dealValue || 27200),
      0
    );

    // Average check
    const averageCheck = purchasedCount > 0 ? Math.round(totalRevenue / purchasedCount) : 0;

    // Rates
    const showUpRate = totalTrials > 0 ? Math.round((attended / totalTrials) * 100) : 0;
    // Conversion from attended to bought
    const conversionRate = attended > 0 ? Math.round((purchasedCount / attended) * 100) : 0;
    const declineRate = attended > 0 ? Math.round((declinedCount / attended) * 100) : 0;

    return {
      totalTrials,
      attended,
      noShow,
      purchasedCount,
      declinedCount,
      thinkingCount,
      totalRevenue,
      averageCheck,
      showUpRate,
      conversionRate,
      declineRate,
      purchasedList,
      declinedList,
    };
  }, [trialAppointments]);

  // Tutor conversion breakdown
  const tutorStats = useMemo(() => {
    return tutors.map(tutor => {
      const tutorTrials = trialAppointments.filter(a => a.tutorId === tutor.id);
      const attended = tutorTrials.filter(
        a => a.status === 'completed' || (a.trialResult && a.trialResult.outcome !== 'no_show')
      ).length;
      const bought = tutorTrials.filter(
        a => a.trialResult?.outcome === 'purchased'
      );
      const revenue = bought.reduce(
        (sum, a) => sum + (a.trialResult?.purchaseAmount || a.dealValue || 27200),
        0
      );
      const conversion = attended > 0 ? Math.round((bought.length / attended) * 100) : 0;

      return {
        tutor,
        totalTrials: tutorTrials.length,
        attended,
        boughtCount: bought.length,
        conversion,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue || b.conversion - a.conversion);
  }, [tutors, trialAppointments]);

  // Goal conversion breakdown (ЕГЭ vs ОГЭ vs Олимпиады vs Успеваемость)
  const goalStats = useMemo(() => {
    const goals = [
      { id: 'ege', label: 'Подготовка к ЕГЭ', icon: '🎯' },
      { id: 'oge', label: 'Подготовка к ОГЭ', icon: '📘' },
      { id: 'olympiad', label: 'Олимпиады', icon: '🏆' },
      { id: 'grades', label: 'Повышение успеваемости', icon: '📈' },
    ];

    return goals.map(g => {
      const list = trialAppointments.filter(
        a => a.learningGoalCategory === g.id || a.grade.toLowerCase().includes(g.id) || a.studentGoal?.toLowerCase().includes(g.label.toLowerCase())
      );
      const attended = list.filter(
        a => a.status === 'completed' || (a.trialResult && a.trialResult.outcome !== 'no_show')
      ).length;
      const bought = list.filter(a => a.trialResult?.outcome === 'purchased');
      const revenue = bought.reduce((sum, a) => sum + (a.trialResult?.purchaseAmount || 27200), 0);
      const conv = attended > 0 ? Math.round((bought.length / attended) * 100) : 0;

      return {
        ...g,
        total: list.length,
        attended,
        boughtCount: bought.length,
        revenue,
        conversion: conv,
      };
    });
  }, [trialAppointments]);

  // Decline reasons breakdown
  const declineStats = useMemo(() => {
    const reasons: Record<string, number> = {};
    trialAppointments.forEach(a => {
      if (a.trialResult?.outcome === 'declined') {
        const r = a.trialResult.declineReason || 'expensive';
        reasons[r] = (reasons[r] || 0) + 1;
      }
    });

    const totalDeclined = stats.declinedCount || 1;
    return Object.entries(reasons).map(([reasonKey, count]) => ({
      key: reasonKey,
      label: REASON_LABELS[reasonKey] || reasonKey,
      count,
      percent: Math.round((count / totalDeclined) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [trialAppointments, stats.declinedCount]);

  const exportAnalyticsCSV = () => {
    const headers = ['Показатель', 'Значение'];
    const rows = [
      ['Всего запланировано пробных', stats.totalTrials],
      ['Пришли на пробный (доходимость)', `${stats.attended} (${stats.showUpRate}%)`],
      ['Неявка на пробный', stats.noShow],
      ['Купили абонемент', `${stats.purchasedCount} (${stats.conversionRate}%)`],
      ['Отказались от покупки', `${stats.declinedCount} (${stats.declineRate}%)`],
      ['Клиент думает', stats.thinkingCount],
      ['Общая выручка с пробных', `${stats.totalRevenue} руб`],
      ['Средний чек', `${stats.averageCheck} руб`],
    ];

    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows.map(r => r.map(escapeCsv).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `100_pyaterok_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Аналитика воронки пробных и продаж
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Конверсия: {stats.conversionRate}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Учёт доходимости учеников на пробные, статистика покупок абонементов и анализ отказов
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={exportAnalyticsCSV}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Скачать сводный отчет по аналитике в формате CSV"
            >
              <Download size={14} className="text-emerald-600" />
              <span>Экспорт отчета</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Top KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Trials */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Пробных</span>
                <Users size={14} className="text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalTrials}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Запланировано
              </div>
            </div>

            {/* Show-up Rate */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center justify-between">
                <span>Дошли</span>
                <CheckCircle2 size={14} className="text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {stats.showUpRate}%
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">
                {stats.attended} из {stats.totalTrials} учеников
              </div>
            </div>

            {/* Bought (CR) */}
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-300 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                <span>Купили</span>
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {stats.conversionRate}%
              </div>
              <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                {stats.purchasedCount} оплат пакетов
              </div>
            </div>

            {/* Declined */}
            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/90 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center justify-between">
                <span>Отказы</span>
                <XCircle size={14} className="text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-900 mt-1">
                {stats.declineRate}%
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">
                {stats.declinedCount} слива клиентов
              </div>
            </div>

            {/* Total Revenue */}
            <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center justify-between">
                <span>Выручка</span>
                <DollarSign size={14} className="text-indigo-600" />
              </div>
              <div className="text-xl font-black text-indigo-950 mt-1 truncate">
                {stats.totalRevenue.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">
                С вводных уроков
              </div>
            </div>

            {/* Avg Check */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                <span>Ср. чек</span>
                <Award size={14} className="text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-950 mt-1 truncate">
                {stats.averageCheck.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-[10px] text-amber-800 mt-0.5">
                За абонемент
              </div>
            </div>
          </div>

          {/* 2. Visual Sales Funnel Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center space-x-1.5">
                <BarChart3 size={15} className="text-indigo-600" />
                <span>Воронка пробного урока: от записи до закрытия в оплату</span>
              </span>
              <span className="text-slate-500 font-semibold">
                Доходимость: {stats.showUpRate}% • Конверсия в продажу: {stats.conversionRate}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-semibold">1. Записано на пробное</div>
                <div className="text-lg font-bold text-slate-900">{stats.totalTrials} чел. (100%)</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-indigo-500 h-full w-full" />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                <div className="text-[11px] text-blue-700 font-semibold">2. Дошли и провели урок</div>
                <div className="text-lg font-bold text-blue-900">{stats.attended} чел. ({stats.showUpRate}%)</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-blue-500 h-full" style={{ width: `${stats.showUpRate}%` }} />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs">
                <div className="text-[11px] text-emerald-700 font-semibold">3. Оплатили абонемент</div>
                <div className="text-lg font-bold text-emerald-900">{stats.purchasedCount} чел. ({stats.conversionRate}%)</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-emerald-500 h-full" style={{ width: `${stats.conversionRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Two columns: Tutor conversion ranking + Goal breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tutor Conversion Table */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Award size={15} className="text-amber-500" />
                  <span>Рейтинг конверсии преподавателей</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  По выручке
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs overflow-y-auto max-h-[260px]">
                {tutorStats.map((item, idx) => (
                  <div key={item.tutor.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-900 font-black' : idx === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.tutor.shortName}</span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              Топ 🔥
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.tutor.subjects[0]} • {item.attended} уроков
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-emerald-700">
                        {item.revenue.toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {item.boughtCount} покупок ({item.conversion}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals & Decline Reasons */}
            <div className="space-y-4">
              {/* Goal Breakdown (ЕГЭ / ОГЭ / Олимпиады) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center space-x-1.5">
                  <Target size={15} className="text-indigo-600" />
                  <span>Конверсия по целям (ЕГЭ, ОГЭ, Олимпиады)</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  {goalStats.map(g => (
                    <div key={g.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center space-x-1">
                          <span>{g.icon}</span>
                          <span>{g.label}</span>
                        </span>
                        <span className="text-emerald-700 font-black">{g.conversion}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Оплат: {g.boughtCount}</span>
                        <span className="font-semibold text-slate-700">{g.revenue.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decline Analysis */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <XCircle size={15} className="text-rose-500" />
                  <span>Причины отказов после пробных ({stats.declinedCount} сливов)</span>
                </h4>

                {declineStats.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Отказов не зафиксировано</p>
                ) : (
                  <div className="space-y-2">
                    {declineStats.map(item => (
                      <div key={item.key}>
                        <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium">
                          <span>{item.label}</span>
                          <span className="font-bold text-slate-900">{item.count} ({item.percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div className="bg-rose-500 h-full" style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Recent Deals & Lost Leads Log */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Журнал последних закрытых сделок и сливов</span>
            </h4>

            <div className="divide-y divide-slate-100 text-xs overflow-x-auto">
              {trialAppointments
                .filter(a => !!a.trialResult)
                .slice(0, 8)
                .map(app => {
                  const res = app.trialResult!;
                  const isBought = res.outcome === 'purchased';
                  const isDecline = res.outcome === 'declined';

                  return (
                    <div key={app.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isBought ? 'bg-emerald-500' : isDecline ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <div>
                          <div className="font-bold text-slate-900">
                            {app.studentName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {app.grade} • Репетитор: {app.tutorName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isBought ? (
                          <>
                            <div className="font-black text-emerald-700">
                              +{(res.purchaseAmount || 27200).toLocaleString('ru-RU')} ₽
                            </div>
                            <div className="text-[10px] text-emerald-800 font-semibold">
                              Куплен абонемент
                            </div>
                          </>
                        ) : isDecline ? (
                          <>
                            <div className="font-bold text-rose-700">
                              Отказ: {REASON_LABELS[res.declineReason || 'expensive']}
                            </div>
                            {res.declineComment && (
                              <div className="text-[10px] text-rose-600 italic truncate max-w-[200px]">
                                «{res.declineComment}»
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-amber-800 font-bold">
                            Думает
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Данные воронки обновляются в режиме реального времени при отметке уроков менеджерами
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
