import React, { useState, useEffect } from 'react';
import { 
  Appointment, 
  UserRole, 
  TrialSalesResult, 
  TrialOutcome, 
  DeclineReason, 
  Tutor,
  LearningGoal,
  LessonType,
  LessonStatus
} from '../lib/types';
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
  ShieldCheck, 
  Lock, 
  Copy, 
  Check, 
  DollarSign, 
  XCircle, 
  Clock4, 
  Tag, 
  Edit3, 
  Save, 
  Phone,
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
  onUpdateAppointment?: (updatedAppointment: Appointment) => void;
  tutors?: Tutor[];
  role?: UserRole;
}

const PACKAGES = [
  { id: '4_lessons', label: '4 занятия', amount: 7200 },
  { id: '8_lessons', label: '8 занятий', amount: 14400 },
  { id: '16_lessons', label: '16 занятий', amount: 27200 },
  { id: '32_lessons', label: '32 занятия', amount: 51200 },
  { id: 'custom', label: 'Индивидуальный тариф', amount: 0 },
];

const DECLINE_REASONS: { id: DeclineReason; label: string }[] = [
  { id: 'expensive', label: 'Дорого / нет бюджета' },
  { id: 'tutor_mismatch', label: 'Не подошёл преподаватель / темп' },
  { id: 'competitor', label: 'Выбрали конкурентов / другую школу' },
  { id: 'changed_mind', label: 'Передумали сдавать / отложили' },
  { id: 'schedule_conflict', label: 'Не совпало время / расписание' },
  { id: 'other', label: 'Другая причина' },
];

const GRADES_LIST = [
  '1–4 класс (Начальная школа)',
  '5–8 класс (Средняя школа)',
  '9 класс (ОГЭ)',
  '10 класс (Профиль)',
  '11 класс (ЕГЭ)'
];

const GOAL_OPTIONS: { id: LearningGoal; label: string; icon: string }[] = [
  { id: 'ege', label: 'Подготовка к ЕГЭ', icon: '🎯' },
  { id: 'oge', label: 'Подготовка к ОГЭ', icon: '📘' },
  { id: 'olympiad', label: 'Олимпиады (Всерос/ВШЭ)', icon: '🏆' },
  { id: 'grades', label: 'Повышение успеваемости (4-5)', icon: '📈' },
  { id: 'admission', label: 'Поступление в лицей/вуз', icon: '🏫' },
  { id: 'other', label: 'Другая цель', icon: '✨' },
];

const TIME_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
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
  onUpdateAppointment,
  tutors = [],
  role = 'manager',
}: LessonDetailModalProps) {
  const [recommendation, setRecommendation] = useState('');
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editStudentName, setEditStudentName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTutorId, setEditTutorId] = useState('');
  const [editType, setEditType] = useState<LessonType>('trial');
  const [editStatus, setEditStatus] = useState<LessonStatus>('confirmed');
  const [editGoalCategory, setEditGoalCategory] = useState<LearningGoal>('ege');
  const [editGoalText, setEditGoalText] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Trial outcome workflow state
  const [forceShowTrialSection, setForceShowTrialSection] = useState(false);
  const [salesAction, setSalesAction] = useState<'none' | 'buy' | 'decline'>('none');
  const [selectedPackage, setSelectedPackage] = useState<'4_lessons' | '8_lessons' | '16_lessons' | '32_lessons' | 'custom'>('16_lessons');
  const [purchaseAmount, setPurchaseAmount] = useState(27200);
  const [declineReason, setDeclineReason] = useState<DeclineReason>('expensive');
  const [declineComment, setDeclineComment] = useState('');

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Initialize edit fields whenever appointment changes or modal opens
  useEffect(() => {
    if (appointment) {
      setEditStudentName(appointment.studentName || '');
      setEditParentName(appointment.parentName || '');
      setEditParentPhone(appointment.parentPhone || '');
      setEditGrade(appointment.grade || GRADES_LIST[4]);
      setEditSubject(appointment.subject || 'Математика');
      setEditTutorId(appointment.tutorId || '');
      setEditType(appointment.type || 'trial');
      setEditStatus(appointment.status || 'confirmed');
      setEditGoalCategory(appointment.learningGoalCategory || 'ege');
      setEditGoalText(appointment.studentGoal || '');
      const reqText = appointment.mopRequest?.requestText || appointment.notes || '';
      setEditNotes(reqText);
      setEditDate(appointment.date || '');
      setEditStartTime(appointment.startTime || '12:00');
      setEditEndTime(appointment.endTime || '13:00');
      setEditError(null);
      setIsEditing(false);
      setForceShowTrialSection(false);
      setSalesAction('none');
      if (appointment.trialResult?.outcome === 'purchased') {
        setSelectedPackage(appointment.trialResult.purchasedPackage || '16_lessons');
        setPurchaseAmount(appointment.trialResult.purchaseAmount || 27200);
      } else {
        setSelectedPackage('16_lessons');
        setPurchaseAmount(27200);
      }
      if (appointment.trialResult?.outcome === 'declined') {
        setDeclineReason(appointment.trialResult.declineReason || 'expensive');
        setDeclineComment(appointment.trialResult.declineComment || '');
      }
      setIsMarkingDone(false);
      setIsConfirmingDelete(false);
    }
  }, [appointment, isOpen]);

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

  // Handle Save Edited Appointment
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editStudentName.trim()) {
      setEditError('Пожалуйста, укажите имя ученика');
      return;
    }

    if (!editParentPhone.trim()) {
      setEditError('Пожалуйста, укажите номер телефона');
      return;
    }

    const selectedTutorObj = tutors.find(t => t.id === editTutorId) || {
      id: appointment.tutorId,
      name: appointment.tutorName
    };

    // Calculate end time if needed
    let finalEndTime = editEndTime;
    if (!finalEndTime || finalEndTime <= editStartTime) {
      const [sh, sm] = editStartTime.split(':').map(Number);
      finalEndTime = `${String(sh + 1).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}`;
    }

    const goalObj = GOAL_OPTIONS.find(g => g.id === editGoalCategory);
    const goalLabel = goalObj ? goalObj.label : 'Подготовка';

    const finalType: LessonType = role === 'manager' ? 'trial' : editType;

    const updated: Appointment = {
      ...appointment,
      studentName: editStudentName.trim(),
      parentName: editParentName.trim() || undefined,
      parentPhone: editParentPhone.trim(),
      grade: editGrade,
      subject: editSubject,
      tutorId: selectedTutorObj.id,
      tutorName: selectedTutorObj.name,
      type: finalType,
      status: editStatus,
      date: editDate,
      startTime: editStartTime,
      endTime: finalEndTime,
      studentGoal: editGoalText.trim() || goalLabel,
      learningGoalCategory: editGoalCategory,
      notes: editNotes.trim() || appointment.notes,
      mopRequest: {
        studentName: editStudentName.trim(),
        grade: editGrade,
        goal: editGoalText.trim() || goalLabel,
        requestText: editNotes.trim() || (appointment.mopRequest?.requestText || 'Стандартный запрос на вводный урок'),
      }
    };

    if (onUpdateAppointment) {
      onUpdateAppointment(updated);
    }
    setIsEditing(false);
  };

  const isTrial =
    appointment.type === 'trial' ||
    appointment.type === 'exam_prep' ||
    appointment.type === 'consultation' ||
    Boolean(appointment.trialResult) ||
    Boolean(appointment.quizContext) ||
    appointment.notes?.toLowerCase().includes('пробн') ||
    appointment.notes?.toLowerCase().includes('вводн') ||
    appointment.notes?.toLowerCase().includes('первый') ||
    appointment.notes?.toLowerCase().includes('[запрос моп]') ||
    appointment.notes?.toLowerCase().includes('диагностик') ||
    !appointment.type ||
    appointment.type !== 'regular' ||
    forceShowTrialSection;
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

          <div className="flex items-center space-x-2">
            {!isEditing && !isTutor && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                title="Редактировать данные урока"
              >
                <Edit3 size={13} className="text-indigo-600" />
                <span>Редактировать</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================= EDIT MODE FORM ================= */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                <Edit3 size={15} className="text-indigo-600" />
                <span>Редактирование данных урока</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Изменения сразу сохранятся в базе</span>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center space-x-2">
                <AlertCircle size={15} className="text-rose-500 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Student & Parent names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Имя ученика <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Имя родителя
                </label>
                <input
                  type="text"
                  value={editParentName}
                  onChange={e => setEditParentName(e.target.value)}
                  placeholder="Не указано"
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Phone & Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Телефон родителя <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editParentPhone}
                  onChange={e => setEditParentPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Класс
                </label>
                <select
                  value={editGrade}
                  onChange={e => setEditGrade(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {GRADES_LIST.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject & Tutor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Предмет
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Преподаватель
                </label>
                <select
                  value={editTutorId}
                  onChange={e => setEditTutorId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {tutors.length > 0 ? (
                    tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  ) : (
                    <option value={appointment.tutorId}>{appointment.tutorName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Тип урока
                </label>
                {role === 'manager' ? (
                  <div className="w-full text-xs font-semibold px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-950 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 font-bold">
                      <span>🔵</span>
                      <span>Вводный урок (0 ₽)</span>
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                      МОП: только пробные
                    </span>
                  </div>
                ) : (
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as LessonType)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="trial">🔵 Вводный урок (0 ₽)</option>
                    <option value="regular">🟣 Регулярный урок</option>
                    <option value="exam_prep">🎯 Подготовка к экзамену</option>
                    <option value="consultation">💬 Консультация</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Статус
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as LessonStatus)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="confirmed">Запланирован</option>
                  <option value="completed">✓ Проведён</option>
                  <option value="cancelled">Отменён / Неявка</option>
                  <option value="pending">Ожидает подтверждения</option>
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Время начала
                </label>
                <select
                  value={editStartTime}
                  onChange={e => setEditStartTime(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Время окончания
                </label>
                <select
                  value={editEndTime}
                  onChange={e => setEditEndTime(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Goal selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Target size={14} className="text-indigo-600" />
                <span>Цель обучения</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_OPTIONS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setEditGoalCategory(g.id);
                      if (!editGoalText || editGoalText.includes('Подготовка') || editGoalText.includes('Олимпиады')) {
                        setEditGoalText(g.label);
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 border ${
                      editGoalCategory === g.id
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / MOP Request */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Запрос ученика / примечание МОП:
              </label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Запрос ученика, слабые темы, пожелания..."
                rows={2}
                className="w-full text-xs font-medium p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Save size={14} />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================= VIEW MODE BODY ================= */
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Main Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {appointment.studentName}
                </h3>
                {appointment.parentName && (
                  <p className="text-xs text-slate-500 font-medium">
                    Родитель: <span className="text-slate-700 font-semibold">{appointment.parentName}</span>
                  </p>
                )}
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

              {!isTutor && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 p-1 rounded hover:bg-indigo-50 transition-colors"
                  title="Быстро отредактировать имя, телефон, предмет или класс"
                >
                  <Edit3 size={13} />
                  <span>Изменить</span>
                </button>
              )}
            </div>

            {/* MOP Request Card if present */}
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
                    <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                      <a
                        href={`https://t.me/+${appointment.parentPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 border-r border-slate-200 transition-colors"
                        title="Написать в Telegram"
                      >
                        Telegram
                      </a>
                      <a
                        href={`https://max.ru/u/${appointment.parentPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 transition-colors"
                        title="Написать в мессенджер MAX"
                      >
                        Max
                      </a>
                    </div>
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
                    <span>{copiedReminder ? 'Текст скопирован в буфер!' : 'Скопировать напоминание для ученика (Telegram / Max)'}</span>
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

            {/* Point 4: TRIAL SALES OUTCOME SECTION */}
            {isTrial ? (
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
                  </div>
                )}

                {/* Outcome selection buttons (Always available) */}
                {salesAction === 'none' && (
                  <div className="space-y-1.5">
                    {trialResult && (
                      <div className="text-[11px] font-semibold text-slate-500">
                        Изменить результат вводного урока:
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackage(trialResult?.purchasedPackage || '16_lessons');
                          const pkg = PACKAGES.find(p => p.id === (trialResult?.purchasedPackage || '16_lessons'));
                          setPurchaseAmount(trialResult?.purchaseAmount || pkg?.amount || 27200);
                          setSalesAction('buy');
                        }}
                        className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
                          trialResult?.outcome === 'purchased'
                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>{trialResult?.outcome === 'purchased' ? '✓ Купил' : 'Купил'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeclineReason(trialResult?.declineReason || 'expensive');
                          setDeclineComment(trialResult?.declineComment || '');
                          setSalesAction('decline');
                        }}
                        className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
                          trialResult?.outcome === 'declined'
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <XCircle size={13} />
                        <span>{trialResult?.outcome === 'declined' ? '✗ Отказ' : 'Отказ'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMarkThinking}
                        className={`py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
                          trialResult?.outcome === 'thinking'
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <Clock4 size={13} />
                        <span>{trialResult?.outcome === 'thinking' ? '⏳ Думает' : 'Думает'}</span>
                      </button>
                    </div>
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
                              if (pkg.amount > 0) setPurchaseAmount(pkg.amount);
                            }}
                            className={`p-2 rounded-lg text-left border transition-all text-xs ${
                              selectedPackage === pkg.id
                                ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                                : 'bg-white text-slate-800 border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            <div>{pkg.label}</div>
                            {pkg.amount > 0 && (
                              <div className={`text-[10px] ${selectedPackage === pkg.id ? 'text-emerald-100' : 'text-emerald-700 font-bold'}`}>
                                {pkg.amount.toLocaleString('ru-RU')} ₽
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Сумма оплаты (₽):
                      </label>
                      <input
                        type="number"
                        value={purchaseAmount}
                        disabled={selectedPackage !== 'custom'}
                        onChange={e => setPurchaseAmount(Number(e.target.value))}
                        className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 border ${
                          selectedPackage !== 'custom'
                            ? 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'bg-white border-emerald-300 text-emerald-900'
                        }`}
                        step={100}
                      />
                      {selectedPackage !== 'custom' ? (
                        <p className="text-[10px] text-emerald-700 mt-1">
                          Фиксированная сумма тарифа. Для свободной суммы выберите «Индивидуальный тариф».
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-700 mt-1">
                          Введите произвольную согласованную сумму оплаты.
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleConfirmPurchase}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Зафиксировать продажу</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-form: DECLINE */}
                {salesAction === 'decline' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-950 flex items-center space-x-1.5">
                        <XCircle size={15} className="text-rose-600" />
                        <span>Причина отказа</span>
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
                        Выберите главную причину:
                      </label>
                      <div className="space-y-1">
                        {DECLINE_REASONS.map(r => (
                          <label
                            key={r.id}
                            className={`flex items-center space-x-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                              declineReason === r.id
                                ? 'bg-rose-100 border-rose-300 font-bold text-rose-950'
                                : 'bg-white border-rose-100 hover:bg-rose-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="declineReason"
                              checked={declineReason === r.id}
                              onChange={() => setDeclineReason(r.id)}
                              className="text-rose-600"
                            />
                            <span>{r.label}</span>
                          </label>
                        ))}
                      </div>
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
                        <span>Зафиксировать отказ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setForceShowTrialSection(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 underline flex items-center space-x-1"
                >
                  <DollarSign size={12} />
                  <span>Зафиксировать результат вводного урока (Купил / Отказ / Думает)</span>
                </button>
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
        )}
      </div>
    </div>
  );
}
