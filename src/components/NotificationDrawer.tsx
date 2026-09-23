import React from 'react';
import { AppNotification } from '../lib/types';
import { X, Bell, CheckCheck, Clock, Calendar, Sparkles } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Уведомления в реальном времени</h3>
              <p className="text-[11px] text-slate-500">Синхронизация отдела продаж и репетиторов</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onMarkAllRead}
              title="Отметить все прочитанными"
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <CheckCheck size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-50">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-all ${
                !notif.read
                  ? 'bg-indigo-50/50 border-indigo-100'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {notif.title}
                </h4>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {notif.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {notif.message}
              </p>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Статус вебхуков: 🟢 Подключено</span>
          <span>Telegram бот: @StoPyaterokBot</span>
        </div>
      </div>
    </div>
  );
}
