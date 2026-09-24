import React, { useState } from 'react';
import { Tutor, Appointment, LessonType, LeadQuizContext, LeadOffer, UserRole } from '../lib/types';
import { X, User, Phone, BookOpen, Clock, Calendar as CalendarIcon, Sparkles, CheckCircle2, AlertCircle, HelpCircle, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { extractRussianPhoneDigits, formatRussianPhone } from '../lib/phoneUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: Tutor[];
  selectedTutorId?: string;
  initialDate?: string;
  initialTime?: string;
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  existingAppointments: Appointment[];
  role?: UserRole;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const GRADES = [
  '11 класс (ЕГЭ Профиль)',
  '11 класс (ЕГЭ База)',
  '10 класс (Подготовка к ЕГЭ)',
  '9 класс (ОГЭ на максимум)',
  '8 класс (Повышение успеваемости)',
  '7 класс',
  '5-6 класс (Начальная школа/База)',
];

export default function BookingModal({
  isOpen,
  onClose,
  tutors,
  selectedTutorId,
  initialDate,
  initialTime,
  onSave,
  existingAppointments,
  role = 'manager',
}: BookingModalProps) {
  const [tutorId, setTutorId] = useState(selectedTutorId || tutors[0]?.id || '');
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhoneDigits, setParentPhoneDigits] = useState('');
  const [grade, setGrade] = useState(GRADES[0]);
  const [subject, setSubject] = useState(tutors[0]?.subjects[0] || 'Математика (профиль)');
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialTime || '14:00');
  const [type, setType] = useState<LessonType>('trial');
  const [notes, setNotes] = useState('');
  const [managerName, setManagerName] = useState('Анна Ковалёва (Отдел продаж)');

  // Sto-Pyaterok Quiz & Special Offer context
  const [primaryOffer, setPrimaryOffer] = useState<LeadOffer>('grant30');
  const [currentGradeScore, setCurrentGradeScore] = useState('Тройка, пробелы по темам');
  const [targetScore, setTargetScore] = useState('Сдать на 5 / высокий балл');
  const [gradeCategory, setGradeCategory] = useState<'1-4' | '5-7' | '8-9' | '10-11'>('8-9');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTutor = tutors.find(t => t.id === tutorId) || tutors[0];

  // Calculate end time (default 1 hour)
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = String(hours + 1).padStart(2, '0');
  const endTime = `${endHour}:${String(minutes).padStart(2, '0')}`;

  // Conflict detection
  const isConflict = existingAppointments.some(
    app => app.tutorId === tutorId && app.date === date && app.startTime === startTime && app.status !== 'cancelled'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate past time
    const [startH, startM] = startTime.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    const chosenDateTime = new Date(year, month - 1, day, startH, startM, 0, 0);
    const now = new Date();
    if (chosenDateTime.getTime() < now.getTime()) {
      setValidationError('Невозможно записать, т.к. время уже прошло');
      return;
    }

    if (isConflict) {
      setValidationError('Слот уже занят');
      return;
    }

    let learningGoalCategory: 'ege' | 'oge' | 'olympiad' | 'grades' = 'ege';
    const textToCheck = `${grade} ${targetScore} ${notes}`.toLowerCase();
    if (textToCheck.includes('олимпиад') || textToCheck.includes('всерос') || textToCheck.includes('высшая проба')) {
      learningGoalCategory = 'olympiad';
    } else if (textToCheck.includes('огэ') || grade.includes('9 класс')) {
      learningGoalCategory = 'oge';
    } else if (textToCheck.includes('успеваемост') || textToCheck.includes('пробел') || textToCheck.includes('база') || grade.includes('5-6') || grade.includes('7 класс') || grade.includes('8 класс')) {
      learningGoalCategory = 'grades';
    } else {
      learningGoalCategory = 'ege';
    }

    onSave({
      tutorId,
      tutorName: currentTutor?.name || '',
      studentName: studentName.trim(),
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim(),
      grade,
      subject,
      date,
      startTime,
      endTime,
      type: role === 'manager' ? 'trial' : type,
      status: 'confirmed',
      confirmationStatus: 'unconfirmed',
      dealValue: primaryOffer === 'matkapital' ? 76800 : 38400,
      notes: notes.trim() || undefined,
      meetingUrl: `https://telemost.yandex.ru/j/100-${currentTutor?.color || 'room'}`,
      managerName,
      learningGoalCategory,
      studentGoal: targetScore,
      quizContext: {
        gradeCategory,
        targetScore,
        currentGradeScore,
        primaryOffer,
        leadSource: 'Квиз-диагностика на sto-pyaterok.ru',
      },
    });
    onClose();
  };

  const handleTutorChange = (newTutorId: string) => {
    setTutorId(newTutorId);
    const tut = tutors.find(t => t.id === newTutorId);
    if (tut && tut.subjects.length > 0) {
      setSubject(tut.subjects[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Запись ученика на занятие</h3>
              <p className="text-xs text-slate-500">Отдел продаж • Мгновенная синхронизация с преподавателем</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Тип занятия */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Тип занятия
            </label>
            {role === 'manager' ? (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <span className="font-bold">Бесплатный пробный урок (0 ₽)</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  МОП — запись только на пробные
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'trial', label: 'Бесплатный пробный (0₽)', badge: 'Лид из заявки' },
                  { id: 'regular', label: 'Регулярное занятие', badge: 'Абонемент' },
                  { id: 'exam_prep', label: 'Интенсив ЕГЭ/ОГЭ', badge: 'Спецкурс' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setType(item.id as LessonType)}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      type === item.id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold leading-snug">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.badge}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Преподаватель и предмет */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Преподаватель (Smart Match)
                </label>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Рейтинг конверсий 🔥
                </span>
              </div>
              <select
                value={tutorId}
                onChange={e => handleTutorChange(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {[...tutors].sort((a, b) => (b.salesConversionRate || 0) - (a.salesConversionRate || 0)).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.shortName} • Конверсия {t.salesConversionRate}% {t.tag ? `(${t.tag})` : ''}
                  </option>
                ))}
              </select>

              {currentTutor && (
                <div className="mt-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center space-x-1.5 text-[11px] text-emerald-800">
                  <Sparkles size={13} className="text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>{currentTutor.shortName}</strong>: конверсия в оплату <strong>{currentTutor.salesConversionRate}%</strong>.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Предмет
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {currentTutor?.subjects.map(subj => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
                <option value="Математика (профиль)">Математика (профиль)</option>
                <option value="Русский язык">Русский язык</option>
                <option value="Обществознание">Обществознание</option>
                <option value="Английский язык">Английский язык</option>
                <option value="Физика">Физика</option>
                <option value="Химия">Химия</option>
              </select>

              <div className="mt-1.5 text-[11px] text-slate-500">
                Средний чек пакета: <strong className="text-slate-800">38 400 ₽</strong> (16 занятий)
              </div>
            </div>
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Дата занятия
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  min="2025-01-01"
                  max="2028-12-31"
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Время начала (60 мин)
              </label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {TIME_SLOTS.map(time => (
                  <option key={time} value={time}>
                    {time} – {String(Number(time.split(':')[0]) + 1).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Индикатор доступности преподавателя */}
          {isConflict ? (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
              <span>
                Внимание: у {currentTutor?.shortName} уже стоит занятие на {startTime} ({date}). Выберите другое время или преподавателя.
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>Слот свободен! Преподаватель получит моментальное уведомление.</span>
            </div>
          )}

          {/* Данные ученика и родителя */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Данные клиента
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Имя ученика *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Артём Соколов"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Телефон родителя/ученика *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+7 (999) 123-45-67"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Класс / Цель обучения</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Имя родителя (контакт)</label>
                <input
                  type="text"
                  placeholder="Ольга Сергеевна (мама)"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Диагностика из квиза сайта & Спецпредложение (Грант 30% / Маткапитал) */}
          <div className="p-4 bg-gradient-to-br from-amber-50/70 via-indigo-50/40 to-slate-50 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                  🎯
                </span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Контекст заявки из квиза «Сто-пятёрок»
                </h4>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                Видно репетитору перед уроком
              </span>
            </div>

            {/* Акция / Оффер сайта */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                По какому офферу пришел родитель:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'grant30', label: '🎁 Грант 30%', desc: 'Оплата школы 30%' },
                  { id: 'matkapital', label: '🏛️ Маткапитал', desc: 'Длинный абонемент' },
                  { id: 'trial_free', label: '⚡ Пробный 0₽', desc: 'Тест за 3 мин' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPrimaryOffer(item.id as LeadOffer)}
                    className={`p-2 text-left rounded-lg border text-xs transition-all ${
                      primaryOffer === item.id
                        ? 'bg-white border-amber-500 font-bold text-slate-900 shadow-xs ring-1 ring-amber-400'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2 вопроса из квиза: текущий уровень и цель */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Текущие оценки / Проблема:
                </label>
                <select
                  value={currentGradeScore}
                  onChange={e => setCurrentGradeScore(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Тройка, пробелы по темам">Тройка, пробелы по темам</option>
                  <option value="Четвёрка, нужна уверенность">Четвёрка, нужна уверенность</option>
                  <option value="Двойки, срочно спасать четверть">Двойки, срочно спасать четверть</option>
                  <option value="Отличник, подготовка к олимпиадам/ЕГЭ 90+">Отличник, подготовка к олимпиадам/ЕГЭ 90+</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Главная цель к пробному уроку:
                </label>
                <select
                  value={targetScore}
                  onChange={e => setTargetScore(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Олимпиады (Всерос, Перечневые, диплом)">Олимпиады (Всерос, Перечневые, диплом)</option>
                  <option value="ЕГЭ 80+ для бюджета">ЕГЭ 80+ для бюджета</option>
                  <option value="ОГЭ на максимум (от 28 баллов)">ОГЭ на максимум (от 28 баллов)</option>
                  <option value="Сдать на 5 / высокий балл">Сдать на 5 / высокий балл</option>
                  <option value="Закрыть пробелы и полюбить предмет">Закрыть пробелы и полюбить предмет</option>
                </select>
              </div>
            </div>
          </div>

          {/* Комментарий для репетитора */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Заметки менеджера для репетитора
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Например: Цель — 80+ баллов на ЕГЭ, пробелы в тригонометрии, ребенок стеснительный, мама на связи в мессенджере."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Ответственный менеджер */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Ответственный менеджер:</span>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-b border-dashed border-slate-300 outline-none text-right"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isConflict || !studentName.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center space-x-2"
            >
              <span>Записать и уведомить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
