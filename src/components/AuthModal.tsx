import React, { useState } from 'react';
import { CurrentUser, Tutor, UserRole } from '../lib/types';
import { 
  X, 
  Shield, 
  GraduationCap, 
  Check, 
  Key, 
  UserCheck, 
  AlertCircle,
  Lock,
  Search,
  Link as LinkIcon,
  CheckCheck,
  LogOut,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSelectUser: (user: CurrentUser) => void;
  tutors: Tutor[];
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  tutors,
}: AuthModalProps) {
  const [selectedTab, setSelectedTab] = useState<UserRole>(currentUser.role === 'admin' ? 'admin' : 'tutor');
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  const [copiedTutorId, setCopiedTutorId] = useState<string | null>(null);

  const handleCopyTutorLink = (e: React.MouseEvent, tutor: Tutor) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('tutor', tutor.id);
      navigator.clipboard.writeText(url.toString());
      setCopiedTutorId(tutor.id);
      setTimeout(() => {
        setCopiedTutorId(prev => (prev === tutor.id ? null : prev));
      }, 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isOpen) return null;

  const handleLoginAsAdmin = (e: React.FormEvent) => {
    e.preventDefault();
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
                Текущий пользователь: <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.role === 'admin' ? 'Администратор' : 'Преподаватель'})
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
            onClick={() => setSelectedTab('tutor')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              selectedTab === 'tutor'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <GraduationCap size={14} className={selectedTab === 'tutor' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Преподаватель</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6">
          {selectedTab === 'admin' && (
            <form onSubmit={handleLoginAsAdmin} className="space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                👑 <strong>Панель Администратора школы:</strong> полный доступ ко всем преподавателям, расписанию, аналитике, настройке слотов и экспорту данных.
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
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>Войти как Руководитель / Администратор</span>
              </button>
            </form>
          )}

          {selectedTab === 'tutor' && (
            <div className="space-y-3">
              {/* If current user is already a tutor, show their personal account card */}
              {currentUser.role === 'tutor' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                        {currentUser.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                          Личный кабинет преподавателя
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {currentUser.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span>Индивидуальный доступ активен</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                      <div className="font-semibold flex items-center space-x-1">
                        <LinkIcon size={12} className="text-blue-600" />
                        <span>Ваша персональная постоянная ссылка:</span>
                      </div>
                      <p className="text-slate-600 text-[10px]">
                        Сохраните эту ссылку в закладки браузера или на экран телефона — она открывает строго ваше расписание.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          const tutorObj = tutors.find(t => t.id === currentUser.tutorId);
                          if (tutorObj) handleCopyTutorLink(e, tutorObj);
                        }}
                        className="w-full mt-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                      >
                        {copiedTutorId === currentUser.tutorId ? (
                          <>
                            <CheckCheck size={13} className="text-emerald-600" />
                            <span>Ссылка скопирована в буфер!</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon size={13} />
                            <span>Скопировать мою персональную ссылку</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      🔒 Индивидуальный изолированный доступ
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Преподаватель работает только со своим расписанием и не видит других преподавателей. Для входа под другим преподавателем перейдите по его персональной ссылке или войдите как Администратор школы.
                    </p>
                  </div>
                </div>
              ) : (
                /* Admin view: search and list tutors with copy link buttons */
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                      <LinkIcon size={14} className="text-indigo-600" />
                      <span>Индивидуальные персональные ссылки преподавателей:</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Нажмите на значок <strong className="font-semibold">🔗 Ссылка</strong> рядом с учителем, чтобы скопировать его персональную ссылку и отправить в Telegram. Учитель сразу попадёт в свой изолированный кабинет!
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-700">
                      Преподаватели онлайн-школы ({tutors.length}):
                    </div>
                  </div>

                  {/* Instant Search Bar */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Быстрый поиск по фамилии или предмету..."
                      value={tutorSearch}
                      onChange={e => setTutorSearch(e.target.value)}
                      className="w-full text-xs font-medium pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...tutors]
                      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                      .filter(t => {
                        if (!tutorSearch.trim()) return true;
                        const q = tutorSearch.toLowerCase().trim();
                        return t.name.toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q));
                      })
                      .map(tutor => {
                        const isCurrent = currentUser.role === 'tutor' && currentUser.tutorId === tutor.id;
                        const isCopied = copiedTutorId === tutor.id;
                        return (
                          <div
                            key={tutor.id}
                            onClick={() => handleSelectTutor(tutor)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-200'
                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <img
                                src={tutor.avatar}
                                alt={tutor.shortName}
                                className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                              />
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="text-xs font-bold text-slate-900 truncate">{tutor.name}</div>
                                <div className="text-[11px] text-blue-600 font-medium truncate">
                                  {tutor.subjects.slice(0, 3).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleCopyTutorLink(e, tutor)}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                                  isCopied
                                    ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                    : 'bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
                                }`}
                                title="Скопировать постоянную ссылку для отправки учителю"
                              >
                                {isCopied ? <CheckCheck size={13} className="text-emerald-600" /> : <LinkIcon size={13} />}
                                <span className="text-[10px] hidden sm:inline">
                                  {isCopied ? 'Скопировано!' : 'Ссылка'}
                                </span>
                              </button>

                              {isCurrent ? (
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                  <Check size={12} />
                                  <span>Выбран</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium hover:text-slate-600">Войти →</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
