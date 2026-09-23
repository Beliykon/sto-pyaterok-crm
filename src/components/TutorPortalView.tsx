import React, { useState } from 'react';
import { Tutor, Appointment, PostLessonFeedback, LessonHomework, HomeworkStatus } from '../lib/types';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  Plus, 
  Check, 
  BookOpen, 
  Flame,
  Coffee,
  BatteryCharging,
  ShieldAlert,
  Edit3,
  Layers,
  Send,
  AlertCircle,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import PostLessonFeedbackModal from './PostLessonFeedbackModal';
import LessonHudModal from './LessonHudModal';
import HomeworkManagerModal from './HomeworkManagerModal';

interface TutorPortalViewProps {
  tutor: Tutor;
  appointments: Appointment[];
  weekDays: Date[];
  onAddAvailabilitySlot: (tutorId: string, day: string, time: string) => void;
  onSubmitFeedback: (appointmentId: string, feedback: PostLessonFeedback) => void;
  onSaveLessonContext?: (appointmentId: string, notes: string, goal: string, whiteboardUrl: string) => void;
  onSaveHomework?: (appointmentId: string, homework: LessonHomework) => void;
  onUpdateTutorSettings?: (tutorId: string, settings: Partial<Tutor>) => void;
}

const AVAILABLE_TIMES = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export default function TutorPortalView({
  tutor,
  appointments,
  weekDays,
  onAddAvailabilitySlot,
  onSubmitFeedback,
  onSaveLessonContext,
  onSaveHomework,
  onUpdateTutorSettings,
}: TutorPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'homework' | 'availability' | 'students'>('schedule');
  const [selectedSlotDay, setSelectedSlotDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlotTime, setSelectedSlotTime] = useState('18:00');
  const [slotAddedNotice, setSlotAddedNotice] = useState(false);

  // Modals state
  const [selectedFeedbackApp, setSelectedFeedbackApp] = useState<Appointment | null>(null);
  const [selectedHudApp, setSelectedHudApp] = useState<Appointment | null>(null);
  const [selectedHomeworkApp, setSelectedHomeworkApp] = useState<Appointment | null>(null);

  // Homework tab filter
  const [hwFilter, setHwFilter] = useState<'all' | 'pending' | 'late' | 'submitted'>('all');

  // Tutor's appointments
  const tutorAppointments = appointments.filter(
    a => a.tutorId === tutor.id && a.status !== 'cancelled'
  );

  // Today's appointments
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = tutorAppointments
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Next upcoming lesson
  const nextLesson = todayAppointments[0] || tutorAppointments[0];

  // Ergonomics & Energy Cap calculations
  const maxLessons = tutor.maxDailyLessons || 5;
  const breakMinutes = tutor.preferredBreakMinutes !== undefined ? tutor.preferredBreakMinutes : 10;
  const todayCount = todayAppointments.length;
  const energyPercent = Math.min(100, Math.round((todayCount / maxLessons) * 100));

  const isOverloaded = todayCount > maxLessons;
  const isBusy = todayCount === maxLessons;

  const handleAddSlot = () => {
    onAddAvailabilitySlot(tutor.id, selectedSlotDay, selectedSlotTime);
    setSlotAddedNotice(true);
    setTimeout(() => setSlotAddedNotice(false), 3000);
  };

  const handleBreakChange = (mins: number) => {
    onUpdateTutorSettings?.(tutor.id, { preferredBreakMinutes: mins });
  };

  const handleToggleFreeze = () => {
    onUpdateTutorSettings?.(tutor.id, { isPausedToday: !tutor.isPausedToday });
  };

  // Filtered appointments for homework tab
  const homeworkList = tutorAppointments.filter(app => {
    if (hwFilter === 'all') return true;
    if (hwFilter === 'submitted') return app.homework?.status === 'submitted';
    if (hwFilter === 'late') return app.homework?.status === 'late' || app.homework?.status === 'missing';
    if (hwFilter === 'pending') return app.homework?.status === 'assigned';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tutor Profile & Burnout Protection Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="flex items-center space-x-4">
          <img
            src={tutor.avatar}
            alt={tutor.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/40 shadow-md flex-shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-xl font-bold">{tutor.name}</h2>
              {tutor.isPausedToday ? (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                  <PauseCircle size={12} />
                  <span>Слоты заморожены (Отдых)</span>
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>На связи</span>
                </span>
              )}
              {tutor.tag && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                  {tutor.tag}
                </span>
              )}
            </div>
            <p className="text-indigo-200 text-xs mt-1">
              {tutor.subjects.join(' • ')} • Конверсия: {tutor.salesConversionRate}% • Рейтинг: ★ {tutor.rating}
            </p>
          </div>
        </div>

        {/* Ergonomics Widget: Energy Cap + Smart Break Selector */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 w-full lg:w-auto">
          {/* Energy Cap */}
          <div className="min-w-[140px] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-indigo-200">
              <span className="flex items-center space-x-1">
                <BatteryCharging size={13} className="text-emerald-400" />
                <span>Энергия дня:</span>
              </span>
              <strong className="text-white font-mono">{todayCount} / {maxLessons}</strong>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isOverloaded ? 'bg-rose-500' : isBusy ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${energyPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-300">
              {isOverloaded ? (
                <span className="text-rose-300 font-bold flex items-center space-x-0.5">
                  <ShieldAlert size={10} />
                  <span>Превышен лимит!</span>
                </span>
              ) : isBusy ? (
                <span className="text-amber-300 font-medium">Плотная нагрузка</span>
              ) : (
                <span className="text-emerald-300 font-medium">Оптимальный темп</span>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/20"></div>

          {/* Smart Break Selector */}
          <div className="space-y-1">
            <div className="text-[11px] text-indigo-200 flex items-center space-x-1">
              <Coffee size={12} className="text-amber-300" />
              <span>Буфер между уроками:</span>
            </div>
            <div className="flex items-center space-x-1 bg-black/20 p-0.5 rounded-lg border border-white/10">
              {[0, 10, 15].map(m => (
                <button
                  key={m}
                  onClick={() => handleBreakChange(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    breakMinutes === m
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={m === 0 ? 'Без перерыва' : `${m} минут отдыха между занятиями`}
                >
                  {m === 0 ? '0 мин' : `${m} мин ☕`}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/20"></div>

          {/* Emergency Pause / Freeze Button */}
          <button
            onClick={handleToggleFreeze}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              tutor.isPausedToday
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
            }`}
            title="Заморозить оставшиеся свободные слоты на сегодня для отдыха"
          >
            {tutor.isPausedToday ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
            <span>{tutor.isPausedToday ? 'Снять паузу' : 'Взять паузу'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'schedule', label: '📅 Моё расписание' },
          { id: 'homework', label: '📚 Домашки и успеваемость' },
          { id: 'availability', label: '⏰ Открыть свободные окна' },
          { id: 'students', label: '👥 Мои ученики' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Schedule */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Next Lesson Spotlight with 1-Click HUD Button */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1">
                  <Layers size={14} />
                  <span>Ближайший урок</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {nextLesson ? (nextLesson.date === todayStr ? 'Сегодня' : nextLesson.date) : 'Нет'}
                </span>
              </div>

              {nextLesson ? (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{nextLesson.studentName}</h3>
                    <p className="text-xs text-slate-500">{nextLesson.grade}</p>
                    <div className="text-sm font-bold text-indigo-600 mt-1 flex items-center space-x-1.5">
                      <Clock size={15} />
                      <span>{nextLesson.startTime} – {nextLesson.endTime}</span>
                      {breakMinutes > 0 && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                          +{breakMinutes}м перерыв ☕
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Big Spotlight Button: Launch Lesson HUD */}
                  <button
                    onClick={() => setSelectedHudApp(nextLesson)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900 text-white font-black rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-200 transition-all text-xs group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      🎯
                    </div>
                    <span>Запустить панель урока (Боевой режим)</span>
                  </button>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Предмет:</span>
                      <strong className="text-slate-800">{nextLesson.subject}</strong>
                    </div>

                    {nextLesson.studentGoal && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Цель ученика:</span>
                        <strong className="text-indigo-700 font-semibold text-[11px]">{nextLesson.studentGoal}</strong>
                      </div>
                    )}

                    {nextLesson.tutorNotes && (
                      <div className="pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500 text-[11px] block">На чём остановились:</span>
                        <span className="text-slate-700 text-[11px] italic">«{nextLesson.tutorNotes}»</span>
                      </div>
                    )}

                    {/* Homework widget preview */}
                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-slate-500 text-[11px]">ДЗ к уроку:</span>
                      <button
                        onClick={() => setSelectedHomeworkApp(nextLesson)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center space-x-1"
                      >
                        <span>
                          {nextLesson.homework 
                            ? (nextLesson.homework.status === 'submitted' ? '🟢 Сдано' : '⚪ Задано')
                            : '+ Назначить'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {nextLesson.meetingUrl && (
                    <a
                      href={nextLesson.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-xl flex items-center justify-center space-x-2 border border-indigo-200 transition-all text-xs"
                    >
                      <Video size={15} />
                      <span>Войти в виртуальный класс (Телемост)</span>
                    </a>
                  )}

                  {/* Express Post-Lesson Feedback for Sales */}
                  {nextLesson.postLessonFeedback ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                      <div className="font-bold flex items-center space-x-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Рекомендация передана в отдел продаж:</span>
                      </div>
                      <div className="mt-0.5 font-semibold text-[11px]">{nextLesson.postLessonFeedback.recommendation}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedFeedbackApp(nextLesson)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all text-xs"
                    >
                      <Flame size={15} />
                      <span>Экспресс-отчёт для продаж (15 сек)</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  На сегодня уроков больше нет
                </div>
              )}
            </div>
          </div>

          {/* Full Week Schedule List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Все занятия на эту неделю ({tutorAppointments.length})
                </h3>
                {breakMinutes > 0 && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium flex items-center space-x-1">
                    <Coffee size={12} />
                    <span>Буфер между уроками: {breakMinutes} мин</span>
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {tutorAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Пока нет назначенных занятий на эту неделю
                  </div>
                ) : (
                  tutorAppointments.map(app => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-700 flex-shrink-0">
                          <span className="text-[10px] font-bold uppercase">{app.date.slice(8)}</span>
                          <span className="text-[9px] font-semibold">{app.startTime}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-slate-900">{app.studentName}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              app.type === 'trial' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {app.type === 'trial' ? 'Пробный' : 'Урок'}
                            </span>
                            {app.homework && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                app.homework.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' :
                                app.homework.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                ДЗ: {app.homework.status === 'submitted' ? 'Сдано 🟢' : 'Задано'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{app.grade} • {app.subject}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        {/* HUD quick button */}
                        <button
                          onClick={() => setSelectedHudApp(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-950 text-white font-bold hover:bg-indigo-900 transition-colors flex items-center space-x-1 text-[11px]"
                          title="Открыть панель подготовки к уроку"
                        >
                          <span>🎯 Панель</span>
                        </button>

                        {/* Homework quick button */}
                        <button
                          onClick={() => setSelectedHomeworkApp(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center space-x-1 text-[11px]"
                          title="Управление домашним заданием"
                        >
                          <BookOpen size={12} />
                          <span>ДЗ</span>
                        </button>

                        {app.meetingUrl && (
                          <a
                            href={app.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-100 transition-colors flex items-center space-x-1 text-[11px]"
                          >
                            <Video size={12} />
                            <span>Класс</span>
                          </a>
                        )}

                        {app.postLessonFeedback ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle2 size={11} />
                            <span>Отчёт сдан</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedFeedbackApp(app)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-colors flex items-center space-x-1 text-[11px]"
                            title="Передать рекомендацию пакета менеджеру по продажам"
                          >
                            <Flame size={12} className="text-amber-600" />
                            <span>Отчёт РОПу</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Homework Tracker */}
      {activeTab === 'homework' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen size={18} className="text-indigo-600" />
                <span>Трекер домашних заданий и сдачи</span>
              </h3>
              <p className="text-xs text-slate-500">
                Контроль выполнения, дедлайны и отправка шаблонов ученикам без рутины
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Все' },
                { id: 'pending', label: 'В процессе' },
                { id: 'submitted', label: 'Сдано 🟢' },
                { id: 'late', label: 'Долги 🔴' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setHwFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    hwFilter === f.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Homework list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {homeworkList.map(app => {
              const hw = app.homework;
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{app.studentName}</h4>
                      <p className="text-xs text-slate-500">{app.grade} • {app.subject}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hw?.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' :
                      hw?.status === 'late' ? 'bg-amber-100 text-amber-800' :
                      hw?.status === 'missing' ? 'bg-rose-100 text-rose-800' :
                      hw?.status === 'assigned' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {hw?.status === 'submitted' ? '🟢 Сдано на проверку' :
                       hw?.status === 'late' ? '🟡 Задерживает' :
                       hw?.status === 'missing' ? '🔴 Долг' :
                       hw?.status === 'assigned' ? '⚪ Задано' : 'Не задано'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-800">
                      {hw ? hw.title : 'Домашнее задание пока не назначено'}
                    </div>
                    {hw?.deadline && (
                      <div className="text-slate-500 flex items-center space-x-1">
                        <Clock size={11} />
                        <span>Дедлайн: <strong>{hw.deadline}</strong></span>
                      </div>
                    )}
                    {hw?.notes && (
                      <div className="text-slate-500 italic text-[11px]">
                        «{hw.notes}»
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Урок: {app.date} в {app.startTime}
                    </span>
                    <button
                      onClick={() => setSelectedHomeworkApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>{hw ? 'Редактировать / Отправить' : '+ Назначить ДЗ'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Availability Slots */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Управление окнами для записи</h3>
              <p className="text-xs text-slate-500">
                Укажите, когда вы готовы провести урок. Отдел продаж мгновенно увидит эти слоты.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">День недели</label>
                <input
                  type="date"
                  value={selectedSlotDay}
                  min="2025-01-01"
                  max="2028-12-31"
                  onChange={e => setSelectedSlotDay(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Свободное время</label>
                <select
                  value={selectedSlotTime}
                  onChange={e => setSelectedSlotTime(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {AVAILABLE_TIMES.map(t => (
                    <option key={t} value={t}>{t} – {String(Number(t.split(':')[0]) + 1).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddSlot}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={15} />
              <span>Открыть окно для менеджеров отдела продаж</span>
            </button>

            {slotAddedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold text-center animate-in fade-in">
                ✓ Слот успешно открыт! Менеджеры теперь могут записать клиента на это время.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Students */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Мои ученики и цели подготовки
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorAppointments.map(app => (
              <div key={app.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{app.studentName}</h4>
                  <span className="text-xs text-indigo-600 font-semibold">{app.grade}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Предмет: <strong className="text-slate-700">{app.subject}</strong>
                </p>
                <div className="text-xs text-slate-500">
                  Контакты: <span className="font-medium text-slate-800">{app.parentPhone}</span>
                </div>
                {app.studentGoal && (
                  <div className="p-2 bg-indigo-50/60 rounded-lg text-xs text-indigo-900 font-medium">
                    🎯 {app.studentGoal}
                  </div>
                )}
                {app.tutorNotes && (
                  <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-600 italic">
                    📝 «{app.tutorNotes}»
                  </div>
                )}
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedHudApp(app)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-950 text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <span>🎯 Панель урока</span>
                  </button>
                  <button
                    onClick={() => setSelectedHomeworkApp(app)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    <span>📚 ДЗ ученика</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lesson HUD Modal */}
      <LessonHudModal
        isOpen={!!selectedHudApp}
        onClose={() => setSelectedHudApp(null)}
        appointment={selectedHudApp}
        onSaveContext={(appId, n, g, w) => {
          onSaveLessonContext?.(appId, n, g, w);
          if (selectedHudApp && selectedHudApp.id === appId) {
            setSelectedHudApp(prev => prev ? { ...prev, tutorNotes: n, studentGoal: g, whiteboardUrl: w } : null);
          }
        }}
        onOpenHomework={(app) => {
          setSelectedHomeworkApp(app);
        }}
        onOpenFeedback={(app) => {
          setSelectedFeedbackApp(app);
        }}
      />

      {/* Homework Manager Modal */}
      <HomeworkManagerModal
        isOpen={!!selectedHomeworkApp}
        onClose={() => setSelectedHomeworkApp(null)}
        appointment={selectedHomeworkApp}
        onSaveHomework={(appId, hw) => {
          onSaveHomework?.(appId, hw);
          if (selectedHomeworkApp && selectedHomeworkApp.id === appId) {
            setSelectedHomeworkApp(prev => prev ? { ...prev, homework: hw } : null);
          }
        }}
      />

      {/* Post-lesson feedback modal */}
      <PostLessonFeedbackModal
        isOpen={!!selectedFeedbackApp}
        onClose={() => setSelectedFeedbackApp(null)}
        appointment={selectedFeedbackApp}
        onSubmitFeedback={onSubmitFeedback}
      />
    </div>
  );
}
