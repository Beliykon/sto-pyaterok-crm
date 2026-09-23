import React, { useState, useEffect } from 'react';
import { Tutor, Appointment, LessonType, LearningGoal } from '../lib/types';
import { X, Calendar, Clock, User, Phone, BookOpen, Check, Sparkles, Target, GraduationCap, MessageSquareText } from 'lucide-react';

interface FastBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => void;
  tutors: Tutor[];
  prefillTutorId?: string;
  prefillDate?: string;
  prefillTime?: string;
}

const HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const GRADES = [
  '1–4 класс (Начальная школа)',
  '5–8 класс (Средняя школа)',
  '9 класс (ОГЭ)',
  '10 класс (Профиль)',
  '11 класс (ЕГЭ)'
];

const GOALS: { id: LearningGoal; label: string; icon: string }[] = [
  { id: 'ege', label: 'Подготовка к ЕГЭ', icon: '🎯' },
  { id: 'oge', label: 'Подготовка к ОГЭ', icon: '📘' },
  { id: 'olympiad', label: 'Олимпиады (Всерос/ВШЭ)', icon: '🏆' },
  { id: 'grades', label: 'Повышение успеваемости (4-5)', icon: '📈' },
  { id: 'admission', label: 'Поступление в лицей/вуз', icon: '🏫' },
];

const QUICK_TAGS = [
  'Слабая геометрия',
  'Плавает в тригонометрии',
  'Хочет 80+ баллов на ЕГЭ',
  'Страх перед экзаменом',
  'Пробелы по школьной программе',
  'Нужен строгий преподаватель',
  'Олимпиадный уровень',
  'Подготовка к сочинению',
];

export default function FastBookingModal({
  isOpen,
  onClose,
  onBook,
  tutors,
  prefillTutorId,
  prefillDate,
  prefillTime,
}: FastBookingModalProps) {
  const [tutorId, setTutorId] = useState(prefillTutorId || tutors[0]?.id || '');
  const [date, setDate] = useState(prefillDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(prefillTime || '11:00');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState(GRADES[4]);
  const [subject, setSubject] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [lessonType, setLessonType] = useState<LessonType>('trial');
  
  // Specific MOP fields (Point 2 of user request)
  const [goal, setGoal] = useState<LearningGoal>('ege');
  const [clientRequest, setClientRequest] = useState('');

  // Update on prefill changes
  useEffect(() => {
    if (prefillTutorId) setTutorId(prefillTutorId);
    if (prefillDate) setDate(prefillDate);
    if (prefillTime) setTime(prefillTime);
  }, [prefillTutorId, prefillDate, prefillTime, isOpen]);

  const selectedTutor = tutors.find(t => t.id === tutorId) || tutors[0];

  useEffect(() => {
    if (selectedTutor && (!subject || !selectedTutor.subjects.includes(subject))) {
      setSubject(selectedTutor.subjects[0] || 'Математика');
    }
  }, [selectedTutor]);

  // Sync grade with goal automatically if appropriate
  useEffect(() => {
    if (grade.includes('11 класс') || grade.includes('10 класс')) {
      if (goal === 'oge') setGoal('ege');
    } else if (grade.includes('9 класс')) {
      if (goal === 'ege') setGoal('oge');
    }
  }, [grade]);

  if (!isOpen) return null;

  const handleAddQuickTag = (tag: string) => {
    if (!clientRequest.includes(tag)) {
      setClientRequest(prev => prev ? `${prev}, ${tag}` : tag);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim() || !selectedTutor) return;

    // Calculate end time (+1 hour)
    const [h, m] = time.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    const endTime = `${endH}:${String(m).padStart(2, '0')}`;

    const goalObj = GOALS.find(g => g.id === goal);
    const goalLabel = goalObj ? goalObj.label : 'Подготовка';

    // Structured MOP note as requested in Point 2: "моп в примечании пишет имя , класс и запрос"
    const formattedMopNote = `[Запрос МОП] Имя: ${studentName.trim()} | Класс: ${grade} | Цель: ${goalLabel} | Запрос: ${clientRequest.trim() || 'Комплексная диагностика уровня и разбор тем'}`;

    onBook({
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      studentName: studentName.trim(),
      parentPhone: parentPhone.trim(),
      parentName: parentName.trim() || undefined,
      grade,
      subject: subject || selectedTutor.subjects[0] || 'Общий',
      date,
      startTime: time,
      endTime,
      type: lessonType,
      notes: formattedMopNote,
      managerName: 'Отдел продаж',
      confirmationStatus: 'unconfirmed',
      studentGoal: `${goalLabel}: ${clientRequest.trim() || 'Диагностика уровня знаний'}`,
      learningGoalCategory: goal,
      mopRequest: {
        studentName: studentName.trim(),
        grade,
        goal: goalLabel,
        requestText: clientRequest.trim() || 'Стандартный запрос на вводный урок',
      },
    });

    // Reset form
    setStudentName('');
    setParentPhone('');
    setParentName('');
    setClientRequest('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Запись на пробное занятие (МОП)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                Отдел продаж
              </span>
            </h3>
            <p className="text-xs text-slate-500">Зафиксируйте контакт, класс и запрос ученика для преподавателя</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tutor, Date & Time block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            {/* Tutor select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Преподаватель
              </label>
              <select
                value={tutorId}
                onChange={e => setTutorId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {tutors.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Дата
              </label>
              <input
                type="date"
                value={date}
                min="2025-01-01"
                max="2028-12-31"
                onChange={e => setDate(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            {/* Time select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Время старта
              </label>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lesson Type selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Тип занятия
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLessonType('trial')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition-colors ${
                  lessonType === 'trial'
                    ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>🔵 Вводный / Пробный (0 ₽)</span>
              </button>

              <button
                type="button"
                onClick={() => setLessonType('regular')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition-colors ${
                  lessonType === 'regular'
                    ? 'bg-purple-50 border-purple-300 text-purple-800 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>🟣 Регулярный урок</span>
              </button>
            </div>
          </div>

          {/* Key MOP Section: Student Name & Phone */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-950">
              <User size={15} className="text-indigo-600" />
              <span>Данные ученика и родителя (заполняет МОП)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Имя ученика <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Например: Иван Смирнов"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Телефон родителя <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={e => setParentPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* 2. Grade and Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Класс обучения <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {GRADES.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Предмет
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  {selectedTutor.subjects.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Goal Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Target size={14} className="text-indigo-600" />
                <span>3. Цель обучения (ОГЭ, ЕГЭ, Олимпиады)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                      goal === g.id
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Client Request / Detailed MOP notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <MessageSquareText size={14} className="text-indigo-600" />
                <span>4. Запрос ученика / примечание МОП</span>
              </label>
              <textarea
                value={clientRequest}
                onChange={e => setClientRequest(e.target.value)}
                placeholder="Например: Слабая геометрия, во 2 части страх перед задачами 23-24, хочет 85+ баллов, нужен требовательный преподаватель"
                rows={2}
                className="w-full text-xs font-medium p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />

              {/* Quick tags clickers */}
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Быстрые подсказки:</span>
                {QUICK_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddQuickTag(tag)}
                    className="text-[10px] font-medium bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview of MOP Note */}
            <div className="p-2.5 bg-white rounded-lg border border-indigo-200/80 text-[11px] text-slate-700">
              <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider block mb-0.5">
                Итоговое примечание в карточке урока:
              </span>
              <p className="italic text-slate-800 font-medium">
                [Запрос МОП] Имя: <strong>{studentName || '—'}</strong> | Класс: <strong>{grade}</strong> | Цель: <strong>{GOALS.find(g => g.id === goal)?.label}</strong> | Запрос: «{clientRequest || 'Комплексная диагностика уровня'}»
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Check size={14} />
              <span>Записать на пробное</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
