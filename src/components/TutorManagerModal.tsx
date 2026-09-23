import React, { useState } from 'react';
import { Tutor } from '../lib/types';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  GraduationCap, 
  Award, 
  Check, 
  Star, 
  User, 
  Briefcase, 
  Search,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface TutorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutors: Tutor[];
  onAddTutor: (newTutor: Tutor) => void;
  onUpdateTutor: (updatedTutor: Tutor) => void;
  onDeleteTutor: (tutorId: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const POPULAR_SUBJECTS = [
  'Математика (профиль)',
  'Математика (база)',
  'Русский язык',
  'Физика',
  'Химия',
  'Биология',
  'Обществознание',
  'История',
  'Английский язык',
  'Информатика (Python)',
  'Литература',
  'Начальная школа',
];

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 7, label: 'Вс' },
];

export default function TutorManagerModal({
  isOpen,
  onClose,
  tutors,
  onAddTutor,
  onUpdateTutor,
  onDeleteTutor,
}: TutorManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [education, setEducation] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(2000);
  const [rating, setRating] = useState(4.95);
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bio, setBio] = useState('');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingTutor(null);
    setFullName('');
    setShortName('');
    setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setSelectedSubjects(['Математика (профиль)']);
    setEducation('МГУ им. М.В. Ломоносова');
    setExperienceYears(6);
    setHourlyRate(2200);
    setRating(4.95);
    setAvailableDays([1, 2, 3, 4, 5]);
    setBio('Преподаватель высшей категории с опытом подготовки к экзаменам.');
    setAchievements([
      'Подготовил более 20 учеников на 90+ баллов на ЕГЭ',
      'Эксперт предметной комиссии по проверке работ',
    ]);
    setIsCreating(true);
  };

  const handleStartEdit = (tutor: Tutor) => {
    setEditingTutor(tutor);
    setFullName(tutor.name);
    setShortName(tutor.shortName);
    setAvatar(tutor.avatar);
    setSelectedSubjects(tutor.subjects);
    setEducation(tutor.education || '');
    setExperienceYears(tutor.experienceYears || 5);
    setHourlyRate(tutor.hourlyRate || 2000);
    setRating(tutor.rating);
    setAvailableDays(tutor.availableDays);
    setBio(tutor.bio || '');
    setAchievements(tutor.achievements || []);
    setIsCreating(true);
  };

  const handleToggleDay = (dayId: number) => {
    if (availableDays.includes(dayId)) {
      setAvailableDays(availableDays.filter(d => d !== dayId));
    } else {
      setAvailableDays([...availableDays, dayId].sort());
    }
  };

  const handleToggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects([...selectedSubjects, customSubject.trim()]);
      setCustomSubject('');
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const finalShortName = shortName.trim() || fullName.trim().split(' ').slice(0, 2).join(' ');

    const tutorData: Tutor = {
      id: editingTutor ? editingTutor.id : `tutor-${Date.now()}`,
      name: fullName.trim(),
      shortName: finalShortName,
      avatar: avatar.trim() || PRESET_AVATARS[0],
      subjects: selectedSubjects.length > 0 ? selectedSubjects : ['Общий'],
      color: editingTutor ? editingTutor.color : 'indigo',
      phone: editingTutor ? editingTutor.phone : '+7 (999) 000-00-00',
      telegram: editingTutor ? editingTutor.telegram : '@tutor',
      rating,
      activeStudents: editingTutor ? editingTutor.activeStudents : 0,
      availableDays: availableDays.length > 0 ? availableDays : [1, 2, 3, 4, 5],
      bio: bio.trim(),
      salesConversionRate: editingTutor ? editingTutor.salesConversionRate : 80,
      education: education.trim(),
      experienceYears,
      achievements,
      hourlyRate,
    };

    if (editingTutor) {
      onUpdateTutor(tutorData);
    } else {
      onAddTutor(tutorData);
    }

    setIsCreating(false);
    setEditingTutor(null);
  };

  const filteredTutors = tutors.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Преподаватели онлайн-школы ({tutors.length})
              </h3>
              <p className="text-xs text-slate-500">
                Управление составом, предметами, квалификацией и пожизненными заслугами
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isCreating && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus size={14} />
                <span>+ Добавить учителя</span>
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
            /* Tutor Form (Create / Edit) */
            <form onSubmit={handleSubmitForm} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingTutor ? `Редактирование профиля: ${editingTutor.shortName}` : 'Новый преподаватель'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Заполните информацию о квалификации, опыте и жизненных достижениях
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Вернуться к списку
                </button>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ФИО преподавателя <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Рубцова Диана Сергеевна"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Краткое имя для шахматки
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={e => setShortName(e.target.value)}
                    placeholder="Диана Рубцова"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Фотография / Аватар
                </label>
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="avatar option"
                      onClick={() => setAvatar(url)}
                      className={`w-12 h-12 rounded-xl object-cover cursor-pointer transition-all ${
                        avatar === url
                          ? 'ring-3 ring-indigo-600 scale-105 shadow-sm'
                          : 'opacity-70 hover:opacity-100 ring-1 ring-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="Или вставьте прямую ссылку на фото"
                  className="w-full mt-2 text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              {/* Education, Experience & Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Образование / ВУЗ / Категория
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    placeholder="МГУ им. Ломоносова, высшая категория"
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Стаж преподавания (лет)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={experienceYears}
                    onChange={e => setExperienceYears(Number(e.target.value))}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Рейтинг (от 1.0 до 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={e => setRating(Number(e.target.value))}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Преподаваемые предметы:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_SUBJECTS.map(subj => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleToggleSubject(subj)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {subj}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    placeholder="Добавить свой предмет..."
                    className="text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Рабочие дни недели:
                </label>
                <div className="flex items-center space-x-2">
                  {DAYS.map(day => {
                    const isSelected = availableDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleDay(day.id)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lifelong Achievements & Qualifications Section */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Award size={16} className="text-amber-600" />
                  <span>Заслуги и достижения за жизнь (регалии, победы учеников, награды):</span>
                </div>

                {achievements.length > 0 ? (
                  <div className="space-y-1.5">
                    {achievements.map((ach, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 text-xs text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-start space-x-2 flex-1 pr-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{ach}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAchievement(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Удалить пункт"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-700/80 italic">
                    Заслуги пока не добавлены. Добавьте награды, дипломы и результаты выпускников.
                  </p>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={e => setNewAchievement(e.target.value)}
                    placeholder="Например: Победитель Всероссийского конкурса «Учитель года 2023»..."
                    className="flex-1 text-xs font-medium px-3 py-2 bg-white border border-amber-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAchievement}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    + Добавить пункт
                  </button>
                </div>
              </div>

              {/* Bio summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Краткое описание методики и подхода
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Авторская методика подготовки к экзаменам, индивидуальный план..."
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <Check size={14} />
                  <span>{editingTutor ? 'Сохранить изменения' : 'Создать преподавателя'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tutors List */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Поиск по имени или предмету..."
                    className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTutors.map(tutor => (
                  <div
                    key={tutor.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start space-x-3">
                        <img
                          src={tutor.avatar}
                          alt={tutor.shortName}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {tutor.name}
                            </h4>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{tutor.rating}</span>
                            </span>
                          </div>

                          <p className="text-xs text-indigo-600 font-semibold truncate mt-0.5">
                            {tutor.subjects.join(', ')}
                          </p>

                          {tutor.education && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center space-x-1">
                              <GraduationCap size={12} className="shrink-0 text-slate-400" />
                              <span>{tutor.education}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lifelong Achievements list preview */}
                      {tutor.achievements && tutor.achievements.length > 0 && (
                        <div className="mt-3 p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                          <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                            <Award size={12} className="text-amber-600" />
                            <span>Заслуги и регалии:</span>
                          </div>
                          <ul className="text-[11px] text-slate-700 space-y-0.5 pl-3 list-disc list-outside">
                            {tutor.achievements.slice(0, 3).map((ach, i) => (
                              <li key={i} className="line-clamp-1">
                                {ach}
                              </li>
                            ))}
                            {tutor.achievements.length > 3 && (
                              <li className="text-slate-400 list-none text-[10px]">
                                + еще {tutor.achievements.length - 3} достижений
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer stats and Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                      <div className="text-slate-500 text-[11px]">
                        Стаж: <strong className="text-slate-700">{tutor.experienceYears || 5} лет</strong> • Учеников: <strong className="text-slate-700">{tutor.activeStudents}</strong>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(tutor)}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <Edit3 size={13} />
                          <span>Изменить</span>
                        </button>

                        {confirmingDeleteId === tutor.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTutor(tutor.id);
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
                            onClick={() => setConfirmingDeleteId(tutor.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Удалить преподавателя"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
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
