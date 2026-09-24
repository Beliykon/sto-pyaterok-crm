import React, { useState } from 'react';
import { Appointment, LessonHomework, HomeworkStatus } from '../lib/types';
import { 
  X, 
  BookOpen, 
  Send, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface HomeworkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSaveHomework: (appointmentId: string, homework: LessonHomework) => void;
}

const TEMPLATES_BY_SUBJECT: Record<string, string[]> = {
  'Математика (профиль)': [
    '№1-12 Первая часть профиля (прототипы ФИПИ, тест на 20 мин)',
    '№13 Тригонометрические уравнения с отбором корней на единичной окружности (4 шт)',
    '№14 Стереометрия: построение сечений и угол между плоскостями',
    '№15 Неравенства: логарифмические и показательные (метод рационализации)',
    '№18 Параметры: графический метод (плоскость x; a)',
  ],
  'Русский язык': [
    'Тестовая часть №1-8: орфоэпия, паронимы и грамматические нормы',
    'Сочинение №27 по прочитанному тексту: формулировка проблемы и позиция автора',
    'Пунктуация в сложном предложении (задания №16-21)',
    'Работа над ошибками в итоговом сочинении',
  ],
  'Английский язык': [
    'Speaking Part 3-4: аудиозапись ответа на 2 минуты в Telegram',
    'Use of English: Word Formation & Phrasal Verbs (30 упражнений)',
    'Writing an Email (100-120 words) according to exam criteria',
    'Reading Comprehension: Multiple Choice task 12-18',
  ],
  'Обществознание': [
    'Блок «Экономика»: тест из 16 заданий + разбор понятий',
    'Задание №25: обоснование и примеры из современной российской действительности',
    'План по теме «Политические партии и избирательные системы» (№24)',
  ],
  'Физика': [
    'Кинематика и законы Ньютона: 5 расчетных задач 2-й части',
    'Термодинамика: работа газа в циклических процессах (№24-25)',
    'Электродинамика и закон Ома для полной цепи',
  ],
};

const DEFAULT_TEMPLATES = [
  'Тест самодиагностики по пройденной теме (15 мин)',
  'Конспект формул и разбор 3 типовых задач',
  'Работа над ошибками прошлого занятия в тетради',
  'Изучение параграфа и составление интеллект-карты',
];

export default function HomeworkManagerModal({
  isOpen,
  onClose,
  appointment,
  onSaveHomework,
}: HomeworkManagerModalProps) {
  if (!isOpen || !appointment) return null;

  const existingHw = appointment.homework;

  const [title, setTitle] = useState(existingHw?.title || '');
  const [deadline, setDeadline] = useState(existingHw?.deadline || 'к следующему уроку');
  const [status, setStatus] = useState<HomeworkStatus>(existingHw?.status || 'assigned');
  const [link, setLink] = useState(existingHw?.link || '');
  const [notes, setNotes] = useState(existingHw?.notes || '');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const subjectTemplates = TEMPLATES_BY_SUBJECT[appointment.subject] || DEFAULT_TEMPLATES;

  const cleanPhone = appointment.parentPhone.replace(/[^0-9]/g, '');

  const generateMessageText = () => {
    let msg = `Здравствуйте! Напоминание по домашнему заданию для ученика ${appointment.studentName} (${appointment.subject}):\n\n`;
    msg += `📌 Задание: ${title || 'Уточняется'}\n`;
    if (deadline) msg += `⏰ Срок сдачи: ${deadline}\n`;
    if (link) msg += `🔗 Ссылка на материалы/тест: ${link}\n`;
    if (notes) msg += `💡 Примечание: ${notes}\n`;
    msg += `\nПри возникновении вопросов ученик всегда может написать в чат. Успехов в подготовке! 🚀`;
    return msg;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMessageText());
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleOpenTelegram = () => {
    const text = encodeURIComponent(generateMessageText());
    const url = `https://t.me/+${cleanPhone}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleOpenMax = () => {
    handleCopyText();
    const url = `https://max.ru/u/${cleanPhone}`;
    window.open(url, '_blank');
  };

  const handleSave = () => {
    const hw: LessonHomework = {
      title: title.trim() || 'Домашнее задание',
      deadline,
      status,
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    onSaveHomework(appointment.id, hw);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="homework-manager-modal"
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Домашнее задание • {appointment.studentName}
              </h2>
              <p className="text-xs text-slate-500">
                {appointment.subject} • {appointment.grade}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Subject Templates */}
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles size={14} className="text-amber-500" />
              <span>Готовые шаблоны по предмету:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subjectTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Название / содержание задания
            </label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={2}
              placeholder="Введите задание или выберите из шаблонов выше..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Срок сдачи (дедлайн)
              </label>
              <input
                type="text"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                placeholder="к следующему уроку / до пятницы 18:00"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Статус сдачи учеником
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as HomeworkStatus)}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="assigned">⚪ Задано (в процессе)</option>
                <option value="submitted">🟢 Сдано на проверку</option>
                <option value="late">🟡 Задерживает сдачу</option>
                <option value="missing">🔴 Не сдано / Долг</option>
                <option value="none">Без ДЗ</option>
              </select>
            </div>
          </div>

          {/* Link to assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ссылка на тест или материалы (необязательно)
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://math-ege.sdamgia.ru/..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Заметка к ДЗ
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Прислать решение фото в чат..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          {/* Instant Share Bar */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                <MessageSquare size={14} className="text-emerald-600" />
                <span>Отправка ученику / родителю:</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {appointment.parentPhone}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenTelegram}
                className="flex-1 py-2 px-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                title="Отправить в Telegram"
              >
                <Send size={13} />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMax}
                className="flex-1 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                title="Открыть в MAX"
              >
                <Send size={13} />
                <span>MAX</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 flex items-center space-x-1 transition-colors"
              >
                {copiedNotice ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedNotice ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Check size={14} />
            <span>Сохранить задание</span>
          </button>
        </div>
      </div>
    </div>
  );
}
