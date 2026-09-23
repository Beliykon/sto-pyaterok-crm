import React, { useState } from 'react';
import { Appointment, UserRole, TrialSalesResult, TrialOutcome, DeclineReason } from '../lib/types';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  DollarSign,
  XCircle,
  Clock4,
  Tag,
  Target,
  GraduationCap
} from 'lucide-react';
import { formatRu } from '../lib/dateUtils';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onMarkCompleted: (appointmentId: string, recommendation?: string) => void;
  onMarkAbsent: (appointmentId: string, notes?: string) => void;
  onOpenReschedule: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onSaveTrialResult?: (appointmentId: string, result: TrialSalesResult) => void;
  role?: UserRole;
}

const PACKAGES = [
  { id: '8_lessons', label: '8 занятий (1 месяц)', amount: 14400 },
  { id: '16_lessons', label: '16 занятий (2 месяца)', amount: 27200 },
  { id: '32_lessons', label: '32 занятия (Полгода)', amount: 51200 },
  { id: '64_lessons', label: '64 занятия (Годовой курс)', amount: 96000 },
];

const DECLINE_REASONS: { id: DeclineReason; label: string }[] = [
  { id: 'expensive', label: 'Дорого / нет бюджета' },
  { id: 'tutor_mismatch', label: 'Не подошёл преподаватель / темп' },
  { id: 'competitor', label: 'Выбрали конкурентов / другую школу' },
  { id: 'changed_mind', label: 'Передумали сдавать / отложили' },
  { id: 'schedule_conflict', label: 'Не совпало время / расписание' },
  { id: 'other', label: 'Другая причина' },
];

export default function LessonDetailModal({
  isOpen,
  onClose,
  appointment,
  onMarkCompleted,
  onMarkAbsent,
  onOpenReschedule,
  onCancelAppointment,
  onSaveTrialResult,
  role = 'manager',
}: LessonDetailModalProps) {
  const [recommendation, setRecommendation] = useState('');
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Trial outcome workflow state
  const [salesAction, setSalesAction] = useState<'none' | 'buy' | 'decline'>('none');
  const [selectedPackage, setSelectedPackage] = useState<'8_lessons' | '16_lessons' | '32_lessons' | '64_lessons' | 'custom'>('16_lessons');
  const [purchaseAmount, setPurchaseAmount] = useState(27200);
  const [declineReason, setDeclineReason] = useState<DeclineReason>('expensive');
  const [declineComment, setDeclineComment] = useState('');

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !appointment) return null;

  const isTutor = role === 'tutor';

  // Anti-poaching phone mask
  const maskedPhone = isTutor
    ? `${appointment.parentPhone.slice(0, 7)}•••-••-${appointment.parentPhone.slice(-2)}`
    : appointment.parentPhone;

  const handleCopyReminder = () => {
    const text = `Здравствуйте! Напоминаем о вводном занятии по предмету «${appointment.subject}» для ученика ${appointment.studentName} сегодня в ${appointment.startTime}. Преподаватель: ${appointment.tutorName}. Ссылка на онлайн-урок будет в личном кабинете. Ждем вас! Онлайн-школа «100 Пятёрок».`;
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  const handleSaveCompleted = () => {
    onMarkCompleted(appointment.id, recommendation.trim() || undefined);
    setIsMarkingDone(false);
  };

  const handleSaveAbsent = () => {
    onMarkAbsent(appointment.id, 'Ученик не явился на занятие');
    if (onSaveTrialResult) {
      onSaveTrialResult(appointment.id, {
        outcome: 'no_show',
        updatedAt: new Date().toISOString(),
        managerName: role === 'tutor' ? 'Преподаватель' : 'Отдел продаж',
      });
    }
    onClose();
  };

  const handleDelete = () => {
    onCancelAppointment(appointment.id);
    setIsConfirmingDelete(false);
    onClose();
  };

  // Submit trial purchase
  const handleConfirmPurchase = () => {
    if (!onSaveTrialResult) return;
    onSaveTrialResult(appointment.id, {
      outcome: 'purchased',
      purchasedPackage: selectedPackage,
      purchaseAmount: Number(purchaseAmount),
      updatedAt: new Date().toISOString(),
      managerName: 'Отдел продаж',
    });
    setSalesAction('none');
  };

  // Submit trial decline
  const handleConfirmDecline = () => {
    if (!onSaveTrialResult) return;
    onSaveTrialResult(appointment.id, {
      outcome: 'declined',
      declineReason,
      declineComment: declineComment.trim() || undefined,
      updatedAt: new Date().toISOString(),
      managerName: 'Отдел продаж',
    });
    setSalesAction('none');
  };

  // Mark thinking
  const handleMarkThinking = () => {
    if (!onSaveTrialResult) return;
    onSaveTrialResult(appointment.id, {
      outcome: 'thinking',
      updatedAt: new Date().toISOString(),
      managerName: 'Отдел продаж',
    });
  };

  const isTrial = appointment.type === 'trial';
  const trialResult = appointment.trialResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                appointment.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : appointment.type === 'trial'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {appointment.status === 'completed'
                ? '✓ Урок проведён'
                : appointment.type === 'trial'
                ? '🔵 Вводный (0 ₽)'
                : '🟣 Регулярный'}
            </span>
            <span className="text-xs font-bold text-slate-600">
              {appointment.startTime} – {appointment.endTime}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Main Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {appointment.studentName}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-2">
              <span>{appointment.grade}</span>
              <span>•</span>
              <strong className="text-indigo-600 font-bold">{appointment.subject}</strong>
              {appointment.learningGoalCategory && (
                <>
                  <span>•</span>
                  <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase">
                    {appointment.learningGoalCategory === 'ege' ? '🎯 ЕГЭ' : appointment.learningGoalCategory === 'oge' ? '📘 ОГЭ' : appointment.learningGoalCategory === 'olympiad' ? '🏆 Олимпиада' : '📈 Успеваемость'}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Point 2: Clear MOP Request Card if present */}
          {(appointment.mopRequest || appointment.notes?.includes('[Запрос МОП]')) && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50/70 rounded-xl border border-indigo-200 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                <Tag size={14} className="text-indigo-600" />
                <span>Запрос МОП при записи:</span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">
                {appointment.mopRequest?.requestText || appointment.notes}
              </p>
              {appointment.studentGoal && (
                <div className="text-[11px] text-indigo-700 font-semibold pt-1 border-t border-indigo-200/60">
                  Цель: {appointment.studentGoal}
                </div>
              )}
            </div>
          )}

          {/* Details list */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Дата урока:</span>
              <span className="font-semibold text-slate-800">
                {formatRu(new Date(appointment.date), 'd MMMM yyyy (EEEE)')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Преподаватель:</span>
              <span className="font-semibold text-slate-800">{appointment.tutorName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Телефон родителя:</span>
              {isTutor ? (
                <span className="font-bold text-slate-800 flex items-center space-x-1.5 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                  <Lock size={12} className="text-amber-600" />
                  <span>{maskedPhone}</span>
                </span>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{appointment.parentPhone}</span>
                  <a
                    href={`https://wa.me/${appointment.parentPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Anti-poaching badge for tutor */}
            {isTutor && (
              <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200/80 text-[11px] text-blue-900 flex items-start space-x-2">
                <ShieldCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <strong>Защита клиентской базы:</strong> прямой телефон скрыт политикой школы. Вопросы по оплатам и переносам согласуются через куратора.
                </div>
              </div>
            )}

            {/* Copy reminder button for managers */}
            {!isTutor && (
              <div className="pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={handleCopyReminder}
                  className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  {copiedReminder ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-emerald-600" />}
                  <span>{copiedReminder ? 'Текст скопирован в буфер!' : 'Скопировать напоминание для WhatsApp'}</span>
                </button>
              </div>
            )}

            {appointment.notes && !appointment.notes.includes('[Запрос МОП]') && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[11px] mb-0.5">Примечание:</span>
                <span className="text-slate-700 italic">«{appointment.notes}»</span>
              </div>
            )}

            {appointment.postLessonFeedback?.recommendation && (
              <div className="pt-2 border-t border-slate-200/60 bg-emerald-50/50 p-2 rounded-lg text-emerald-900">
                <span className="text-emerald-700 font-bold block text-[11px]">
                  Рекомендация преподавателя:
                </span>
                <span className="font-medium text-xs">
                  {appointment.postLessonFeedback.recommendation}
                </span>
              </div>
            )}
          </div>

          {/* Mark Status (Проведён / Неявка) */}
          {appointment.status !== 'completed' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Фиксация факта урока
              </label>

              {!isMarkingDone ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMarkingDone(true)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle2 size={15} />
                    <span>Урок проведён</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAbsent}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <AlertCircle size={15} />
                    <span>Неявка ученика</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-emerald-900">
                    Рекомендация по пакету для отдела продаж:
                  </label>
                  <input
                    type="text"
                    value={recommendation}
                    onChange={e => setRecommendation(e.target.value)}
                    placeholder="Например: Пакет 16 занятий, 2 раза в неделю"
                    className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsMarkingDone(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCompleted}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      Подтвердить проведение
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Point 4: TRIAL SALES OUTCOME SECTION (КУПИЛ ИЛИ ОТКАЗАЛСЯ) */}
          {isTrial && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <DollarSign size={14} className="text-emerald-600" />
                  <span>Результат вводного урока (Конверсия в продажу)</span>
                </span>
                {trialResult && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    trialResult.outcome === 'purchased'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : trialResult.outcome === 'declined'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : trialResult.outcome === 'thinking'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {trialResult.outcome === 'purchased' ? '✓ Купил пакет' : trialResult.outcome === 'declined' ? '✗ Отказ' : trialResult.outcome === 'thinking' ? '⏳ Думает' : 'Не пришёл'}
                  </span>
                )}
              </div>

              {/* Already has outcome banner */}
              {trialResult && salesAction === 'none' && (
                <div className={`p-3 rounded-xl border text-xs ${
                  trialResult.outcome === 'purchased'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : trialResult.outcome === 'declined'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  {trialResult.outcome === 'purchased' ? (
                    <div>
                      <div className="font-black text-emerald-900 text-sm flex items-center justify-between">
                        <span>Оплачен абонемент: {trialResult.purchaseAmount?.toLocaleString('ru-RU')} ₽</span>
                        <span className="text-xs font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                          {PACKAGES.find(p => p.id === trialResult.purchasedPackage)?.label || 'Пакет занятий'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Успешная продажа зафиксирована в аналитике школы.
                      </p>
                    </div>
                  ) : trialResult.outcome === 'declined' ? (
                    <div>
                      <div className="font-bold text-rose-900">
                        Отказ после пробного: {DECLINE_REASONS.find(r => r.id === trialResult.declineReason)?.label || 'Отказ'}
                      </div>
                      {trialResult.declineComment && (
                        <p className="text-[11px] text-rose-800 italic mt-0.5">
                          «{trialResult.declineComment}»
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="font-semibold text-amber-900">
                      Клиент думает. Назначен контрольный контакт менеджера.
                    </div>
                  )}

                  {!isTutor && (
                    <button
                      type="button"
                      onClick={() => setSalesAction('buy')}
                      className="mt-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      Изменить результат продажи
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons if not tutor and no active form */}
              {!isTutor && salesAction === 'none' && !trialResult && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSalesAction('buy')}
                    className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span>Купил пакет</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSalesAction('decline')}
                    className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
                  >
                    <XCircle size={14} />
                    <span>Отказ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkThinking}
                    className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Clock4 size={14} />
                    <span>Думает</span>
                  </button>
                </div>
              )}

              {/* Sub-form: BUY PACKAGE */}
              {salesAction === 'buy' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>Оформление покупки после пробного</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSalesAction('none')}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Отмена
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Выберите приобретенный пакет:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PACKAGES.map(pkg => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => {
                            setSelectedPackage(pkg.id as any);
                            setPurchaseAmount(pkg.amount);
                          }}
                          className={`p-2 rounded-lg text-left border transition-all text-xs ${
                            selectedPackage === pkg.id
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-bold'
                              : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                          }`}
                        >
                          <div className="font-semibold">{pkg.label}</div>
                          <div className="text-[11px] opacity-90">{pkg.amount.toLocaleString('ru-RU')} ₽</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Сумма оплаты (₽):
                      </label>
                      <input
                        type="number"
                        value={purchaseAmount}
                        onChange={e => setPurchaseAmount(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleConfirmPurchase}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Зафиксировать продажу</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-form: DECLINE */}
              {salesAction === 'decline' && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-950 flex items-center space-x-1.5">
                      <XCircle size={15} className="text-rose-600" />
                      <span>Причина отказа после пробного</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSalesAction('none')}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Отмена
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Основная причина слива:
                    </label>
                    <select
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value as DeclineReason)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                    >
                      {DECLINE_REASONS.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Комментарий клиента / МОПа:
                    </label>
                    <input
                      type="text"
                      value={declineComment}
                      onChange={e => setDeclineComment(e.target.value)}
                      placeholder="Например: Сказали, что дорого, ищут студента за 800 руб/час"
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleConfirmDecline}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Сохранить отказ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions (Перенести / Отменить) */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onOpenReschedule(appointment);
                onClose();
              }}
              className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 flex items-center space-x-1.5 transition-colors"
            >
              <ArrowRightLeft size={13} />
              <span>Перенести урок</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-rose-800 mr-1">Точно отменить?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
                >
                  Да, отменить
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Нет
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Trash2 size={13} />
                <span>Отменить запись</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
