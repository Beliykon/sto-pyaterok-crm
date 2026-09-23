import React, { useState } from 'react';
import { CurrentUser, Manager, Tutor, UserRole } from '../lib/types';
import { 
  X, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Check, 
  Key, 
  UserCheck, 
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSelectUser: (user: CurrentUser) => void;
  managers: Manager[];
  tutors: Tutor[];
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  managers,
  tutors,
}: AuthModalProps) {
  const [selectedTab, setSelectedTab] = useState<UserRole>(currentUser.role);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');

  if (!isOpen) return null;

  const handleLoginAsAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin passcode or quick confirmation
    if (adminPin === '' || adminPin === 'admin' || adminPin === '1234') {
      onSelectUser({
        id: 'admin',
        name: 'Руководитель школы (Администратор)',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      setAdminError('');
      onClose();
    } else {
      setAdminError('Неверный код доступа (по умолчанию: admin или 1234)');
    }
  };

  const handleSelectManager = (mgr: Manager) => {
    onSelectUser({
      id: mgr.id,
      name: mgr.name,
      role: 'manager',
      managerId: mgr.id,
    });
    onClose();
  };

  const handleSelectTutor = (tutor: Tutor) => {
    onSelectUser({
      id: tutor.id,
      name: tutor.name,
      role: 'tutor',
      tutorId: tutor.id,
      avatar: tutor.avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Авторизация и профиль
              </h3>
              <p className="text-xs text-slate-500">
                Текущий пользователь: <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.role === 'admin' ? 'Администратор' : currentUser.role === 'manager' ? 'Менеджер' : 'Преподаватель'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTab('admin')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              selectedTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Shield size={14} className={selectedTab === 'admin' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Администратор</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('manager')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              selectedTab === 'manager'
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Briefcase size={14} className={selectedTab === 'manager' ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Менеджер</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab('tutor')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              selectedTab === 'tutor'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <GraduationCap size={14} className={selectedTab === 'tutor' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Учитель</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6">
          {selectedTab === 'admin' && (
            <form onSubmit={handleLoginAsAdmin} className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                👑 <strong>Режим Администратора школы:</strong> полный доступ к добавлению преподавателей и менеджеров, настройке расписания, экспорту базы и открытым контактам родителей.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Код быстрого доступа администратора (по умолчанию: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">admin</code>)
                </label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={adminPin}
                    onChange={e => {
                      setAdminPin(e.target.value);
                      setAdminError('');
                    }}
                    placeholder="Введите пароль или оставьте пустым..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                {adminError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center space-x-1">
                    <AlertCircle size={12} />
                    <span>{adminError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <Check size={14} />
                <span>Войти как Руководитель / Администратор</span>
              </button>
            </form>
          )}

          {selectedTab === 'manager' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                💼 <strong>Режим Менеджера по продажам:</strong> быстрая запись клиентов, фильтр свободных окон, доступ к WhatsApp и звонкам родителям.
              </div>

              <div className="text-xs font-bold text-slate-700">Выберите сотрудника для входа:</div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {managers.map(mgr => {
                  const isCurrent = currentUser.role === 'manager' && currentUser.name === mgr.name;
                  return (
                    <button
                      key={mgr.id}
                      type="button"
                      onClick={() => handleSelectManager(mgr)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          {mgr.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{mgr.name}</div>
                          <div className="text-[11px] text-slate-500">{mgr.phone}</div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Check size={12} />
                          <span>Активен</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Войти →</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === 'tutor' && (
            <div className="space-y-3">
              {/* Anti-Poaching Explanatory Notice */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-blue-950">
                  <Lock size={14} className="text-blue-600" />
                  <span>Анти-увод клиентов (Защита базы онлайн-школы):</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  В профиле преподавателя <strong>прямые номера телефонов родителей маскируются</strong>. Преподаватель видит имя ученика, учебную цель, домашние задания и ссылку на урок, но не может скопировать контакты для частных занятий в обход школы.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-700">Выберите преподавателя:</div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tutors.map(tutor => {
                  const isCurrent = currentUser.role === 'tutor' && currentUser.tutorId === tutor.id;
                  return (
                    <button
                      key={tutor.id}
                      type="button"
                      onClick={() => handleSelectTutor(tutor)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={tutor.avatar}
                          alt={tutor.shortName}
                          className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{tutor.name}</div>
                          <div className="text-[11px] text-blue-600 font-medium">
                            {tutor.subjects.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Check size={12} />
                          <span>Выбран</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Войти →</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
