import React, { useState, useEffect, useRef } from 'react';
import { Appointment, LessonHomework } from '../lib/types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Bell, 
  ExternalLink, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  X, 
  Layers, 
  Video, 
  Flame,
  Check,
  AlertTriangle,
  Send
} from 'lucide-react';

interface LessonHudModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSaveContext: (appointmentId: string, notes: string, goal: string, whiteboardUrl: string) => void;
  onOpenHomework: (appointment: Appointment) => void;
  onOpenFeedback: (appointment: Appointment) => void;
}

export default function LessonHudModal({
  isOpen,
  onClose,
  appointment,
  onSaveContext,
  onOpenHomework,
  onOpenFeedback,
}: LessonHudModalProps) {
  if (!isOpen || !appointment) return null;

  // Timer states
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasPlayedWarning, setHasPlayedWarning] = useState<boolean>(false);

  // Editable fields
  const [notes, setNotes] = useState(appointment.tutorNotes || '');
  const [goal, setGoal] = useState(appointment.studentGoal || '');
  const [whiteboardUrl, setWhiteboardUrl] = useState(
    appointment.whiteboardUrl || 'https://sboard.online/board/demo-math'
  );
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Web Audio chime function (gentle bell without external dependencies)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev === 300 && !hasPlayedWarning) {
            // 5 minutes warning chime!
            playChime();
            setHasPlayedWarning(true);
          }
          if (prev <= 1) {
            playChime();
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining, hasPlayedWarning]);

  const handleSetDuration = (mins: number) => {
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsTimerRunning(false);
    setHasPlayedWarning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(durationMinutes * 60);
    setHasPlayedWarning(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100))
  );

  const handleSaveContext = () => {
    onSaveContext(appointment.id, notes, goal, whiteboardUrl);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="lesson-hud-modal"
        className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]"
      >
        {/* Top Battle Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Панель урока • Боевой режим
                </span>
                <span className="text-xs text-slate-400">
                  {appointment.subject} • {appointment.grade}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5 flex items-center space-x-2">
                <span>{appointment.studentName}</span>
                <span className="text-xs font-normal text-slate-400">({appointment.startTime} - {appointment.endTime})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* HUD Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Sto-Pyaterok Entrance Quiz & Offer Banner for Tutor */}
          {appointment.quizContext && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-slate-800/60 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                  🎯
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center space-x-2">
                    <span>Диагностика из квиза: {appointment.quizContext.currentGradeScore}</span>
                    <span className="bg-amber-400/20 text-amber-200 text-[10px] px-2 py-0.2 rounded-full border border-amber-400/30">
                      {appointment.quizContext.primaryOffer === 'grant30' ? '🎁 Оффер: Грант 30%' :
                       appointment.quizContext.primaryOffer === 'matkapital' ? '🏛️ Оффер: Маткапитал' : '⚡ Бесплатный пробный'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Фокус ученика: <strong>{appointment.quizContext.targetScore}</strong> • Источник: {appointment.quizContext.leadSource || 'Сайт sto-pyaterok.ru'}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 bg-black/30 px-2 py-1 rounded">
                Ученик ждёт подтверждения цели на уроке
              </div>
            </div>
          )}

          {/* Quick Launch Control Bar (Telemost + Whiteboard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Telemost / Zoom video button */}
            <a
              href={appointment.meetingUrl || 'https://telemost.yandex.ru'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-between shadow-lg shadow-indigo-950 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Video size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-wide">Виртуальный класс</div>
                  <div className="text-[11px] text-indigo-200 font-normal">Яндекс Телемост (1-Click)</div>
                </div>
              </div>
              <ExternalLink size={16} className="text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Whiteboard Sboard / Miro button */}
            <a
              href={whiteboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center justify-between shadow-lg shadow-teal-950 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-wide">Интерактивная доска</div>
                  <div className="text-[11px] text-teal-200 font-normal truncate max-w-[200px]">
                    Sboard / Персональная доска
                  </div>
                </div>
              </div>
              <ExternalLink size={16} className="text-teal-200 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Centerpiece: Precision Lesson Timer with 5-min Audio Warning */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Таймер урока и контроль темпа
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Авто-предупреждение гонгом за 5 минут до конца занятия
                  </div>
                </div>
              </div>

              {/* Duration selector */}
              <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
                {[45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleSetDuration(mins)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Big Countdown & Progress */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-700/60">
              <div className="flex items-baseline space-x-3">
                <span className={`text-4xl sm:text-5xl font-mono font-black tracking-tight ${
                  secondsRemaining <= 300 ? 'text-amber-400 animate-pulse' : 'text-white'
                }`}>
                  {formatTime(secondsRemaining)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {secondsRemaining <= 300 ? '⚠️ Финал урока!' : `из ${durationMinutes} мин`}
                </span>
              </div>

              {/* Play / Pause / Reset / Gong Test */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-sm transition-all ${
                    isTimerRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isTimerRunning ? 'Пауза' : 'Старт таймера'}</span>
                </button>

                <button
                  onClick={handleResetTimer}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  title="Сброс таймера"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={playChime}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 transition-colors"
                  title="Тест звукового гонга"
                >
                  <Bell size={15} />
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  secondsRemaining <= 300 ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Student Goal & Persistent Memory (Памятка с прошлого урока) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Goal */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  🎯 Цель ученика и фокус
                </span>
                <span className="text-[10px] text-slate-400">Из базы учеников</span>
              </div>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                rows={2}
                placeholder="Например: 80+ баллов на ЕГЭ, сдать ОГЭ на 5, разобрать тригонометрию..."
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tutor Personal Notes (Памятка с прошлого занятия) */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  📝 На чём остановились (Памятка)
                </span>
                <span className="text-[10px] text-slate-400">Приватно</span>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Что прошли, какие формулы повторить, на какой задаче застряли..."
                className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Whiteboard link customizer & Save bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
            <div className="flex-1 w-full flex items-center space-x-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Ссылка на доску:</span>
              <input
                type="url"
                value={whiteboardUrl}
                onChange={e => setWhiteboardUrl(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                placeholder="https://sboard.online/board/..."
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {isSavedNotice && (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                  <Check size={14} />
                  <span>Сохранено!</span>
                </span>
              )}
              <button
                onClick={handleSaveContext}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Save size={13} />
                <span>Сохранить в карточку</span>
              </button>
            </div>
          </div>

          {/* Homework Status & Sales Handover Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Homework Status Card */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Домашнее задание
                </div>
                <div className="text-xs font-bold text-white">
                  {appointment.homework ? appointment.homework.title : 'Не назначено'}
                </div>
                <div className="text-[11px]">
                  {appointment.homework ? (
                    <span className={`font-bold ${
                      appointment.homework.status === 'submitted' ? 'text-emerald-400' :
                      appointment.homework.status === 'late' ? 'text-amber-400' :
                      appointment.homework.status === 'missing' ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {appointment.homework.status === 'submitted' ? '🟢 Сдано на проверку' :
                       appointment.homework.status === 'late' ? '🟡 Задерживает' :
                       appointment.homework.status === 'missing' ? '🔴 Долг' : '⚪ Задано'} • {appointment.homework.deadline || 'без дедлайна'}
                    </span>
                  ) : (
                    <span className="text-slate-400">Назначьте ДЗ в 1 клик</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenHomework(appointment);
                }}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors flex items-center space-x-1"
              >
                <Edit3 size={13} />
                <span>{appointment.homework ? 'Изменить' : '+ Назначить'}</span>
              </button>
            </div>

            {/* Post-Lesson Feedback Handover */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-800 p-4 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                  <Flame size={13} />
                  <span>Передача в продажи</span>
                </div>
                <div className="text-xs font-bold text-white">
                  {appointment.postLessonFeedback ? '✓ Отчёт сдан РОПу' : 'Экспресс-отчёт (15 сек)'}
                </div>
                <div className="text-[11px] text-slate-300">
                  {appointment.postLessonFeedback 
                    ? appointment.postLessonFeedback.recommendation 
                    : 'Рекомендация пакета занятий'}
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback(appointment);
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Flame size={13} />
                <span>{appointment.postLessonFeedback ? 'Изменить' : 'Отправить'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Режим активного урока • Горячие клавиши сохранены</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Закрыть панель
          </button>
        </div>
      </div>
    </div>
  );
}
