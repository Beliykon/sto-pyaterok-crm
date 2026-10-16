import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  CheckCheck, 
  Bell, 
  Bot, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  Copy,
  Settings,
  MessageSquare
} from 'lucide-react';
import { 
  TelegramSettings, 
  getTelegramSettings, 
  saveTelegramSettings, 
  sendTelegramMessage 
} from '../lib/telegramService';
import { copyTextToClipboard } from '../lib/clipboardUtils';

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export default function TelegramBotModal({
  isOpen,
  onClose,
  onToast,
}: TelegramBotModalProps) {
  const [settings, setSettings] = useState<TelegramSettings>(getTelegramSettings());
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getTelegramSettings());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveTelegramSettings(settings);
    onToast('Настройки Telegram-бота сохранены ✓');
    onClose();
  };

  const handleSendTest = async () => {
    setIsSending(true);
    setTestStatus('Отправка тестового сообщения...');

    const testMessage = `🤖 <b>Тестовое уведомление бота «Сто Пятёрок»</b>\n\n✅ Интеграция с расписанием активна!\n🔔 Уведомления о записях, переносах и отменах уроков будут поступать в этот чат мгновенно.\n\nВремя проверки: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const res = await sendTelegramMessage(testMessage, settings);
    setIsSending(false);

    if (res.success) {
      setTestStatus('✓ Тестовое уведомление успешно отправлено в Telegram!');
      onToast('Тестовое уведомление доставлено в Telegram');
    } else {
      setTestStatus(`⚠️ ${res.error || 'Не удалось отправить'}. Проверьте токен и ID группы.`);
    }
  };

  const sampleBookingText = `🔔 НОВАЯ ЗАПИСЬ НА ВВОДНЫЙ УРОК
👨‍🎓 Ученик: Михаил (10 класс)
📚 Предмет: Математика (профиль)
👨‍🏫 Преподаватель: Асият Шаваева
📅 Дата и время: Завтра в 11:00
📞 Телефон: +7 (999) 111-22-33
💬 Запрос МОП: Подготовка к профильному ЕГЭ на 80+`;

  const handleCopySample = async () => {
    const ok = await copyTextToClipboard(sampleBookingText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center space-x-2">
                <span>Уведомления в Telegram-боте</span>
                <span className="text-[10px] bg-emerald-400/30 border border-emerald-300/40 text-white font-bold px-2 py-0.5 rounded-full">
                  {settings.enabled ? 'Включены' : 'Отключены'}
                </span>
              </h2>
              <p className="text-xs text-sky-100">
                Автоматическая отправка записей, переносов и отмен уроков в Telegram
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Автоматические уведомления бота
              </div>
              <div className="text-[11px] text-slate-500">
                При создании записи, переносе или отмене бот пишет в группу или преподавателю
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.enabled} 
                onChange={e => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Bot Connection Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Settings size={14} className="text-sky-600" />
              <span>Параметры бота и чата</span>
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telegram Bot Username:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">@</span>
                    <input 
                      type="text" 
                      value={settings.botUsername.replace(/^@/, '')} 
                      onChange={e => setSettings(prev => ({ ...prev, botUsername: e.target.value.trim() }))}
                      placeholder="StoPyaterokBot"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <a
                    href={`https://t.me/${settings.botUsername.replace(/^@/, '') || 'StoPyaterokBot'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                  >
                    <span>Открыть</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telegram Bot API Token (необязательно, для прямой фоновой отправки):
                </label>
                <input 
                  type="password" 
                  value={settings.botToken} 
                  onChange={e => setSettings(prev => ({ ...prev, botToken: e.target.value.trim() }))}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ (из @BotFather)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Если токен указан, бот шлет уведомления напрямую в чат/группу без необходимости ручной отправки.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID группы или чата преподавателей / отдела продаж:
                </label>
                <input 
                  type="text" 
                  value={settings.chatId} 
                  onChange={e => setSettings(prev => ({ ...prev, chatId: e.target.value.trim() }))}
                  placeholder="-100xxxxxxxxxx или @sto_pyaterok_leads"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Triggers Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Bell size={14} className="text-sky-600" />
              <span>События для отправки</span>
            </h3>

            <div className="space-y-1.5">
              <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input 
                  type="checkbox"
                  checked={settings.notifyOnBooking}
                  onChange={e => setSettings(prev => ({ ...prev, notifyOnBooking: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>🔔 Новая запись на вводный / регулярный урок</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input 
                  type="checkbox"
                  checked={settings.notifyOnReschedule}
                  onChange={e => setSettings(prev => ({ ...prev, notifyOnReschedule: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>🔄 Перенос даты или времени занятия</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input 
                  type="checkbox"
                  checked={settings.notifyOnCancel}
                  onChange={e => setSettings(prev => ({ ...prev, notifyOnCancel: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>❌ Отмена урока (освобождение слота)</span>
              </label>

              <label className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input 
                  type="checkbox"
                  checked={settings.notifyDailyDigest}
                  onChange={e => setSettings(prev => ({ ...prev, notifyDailyDigest: e.target.checked }))}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>☀️ Утренняя сводка расписания в 08:00</span>
              </label>
            </div>
          </div>

          {/* Test Action */}
          <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900">
                Тестирование бота:
              </span>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendTest}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Send size={12} />
                <span>{isSending ? 'Отправка...' : 'Отправить тест в Telegram'}</span>
              </button>
            </div>
            {testStatus && (
              <div className="text-xs text-sky-800 font-medium bg-white/80 p-2 rounded-lg border border-sky-200">
                {testStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopySample}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1 cursor-pointer"
          >
            {copied ? <CheckCheck size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Скопирован образец' : 'Скопировать шаблон сообщения'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Check size={14} />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
