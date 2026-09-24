import React, { useState } from 'react';
import { Appointment, ConfirmationStatus } from '../lib/types';
import { 
  X, 
  MessageSquare, 
  Phone, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface LeadConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdateStatus: (appointmentId: string, status: ConfirmationStatus) => void;
}

export default function LeadConfirmationModal({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
}: LeadConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const parentName = appointment.parentName || 'уважаемый родитель';
  const cleanPhone = appointment.parentPhone.replace(/[^0-9]/g, '');
  const meetingUrl = appointment.meetingUrl || 'https://telemost.yandex.ru/j/100pyaterok-class';

  const offerNote = appointment.quizContext?.primaryOffer === 'grant30' 
    ? '\nТакже преподаватель зафиксирует за вами именной сертификат на грант 30% на обучение.\n'
    : appointment.quizContext?.primaryOffer === 'matkapital'
    ? '\nТакже мы подготовили персональный расчет оплаты курса средствами материнского капитала.\n'
    : '';

  const defaultMessage = `Здравствуйте, ${parentName}! 
Напоминаем, что сегодня (${appointment.date}) в ${appointment.startTime} у ${appointment.studentName} назначен вводный онлайн-урок по предмету «${appointment.subject}» в онлайн-школе «Сто Пятёрок».
${offerNote}
Преподаватель: ${appointment.tutorName}
Ссылка на подключение: ${meetingUrl}

Пожалуйста, подтвердите, что будете на занятии (ответьте «Да, будем»)!`;

  const tgUrl = `https://t.me/+${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;
  const maxUrl = `https://max.ru/u/${cleanPhone}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTG = () => {
    window.open(tgUrl, '_blank');
    onUpdateStatus(appointment.id, 'reminded');
  };

  const handleSendMax = () => {
    handleCopy();
    window.open(maxUrl, '_blank');
    onUpdateStatus(appointment.id, 'reminded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Контроль явки & Отправка родителю в мессенджер
              </h3>
              <p className="text-[11px] text-slate-500">
                Защита от срывов занятий перед пробным уроком
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Status Bar */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Текущий статус доходимости:</span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {appointment.confirmationStatus === 'confirmed' ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    <span>🟢 Явка подтверждена (100% будет)</span>
                  </span>
                ) : appointment.confirmationStatus === 'reminded' ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Clock size={12} />
                    <span>🟡 Напоминание отправлено (ждём ответ)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertCircle size={12} />
                    <span>🔴 Не подтверждён (риск недохода!)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Начало урока:</span>
              <strong className="text-slate-800 text-xs">{appointment.startTime}</strong>
            </div>
          </div>

          {/* Target Student Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
            <div>
              <span className="text-slate-500">Ученик:</span>{' '}
              <strong className="text-slate-900">{appointment.studentName} ({appointment.grade})</strong>
            </div>
            <div>
              <span className="text-slate-500">Телефон:</span>{' '}
              <strong className="text-indigo-600">{appointment.parentPhone}</strong>
            </div>
            <div>
              <span className="text-slate-500">Преподаватель:</span>{' '}
              <strong className="text-slate-900">{appointment.tutorName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Предмет:</span>{' '}
              <strong className="text-slate-900">{appointment.subject}</strong>
            </div>
          </div>

          {/* Generated Telegram / Max Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Готовый шаблон напоминания родителю (Telegram / Max):</label>
              <button
                onClick={handleCopy}
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1 text-[11px]"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Скопировано!' : 'Копировать текст'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={defaultMessage}
              className="w-full text-[11px] p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-mono leading-relaxed select-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSendTG}
                className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-sky-200 transition-all text-xs"
              >
                <Send size={13} />
                <span>Отправить в Telegram</span>
              </button>
              <button
                onClick={handleSendMax}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-200 transition-all text-xs"
              >
                <Send size={13} />
                <span>Открыть в MAX</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onUpdateStatus(appointment.id, 'confirmed');
                  onClose();
                }}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center space-x-1 text-xs"
              >
                <CheckCircle2 size={13} />
                <span>Отметить «Подтвердил» 🟢</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(appointment.id, 'unconfirmed');
                  onClose();
                }}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center space-x-1 text-xs"
              >
                <AlertCircle size={13} />
                <span>Сбросить в «Не подтвердил» 🔴</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
