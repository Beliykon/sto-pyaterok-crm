import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  CheckCheck, 
  Smartphone, 
  Share2, 
  Search, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Tutor } from '../lib/types';

interface PermanentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: Tutor[];
}

export const PermanentLinkModal: React.FC<PermanentLinkModalProps> = ({
  isOpen,
  onClose,
  tutors,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [tutorSearch, setTutorSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'links' | 'pwa' | 'github'>('links');

  if (!isOpen) return null;

  // Base production URL
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '') 
    : '';

  const copyToClipboard = (text: string, type: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const getTutorLink = (tutorId: string) => {
    return `${baseUrl}?tutor=${tutorId}`;
  };

  const handleCopyAllTutorLinks = () => {
    const lines = tutors.map(t => `${t.name} (${t.subjects.join(', ')}):\n${getTutorLink(t.id)}`);
    const fullText = `📚 Персональные кабинеты преподавателей онлайн-школы «Сто Пятёрок»:\n\n${lines.join('\n\n')}\n\n💡 Сохраните ссылку в закладки браузера или на главный экран телефона!`;
    copyToClipboard(fullText, 'all-tutors');
  };

  const filteredTutors = tutors.filter(t => 
    t.name.toLowerCase().includes(tutorSearch.toLowerCase()) ||
    t.shortName.toLowerCase().includes(tutorSearch.toLowerCase()) ||
    t.subjects.some((s: string) => s.toLowerCase().includes(tutorSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center space-x-2">
                <span>Единая постоянная ссылка и PWA</span>
                <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  1 адрес навсегда
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Как обновлять через GitHub без пересылки разных ссылок клиенту и учителям
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'links'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 size={14} />
            <span>Ссылки на CRM и учителей</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone size={14} />
            <span>Установка на телефон (PWA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'github'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={14} />
            <span>Настройка в GitHub Pages</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'links' && (
            <>
              {/* Main School Link */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Главная ссылка CRM школы (для директора и администратора)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Полный доступ ко всей шахматке
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={baseUrl || 'https://ваш-домен.github.io/crm/'}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(baseUrl, 'main')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    {copiedType === 'main' ? (
                      <>
                        <CheckCheck size={14} className="text-emerald-300" />
                        <span>Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Скопировать</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 Отправьте эту ссылку директору <strong>один раз</strong>. При каждом коммите в GitHub проект обновляется автоматически, ссылку менять не нужно.
                </p>
              </div>

              {/* Tutors Personal Links Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
                      <span>Персональные ссылки преподавателей</span>
                      <span className="text-xs text-indigo-600 font-semibold lowercase">
                        ({tutors.length} репетиторов)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Учитель сразу открывает свой кабинет без логина и без лишних цен/комиссий
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAllTutorLinks}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Скопировать список всех ссылок для отправки менеджеру или в Telegram"
                  >
                    {copiedType === 'all-tutors' ? (
                      <>
                        <CheckCheck size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Весь список скопирован!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Скопировать весь список</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tutorSearch}
                    onChange={e => setTutorSearch(e.target.value)}
                    placeholder="Найти преподавателя по имени или предмету..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Tutor List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                  {filteredTutors.map(tutor => {
                    const tutorLink = getTutorLink(tutor.id);
                    const isCopied = copiedType === `tutor-${tutor.id}`;

                    return (
                      <div
                        key={tutor.id}
                        className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-indigo-300 transition-all shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {tutor.name}
                            </span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                              {tutor.subjects[0]}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5 max-w-[280px]">
                            {tutorLink}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(tutorLink, `tutor-${tutor.id}`)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {isCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
                            <span>{isCopied ? 'Скопировано!' : 'Копировать'}</span>
                          </button>
                          <a
                            href={tutorLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Открыть кабинет в новой вкладке"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTutors.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Преподаватель не найден
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/90 flex items-start space-x-3">
                <Sparkles size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Приложение работает на смартфонах без установки из App Store / Google Play!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Благодаря технологии PWA сайт можно сохранить как полноценное приложение на экран телефона. Учителю и клиенту достаточно сделать это 1 раз.
                  </p>
                </div>
              </div>

              {/* iPhone Instruction */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🍏</span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Инструкция для iPhone (браузер Safari)
                  </h4>
                </div>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1">
                  <li>
                    Откройте ссылку в стандартном браузере <strong>Safari</strong>.
                  </li>
                  <li>
                    Внизу экрана нажмите иконку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх <Share2 size={12} className="inline mx-0.5 text-indigo-600" />).
                  </li>
                  <li>
                    Прокрутите меню вниз и выберите <strong>«На экран „Домой“»</strong> (Add to Home Screen).
                  </li>
                  <li>
                    В правом верхнем углу нажмите <strong>«Добавить»</strong>.
                  </li>
                </ol>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>На экране телефона появится иконка «100 Пятёрок», которая открывается на весь экран без рамок браузера!</span>
                </div>
              </div>

              {/* Android Instruction */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🤖</span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Инструкция для Android (браузер Google Chrome)
                  </h4>
                </div>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside pl-1">
                  <li>
                    Откройте ссылку в браузере <strong>Google Chrome</strong>.
                  </li>
                  <li>
                    В правом верхнем углу нажмите на три точки <strong>«⋮»</strong> (Меню).
                  </li>
                  <li>
                    Выберите пункт <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.
                  </li>
                  <li>
                    Подтвердите установку кнопкой <strong>«Установить»</strong>.
                  </li>
                </ol>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-center space-x-2">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>Приложение установится в меню смартфона и будет всегда открывать актуальную версию.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200/90 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Как включить автоматический деплой на GitHub за 1 минуту</span>
                </h4>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Файл автоматической сборки <code className="bg-white/80 px-1 py-0.5 rounded text-indigo-950 font-mono text-[11px]">.github/workflows/deploy.yml</code> уже загружен в проект. Вам нужно только активировать его в настройках репозитория.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-slate-700">
                    Откройте ваш репозиторий на сайте <strong>github.com</strong> и перейдите в меню <strong>Settings</strong> (Настройки) сверху.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-slate-700">
                    В левой колонке нажмите пункт <strong>Pages</strong>.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-slate-700">
                    В разделе <strong>Build and deployment</strong> в выпадающем списке <strong>Source</strong> выберите <strong>GitHub Actions</strong>.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <div className="text-xs text-emerald-900">
                    <strong>Готово!</strong> Сверху появится постоянная ссылка вида:
                    <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-emerald-300 text-emerald-950 select-all">
                      https://&lt;ваш-логин&gt;.github.io/&lt;репозиторий&gt;/
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <strong>Важное правило:</strong> Теперь вы просто делаете <code className="bg-white/80 px-1 py-0.5 rounded font-mono">git push origin main</code>. Через 40–60 секунд сайт автоматически обновляется по этой же ссылке. Клиенту и учителям достаточно обновить страницу (F5 или смахнуть вниз на телефоне)!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Онлайн-школа «Сто Пятёрок» • Автодеплой и PWA
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
