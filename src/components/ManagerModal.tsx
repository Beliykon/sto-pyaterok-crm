import React, { useState } from 'react';
import { Manager } from '../lib/types';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  Briefcase, 
  Phone, 
  Mail, 
  Shield, 
  Check, 
  Search 
} from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managers: Manager[];
  onAddManager: (newManager: Manager) => void;
  onUpdateManager: (updatedManager: Manager) => void;
  onDeleteManager: (managerId: string) => void;
}

export default function ManagerModal({
  isOpen,
  onClose,
  managers,
  onAddManager,
  onUpdateManager,
  onDeleteManager,
}: ManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form states (strictly NO achievements, simple manager profile)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'admin'>('manager');
  const [active, setActive] = useState(true);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingManager(null);
    setName('');
    setPhone('+7 (926) ');
    setEmail('');
    setRole('manager');
    setActive(true);
    setIsCreating(true);
  };

  const handleStartEdit = (mgr: Manager) => {
    setEditingManager(mgr);
    setName(mgr.name);
    setPhone(mgr.phone);
    setEmail(mgr.email);
    setRole(mgr.role);
    setActive(mgr.active);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const managerData: Manager = {
      id: editingManager ? editingManager.id : `mgr-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '+7 (999) 000-00-00',
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@sto-pyaterok.ru`,
      role,
      active,
      createdAt: editingManager ? editingManager.createdAt : new Date().toISOString().split('T')[0],
    };

    if (editingManager) {
      onUpdateManager(managerData);
    } else {
      onAddManager(managerData);
    }

    setIsCreating(false);
    setEditingManager(null);
  };

  const filteredManagers = managers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Менеджеры отдела продаж ({managers.length})
              </h3>
              <p className="text-xs text-slate-500">
                Сотрудники с полным доступом к записи клиентов и контактам родителей
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isCreating && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus size={14} />
                <span>+ Добавить менеджера</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCreating ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingManager ? `Редактирование: ${editingManager.name}` : 'Новый менеджер по продажам'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Контактные данные для связи с клиентами и распределения лидов
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Назад к списку
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ФИО менеджера <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Васильева Елена Игоревна"
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Рабочий телефон / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (926) 400-12-34"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Рабочий Email / Логин
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="elena@sto-pyaterok.ru"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Роль в системе
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'manager' | 'admin')}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="manager">Менеджер по продажам</option>
                    <option value="admin">Старший менеджер / Администратор</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Статус активности
                  </label>
                  <div className="flex items-center space-x-3 pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={e => setActive(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Активен (получает лиды)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <Check size={14} />
                  <span>{editingManager ? 'Сохранить' : 'Добавить менеджера'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Поиск менеджера по имени или телефону..."
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {filteredManagers.map(mgr => (
                  <div key={mgr.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        mgr.role === 'admin' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {mgr.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{mgr.name}</h4>
                          {mgr.role === 'admin' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Администратор
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Менеджер
                            </span>
                          )}
                          {!mgr.active && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              Неактивен
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <Phone size={12} className="text-slate-400" />
                            <span>{mgr.phone}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Mail size={12} className="text-slate-400" />
                            <span>{mgr.email}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(mgr)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Редактировать менеджера"
                      >
                        <Edit3 size={15} />
                      </button>

                      {confirmingDeleteId === mgr.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteManager(mgr.id);
                              setConfirmingDeleteId(null);
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                          >
                            Удалить
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            className="px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(mgr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
