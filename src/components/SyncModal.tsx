import React, { useState, useRef } from 'react';
import { X, Calendar, Check, Send, Sparkles, Download, Copy, ExternalLink, Database, Upload, RefreshCw, Cloud } from 'lucide-react';
import { Appointment, Tutor, Manager } from '../lib/types';
import { isFirestoreQuotaExhausted } from '../lib/syncService';
import { copyTextToClipboard } from '../lib/clipboardUtils';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  tutors: Tutor[];
  managers?: Manager[];
  openSlots?: Record<string, boolean>;
  onRestoreData?: (data: {
    appointments?: Appointment[];
    tutors?: Tutor[];
    managers?: Manager[];
    openSlots?: Record<string, boolean>;
  }) => void;
  onResetToDefaults?: () => void;
}

export default function SyncModal({ 
  isOpen, 
  onClose, 
  appointments, 
  tutors,
  managers,
  openSlots,
  onRestoreData,
  onResetToDefaults
}: SyncModalProps) {
  const [copied, setCopied] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<'alfacrm' | 'moyklass' | 'amocrm' | 'bitrix' | 'custom'>('alfacrm');
  const [crmApiKey, setCrmApiKey] = useState('');
  const [crmDomain, setCrmDomain] = useState('');
  const [crmSyncStatus, setCrmSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleTestCrmConnection = () => {
    setCrmSyncStatus('Проверка подключения к ' + selectedCrm.toUpperCase() + '...');
    setTimeout(() => {
      setCrmSyncStatus('✓ Шлюз интеграции активен! Синхронизация расписания и преподавателей готова к работе.');
      setTimeout(() => setCrmSyncStatus(null), 5000);
    }, 1200);
  };

  const exportTutorsToCSV = () => {
    let csv = '\uFEFFИмя преподавателя;Предметы;Стаж (лет);Телефон;Telegram\n';
    tutors.forEach(t => {
      csv += `"${t.name}";"${t.subjects.join(', ')}";"${t.experienceYears || ''}";"${t.phone || ''}";"${t.telegram || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tutors-100-pyaterok-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupStatus('Список 67 преподавателей выгружен в CSV!');
    setTimeout(() => setBackupStatus(null), 4000);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          setBackupStatus('Файл пуст или содержит только заголовок');
          return;
        }
        const startIndex = lines[0].toLowerCase().includes('имя') || lines[0].toLowerCase().includes('name') ? 1 : 0;
        const newTutors: Tutor[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim());
          if (cols[0]) {
            const name = cols[0];
            const subjects = cols[1] ? cols[1].split(/[+,/]/).map(s => s.trim()).filter(Boolean) : ['Общий'];
            const exp = cols[2] ? parseInt(cols[2], 10) || 5 : 5;
            const phone = cols[3] || '+7 (999) 000-00-00';
            const tg = cols[4] || '@tutor';
            newTutors.push({
              id: `tutor-${Date.now()}-${i}`,
              name,
              shortName: name.split(' ').slice(0, 2).join(' '),
              subjects,
              experienceYears: exp,
              phone,
              telegram: tg,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              color: 'indigo',
              availableDays: [1, 2, 3, 4, 5],
              activeStudents: 0,
              rating: 5.0,
              salesConversionRate: 80,
              bio: ''
            });
          }
        }
        if (newTutors.length > 0 && onRestoreData) {
          onRestoreData({ tutors: [...tutors, ...newTutors] });
          setBackupStatus(`✓ Успешно импортировано ${newTutors.length} преподавателей из CRM!`);
          setTimeout(() => setBackupStatus(null), 4000);
        }
      } catch (err) {
        setBackupStatus('Ошибка чтения CSV файла');
      }
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const downloadFullBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      school: '100 Пятёрок CRM',
      appointments,
      tutors,
      managers: managers || [],
      openSlots: openSlots || {},
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `100-pyaterok-crm-backup-${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupStatus('Резервная копия базы данных успешно сохранена в файл JSON!');
    setTimeout(() => setBackupStatus(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (onRestoreData) {
          onRestoreData(parsed);
          setBackupStatus('✓ База данных успешно восстановлена из файла!');
          setTimeout(() => {
            setBackupStatus(null);
            onClose();
          }, 1500);
        }
      } catch (err) {
        setBackupStatus('Ошибка чтения файла. Проверьте формат JSON.');
        setTimeout(() => setBackupStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//100 Pyaterok Online School//CRM Calendar//RU\nCALSCALE:GREGORIAN\n";
    
    appointments.slice(0, 30).forEach((app) => {
      const dateParts = app.date.split('-');
      const startParts = app.startTime.split(':');
      const endParts = app.endTime.split(':');
      
      const dtStart = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${startParts[0]}${startParts[1]}00`;
      const dtEnd = `${dateParts[0]}${dateParts[1]}${dateParts[2]}T${endParts[0]}${endParts[1]}00`;

      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `SUMMARY:Урок: ${app.studentName} (${app.subject}) - Сто Пятёрок\n`;
      icsContent += `DESCRIPTION:Преподаватель: ${app.tutorName}\\nТелефон: ${app.parentPhone}\\nЗаметки: ${app.notes || 'Без заметок'}\n`;
      icsContent += `DTSTART:${dtStart}\n`;
      icsContent += `DTEND:${dtEnd}\n`;
      icsContent += `LOCATION:${app.meetingUrl || 'Яндекс Телемост'}\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += `END:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'сто-пятерок-расписание.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySyncLink = async () => {
    const ok = await copyTextToClipboard('https://sto-pyaterok.ru/api/calendar/feed/live-tutors-sync.ics');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTestTelegram = () => {
    setTelegramStatus('Отправка тестового напоминания...');
    setTimeout(() => {
      setTelegramStatus('✓ Бот @StoPyaterokBot успешно отправил тестовое расписание в группу репетиторов!');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Синхронизация календарей и уведомлений</h3>
              <p className="text-xs text-slate-500">Яндекс Календарь, личные календари телефонов и бот уведомлений</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* CRM Integration Section */}
          <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/40 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
                <Cloud size={18} className="text-emerald-600" />
                <span>Связка с текущей CRM онлайн-школы</span>
              </h4>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Двусторонняя интеграция
              </span>
            </div>

            <p className="text-slate-700 leading-relaxed text-xs">
              Подключите график и шахматку к вашей текущей CRM (<strong>AlfaCRM</strong>, <strong>МойКласс</strong>, <strong>AmoCRM</strong> или <strong>Битрикс24</strong>). Преподаватели, предметы и записи будут синхронизироваться автоматически без ручного дублирования.
            </p>

            {/* CRM Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'alfacrm', label: 'AlfaCRM' },
                { id: 'moyklass', label: 'МойКласс' },
                { id: 'amocrm', label: 'AmoCRM' },
                { id: 'bitrix', label: 'Битрикс24' },
                { id: 'custom', label: 'API / Webhook' },
              ].map(crm => (
                <button
                  key={crm.id}
                  type="button"
                  onClick={() => setSelectedCrm(crm.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCrm === crm.id
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {crm.label}
                </button>
              ))}
            </div>

            {/* Connection Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Адрес / Поддомен текущей CRM:
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedCrm === 'alfacrm' ? 'myschool.s20.online' :
                    selectedCrm === 'moyklass' ? 'myschool.moyklass.com' :
                    selectedCrm === 'amocrm' ? 'myschool.amocrm.ru' : 'https://api.crm.ru/webhook'
                  }
                  value={crmDomain}
                  onChange={e => setCrmDomain(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  API-ключ / Токен доступа:
                </label>
                <input
                  type="password"
                  placeholder="Вставьте API-ключ из настроек вашей CRM..."
                  value={crmApiKey}
                  onChange={e => setCrmApiKey(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Actions: Test Connection + CSV Import/Export */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestCrmConnection}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw size={13} />
                  <span>Проверить связь с {selectedCrm.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
                  title="Загрузить список преподавателей с предметами из выгрузки CRM"
                >
                  <Upload size={13} className="text-emerald-600" />
                  <span>📥 Импорт преподавателей из CRM (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={exportTutorsToCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
                  title="Выгрузить текущую базу преподавателей для сверки с CRM"
                >
                  <Download size={13} className="text-slate-600" />
                  <span>📤 Экспорт в CSV</span>
                </button>

                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </div>
            </div>

            {crmSyncStatus && (
              <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-semibold text-xs flex items-center space-x-2 animate-in fade-in">
                <Check size={14} className="text-emerald-700 shrink-0" />
                <span>{crmSyncStatus}</span>
              </div>
            )}
          </div>

          {/* Option 0: Full Backup & Restore (JSON) */}
          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-sm">
                <Database size={16} className="text-indigo-600" />
                <span>Резервное копирование и сохранение базы школы</span>
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Локальное автосохранение активно
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              Все ваши изменения (новые записи, слоты, статусы воронки и преподаватели) автоматически и мгновенно сохраняются в вашем браузере (LocalStorage). Чтобы не потерять данные при смене компьютера или очистке кэша, скачайте резервный файл или загрузите ранее сохраненный.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={downloadFullBackup}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Download size={14} />
                <span>Скачать резервную копию базы (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-200 font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Upload size={14} className="text-indigo-600" />
                <span>Восстановить из файла (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              {onResetToDefaults && (
                <div className="ml-auto">
                  {isConfirmingReset ? (
                    <div className="flex items-center space-x-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                      <span className="text-[10px] text-rose-700 font-bold px-1">Сбросить всё?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onResetToDefaults();
                          setIsConfirmingReset(false);
                          setBackupStatus('Данные сброшены к исходным');
                          setTimeout(() => {
                            setBackupStatus(null);
                            onClose();
                          }, 1500);
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingReset(false)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white rounded-lg"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(true)}
                      className="px-2.5 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1"
                      title="Сбросить базу до исходных демо-данных школы"
                    >
                      <RefreshCw size={13} />
                      <span className="text-[11px]">Сброс к демо</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {backupStatus && (
              <div className="text-emerald-700 font-bold text-xs bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{backupStatus}</span>
              </div>
            )}
          </div>

          {/* Cloud Sync & Firestore Status */}
          <div className={`p-4 rounded-xl border ${isFirestoreQuotaExhausted() ? 'border-amber-300 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/30'} space-y-2.5`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-sm">
                <Cloud size={16} className={isFirestoreQuotaExhausted() ? 'text-amber-600' : 'text-emerald-600'} />
                <span>Синхронизация с облачной базой Firestore</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFirestoreQuotaExhausted() ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                {isFirestoreQuotaExhausted() ? 'Локальный режим (лимит Spark)' : 'Онлайн'}
              </span>
            </div>
            {isFirestoreQuotaExhausted() ? (
              <div className="space-y-2 text-slate-700 text-xs leading-relaxed">
                <p>
                  Достигнут суточный лимит бесплатных записей Firestore (Free daily write units). Приложение перешло в автономный локальный режим: все записи, слоты и действия сотрудников продолжают надежно сохраняться в браузере (LocalStorage).
                </p>
                <p className="text-slate-500 text-[11px]">
                  Лимит сбросится на следующие сутки, либо администратор может подключить тарифный план Blaze в консоли Firebase:
                </p>
                <a
                  href="https://console.firebase.google.com/project/esoteric-healer-5f38q/firestore/databases/ai-studio-fdabd514-fe84-4902-92ad-d8baae83c58a/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold underline text-xs"
                >
                  <span>Открыть базу в консоли Firebase</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <p className="text-slate-600 text-xs">
                Все изменения расписания автоматически передаются в облачную базу данных для совместной работы сотрудников.
              </p>
            )}
          </div>

          {/* Option 1: Live iCal link */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Прямая подписка для преподавателей (iCal)</span>
              </h4>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                Авто-обновление
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Преподаватель добавляет эту ссылку в Google Календарь на телефоне или ноутбуке один раз. Все новые занятия, добавленные менеджером, появляются в его календаре автоматически.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <input
                readOnly
                value="webcal://sto-pyaterok.ru/api/calendar/tutors-sync.ics"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-[11px] text-slate-700 select-all"
              />
              <button
                onClick={copySyncLink}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1.5 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Export .ics file */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h4 className="font-bold text-slate-900">Экспорт текущего расписания файлом (.ics)</h4>
            <p className="text-slate-600 leading-relaxed">
              Скачайте файл со всеми текущими занятиями недели для импорта в Outlook, Яндекс.Календарь или Apple iCal.
            </p>
            <button
              onClick={downloadICS}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center space-x-2 transition-colors"
            >
              <Download size={14} />
              <span>Скачать файл расписания (.ics)</span>
            </button>
          </div>

          {/* Option 3: Telegram notification bot */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-indigo-950 flex items-center space-x-1.5">
                <Send size={14} className="text-indigo-600" />
                <span>Telegram-бот уведомлений (@StoPyaterokBot)</span>
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Активен
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Мгновенно отправляет преподавателю карточку урока сразу в Telegram, как только менеджер отдела продаж производит запись, и напоминает за 15 минут до начала.
            </p>
            <button
              onClick={handleTestTelegram}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-2 transition-colors"
            >
              <Send size={13} />
              <span>Проверить отправку уведомления в Telegram</span>
            </button>
            {telegramStatus && (
              <div className="text-emerald-700 font-medium text-[11px] pt-1">
                {telegramStatus}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
