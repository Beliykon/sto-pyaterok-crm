import React, { useState, useEffect, useMemo } from 'react';
import { Tutor, Appointment, Manager, CurrentUser, UserRole, TrialSalesResult, TutorSlot } from './lib/types';
import { TUTORS, INITIAL_MANAGERS, getInitialAppointments } from './lib/mockData';
import ScheduleGrid from './components/ScheduleGrid';
import BookingsList from './components/BookingsList';
import FastBookingModal from './components/FastBookingModal';
import LessonDetailModal from './components/LessonDetailModal';
import RescheduleModal from './components/RescheduleModal';
import DatePickerModal from './components/DatePickerModal';
import TutorManagerModal from './components/TutorManagerModal';
import ManagerModal from './components/ManagerModal';
import AuthModal from './components/AuthModal';
import TutorSlotsModal from './components/TutorSlotsModal';
import AnalyticsModal from './components/AnalyticsModal';
import SyncModal from './components/SyncModal';
import { getRuWeekRange } from './lib/dateUtils';
import { 
  startOfWeek, 
  addDays, 
  format, 
  isSameDay 
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Grid3X3, 
  List, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Search,
  CheckCircle2,
  X,
  User,
  Sparkles,
  Users,
  Briefcase,
  ShieldCheck,
  Lock,
  Award,
  Crown,
  TrendingUp,
  Zap,
  Target,
  GraduationCap,
  Filter,
  Share2,
  Cloud,
  Wifi,
  BookOpen
} from 'lucide-react';
import { subscribeToSchoolState, pushSchoolStateToCloud, isFirestoreQuotaExhausted } from './lib/syncService';
import { 
  matchesGradeFilter, 
  matchesGoalFilter, 
  matchesLessonTypeFilter, 
  tutorMatchesFilters 
} from './lib/filterUtils';

const SUBJECT_PILLS = [
  { id: 'all', label: 'Все предметы' },
  { id: 'математика', label: 'Математика' },
  { id: 'русский', label: 'Русский язык' },
  { id: 'обществознание', label: 'Обществознание' },
  { id: 'английский', label: 'Английский' },
  { id: 'физика', label: 'Физика' },
  { id: 'химия', label: 'Химия / Биология' },
  { id: 'история', label: 'История' },
];

const GRADE_PILLS = [
  { id: 'all', label: 'Все классы' },
  { id: '1-4', label: '1–4 кл' },
  { id: '5-8', label: '5–8 кл' },
  { id: '9', label: '9 кл (ОГЭ)' },
  { id: '10', label: '10 кл' },
  { id: '11', label: '11 кл (ЕГЭ)' },
];

const GOAL_PILLS = [
  { id: 'all', label: 'Все цели' },
  { id: 'ege', label: '🎯 ЕГЭ' },
  { id: 'oge', label: '📘 ОГЭ' },
  { id: 'olympiad', label: '🏆 Олимпиады' },
  { id: 'grades', label: '📈 Успеваемость' },
];

export default function App() {
  // Current logged in user (Admin, Manager, or Tutor)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const saved = localStorage.getItem('stopyaterok_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    return {
      id: 'admin',
      name: 'Руководитель (Администратор)',
      role: 'admin',
    };
  });

  const [selectedTutorId, setSelectedTutorId] = useState<string>(() => {
    return currentUser.tutorId || TUTORS[0].id;
  });

  // Active view: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected date & filters (Subject, Grade, Goal, Type)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Tutors (persisted to localStorage)
  const [tutors, setTutors] = useState<Tutor[]>(() => {
    const saved = localStorage.getItem('stopyaterok_tutors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved tutors', e);
      }
    }
    return TUTORS;
  });

  // Managers (persisted to localStorage)
  const [managers, setManagers] = useState<Manager[]>(() => {
    const saved = localStorage.getItem('stopyaterok_managers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved managers', e);
      }
    }
    return INITIAL_MANAGERS;
  });

  // Appointments (persisted to localStorage)
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('stopyaterok_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved appointments', e);
      }
    }
    return getInitialAppointments();
  });

  // Tutor Open Windows (Slots) State
  const [openSlots, setOpenSlots] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('stopyaterok_open_slots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse open slots', e);
      }
    }
    // Initialize default available windows across current and next week
    const initial: Record<string, boolean> = {};
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let d = 0; d < 14; d++) {
      const dayDate = addDays(weekStart, d);
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const dayOfWeek = dayDate.getDay() === 0 ? 7 : dayDate.getDay();

      TUTORS.forEach(t => {
        if (t.availableDays.includes(dayOfWeek)) {
          ['10:00', '14:00', '16:00', '18:00', '19:00'].forEach(time => {
            initial[`${t.id}_${dayStr}_${time}`] = true;
          });
        }
      });
    }
    return initial;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('stopyaterok_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('stopyaterok_tutors', JSON.stringify(tutors));
  }, [tutors]);

  useEffect(() => {
    localStorage.setItem('stopyaterok_managers', JSON.stringify(managers));
  }, [managers]);

  useEffect(() => {
    localStorage.setItem('stopyaterok_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('stopyaterok_open_slots', JSON.stringify(openSlots));
  }, [openSlots]);

  // Real-time Cloud Synchronization status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>(
    isFirestoreQuotaExhausted() ? 'offline' : 'connected'
  );
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    isFirestoreQuotaExhausted() ? 'Локальный режим' : 'Онлайн'
  );
  const isInitialSync = React.useRef(true);
  const isRemoteUpdate = React.useRef(false);
  const lastPushedStateRef = React.useRef<string>('');

  // 1. Subscribe to Cloud Updates from other team members in real-time
  useEffect(() => {
    if (isFirestoreQuotaExhausted()) {
      setCloudSyncStatus('offline');
      setLastSyncTime('Локально');
      return;
    }

    const unsubscribe = subscribeToSchoolState(
      (data) => {
        if (data) {
          isRemoteUpdate.current = true;
          if (data.appointments && Array.isArray(data.appointments)) {
            setAppointments(data.appointments);
          }
          if (data.openSlots && typeof data.openSlots === 'object') {
            setOpenSlots(data.openSlots);
          }
          if (data.tutors && Array.isArray(data.tutors)) {
            setTutors(data.tutors);
          }
          if (data.managers && Array.isArray(data.managers)) {
            setManagers(data.managers);
          }
          setCloudSyncStatus('connected');
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      },
      (err) => {
        // If quota exceeded or network unavailable, switch to offline mode quietly
        setCloudSyncStatus('offline');
        setLastSyncTime('Локально');
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Automatically push local changes to Cloud so colleagues see it (with loop prevention)
  useEffect(() => {
    if (isInitialSync.current) {
      isInitialSync.current = false;
      lastPushedStateRef.current = JSON.stringify({ appointments, openSlots, tutors, managers });
      return;
    }

    // If change was received from remote sync, do not echo it back
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      lastPushedStateRef.current = JSON.stringify({ appointments, openSlots, tutors, managers });
      return;
    }

    // Do not write if Firestore quota is exhausted
    if (isFirestoreQuotaExhausted()) {
      setCloudSyncStatus('offline');
      return;
    }

    const currentState = JSON.stringify({ appointments, openSlots, tutors, managers });
    if (currentState === lastPushedStateRef.current) {
      return;
    }
    lastPushedStateRef.current = currentState;

    setCloudSyncStatus('syncing');
    pushSchoolStateToCloud(
      { appointments, openSlots, tutors, managers },
      currentUser.name
    );
    const t = setTimeout(() => {
      if (!isFirestoreQuotaExhausted()) {
        setCloudSyncStatus('connected');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('offline');
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [appointments, openSlots, tutors, managers, currentUser.name]);

  // Management modals state
  const [isTutorManagerOpen, setIsTutorManagerOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [tutorForSlotsModal, setTutorForSlotsModal] = useState<Tutor | null>(null);

  // Booking & Lesson modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{
    tutorId?: string;
    date?: string;
    time?: string;
  }>({});
  const [selectedLesson, setSelectedLesson] = useState<Appointment | null>(null);
  const [rescheduleLesson, setRescheduleLesson] = useState<Appointment | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 3500);
  };

  // Convert openSlots Record to Array for TutorSlotsModal
  const currentOpenSlotsArray: TutorSlot[] = useMemo(() => {
    return Object.entries(openSlots)
      .filter(([_, isOpen]) => isOpen)
      .map(([key]) => {
        const [tutorId, date, time] = key.split('_');
        return {
          id: `slot-${tutorId}-${date}-${time}`,
          tutorId,
          date,
          time,
          isBooked: false,
        };
      });
  }, [openSlots]);

  // Batch update slots from TutorSlotsModal (scoped to the active week)
  const handleBatchSetSlots = (newSlotsForWeek: TutorSlot[], weekDateStrs: string[]) => {
    if (!tutorForSlotsModal) return;
    const targetTutorId = tutorForSlotsModal.id;

    setOpenSlots(prev => {
      const next = { ...prev };
      // Remove only slots belonging to this tutor for the current week's dates
      Object.keys(next).forEach(k => {
        const [tId, d] = k.split('_');
        if (tId === targetTutorId && weekDateStrs.includes(d)) {
          delete next[k];
        }
      });
      // Add new slots for this week
      newSlotsForWeek.forEach(s => {
        if (s.tutorId === targetTutorId) {
          next[`${s.tutorId}_${s.date}_${s.time}`] = true;
        }
      });
      return next;
    });

    showToast(`Свободные слоты для ${tutorForSlotsModal.shortName} сохранены`);
  };

  // Free slots counter for the selected date taking filters into account
  const freeSlotsCount = useMemo(() => {
    const dayStr = format(selectedDate, 'yyyy-MM-dd');
    let count = 0;
    const eligibleTutors = tutors.filter(t => {
      if (currentUser.role === 'tutor' && currentUser.tutorId && t.id !== currentUser.tutorId) {
        return false;
      }
      return tutorMatchesFilters(
        t,
        {
          subject: selectedSubject,
          grade: selectedGradeFilter,
          goal: selectedGoalFilter,
          type: selectedTypeFilter,
        },
        appointments
      );
    });

    const dayAppointments = appointments.filter(
      a => a.date === dayStr && a.status !== 'cancelled'
    );

    eligibleTutors.forEach(t => {
      ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].forEach(time => {
        const key = `${t.id}_${dayStr}_${time}`;
        const isSlotOpen = !!openSlots[key];
        const isBooked = dayAppointments.some(a => a.tutorId === t.id && a.startTime === time);
        if (isSlotOpen && !isBooked) {
          count++;
        }
      });
    });

    return count;
  }, [selectedDate, selectedSubject, selectedGradeFilter, selectedGoalFilter, selectedTypeFilter, tutors, appointments, openSlots, currentUser]);

  // Handle Tutor CRUD
  const handleAddTutor = (newTutorData: Omit<Tutor, 'id'>) => {
    const newTutor: Tutor = {
      ...newTutorData,
      id: `tutor-${Date.now()}`,
    };
    setTutors(prev => [...prev, newTutor]);
    showToast(`Преподаватель ${newTutor.name} успешно добавлен в школу`);
  };

  const handleUpdateTutor = (updated: Tutor) => {
    setTutors(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    showToast(`Профиль преподавателя ${updated.shortName} обновлен`);
  };

  const handleDeleteTutor = (id: string) => {
    const target = tutors.find(t => t.id === id);
    setTutors(prev => prev.filter(t => t.id !== id));
    showToast(`Преподаватель ${target?.name || ''} удален из системы`);
  };

  // Handle Manager CRUD
  const handleAddManager = (newManagerData: Omit<Manager, 'id'>) => {
    const newManager: Manager = {
      ...newManagerData,
      id: `mgr-${Date.now()}`,
    };
    setManagers(prev => [...prev, newManager]);
    showToast(`Менеджер ${newManager.name} успешно добавлен`);
  };

  const handleUpdateManager = (updated: Manager) => {
    setManagers(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    showToast(`Данные менеджера ${updated.name} сохранены`);
  };

  const handleDeleteManager = (id: string) => {
    const target = managers.find(m => m.id === id);
    setManagers(prev => prev.filter(m => m.id !== id));
    showToast(`Менеджер ${target?.name || ''} удален`);
  };

  // Switch role / Auth handler
  const handleSelectUser = (user: CurrentUser) => {
    setCurrentUser(user);
    if (user.role === 'tutor' && user.tutorId) {
      setSelectedTutorId(user.tutorId);
    }
    showToast(`Вы вошли как: ${user.name}`);
  };

  // Week navigation
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

  const handlePrevWeek = () => {
    setSelectedDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Open booking modal
  const handleOpenBooking = (tutorId?: string, dateStr?: string, timeStr?: string) => {
    if (dateStr && timeStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [startH, startM] = timeStr.split(':').map(Number);
      const chosenDateTime = new Date(year, month - 1, day, startH, startM, 0, 0);
      if (chosenDateTime.getTime() < Date.now()) {
        showToast('Невозможно записать, т.к. время уже прошло');
        return;
      }
    }

    setBookingPrefill({
      tutorId: tutorId || (currentUser.role === 'tutor' ? currentUser.tutorId : undefined),
      date: dateStr || format(selectedDate, 'yyyy-MM-dd'),
      time: timeStr || '11:00',
    });
    setIsBookingOpen(true);
  };

  // Toggle single slot
  const handleToggleSlot = (tutorId: string, dateStr: string, hour: string) => {
    const key = `${tutorId}_${dateStr}_${hour}`;
    setOpenSlots(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        showToast('Окно закрыто');
      } else {
        next[key] = true;
        showToast('Свободное окно открыто для МОП');
      }
      return next;
    });
  };

  // Create Appointment
  const handleCreateAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => {
    // Validate past time
    const [year, month, day] = data.date.split('-').map(Number);
    const [startH, startM] = data.startTime.split(':').map(Number);
    const chosenDateTime = new Date(year, month - 1, day, startH, startM, 0, 0);
    if (chosenDateTime.getTime() < Date.now()) {
      showToast('Невозможно записать, т.к. время уже прошло');
      return;
    }

    const newAppointment: Appointment = {
      ...data,
      id: `app-${Date.now()}`,
      status: 'confirmed',
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
    };

    setAppointments(prev => [...prev, newAppointment]);

    // Close the slot
    const slotKey = `${data.tutorId}_${data.date}_${data.startTime}`;
    setOpenSlots(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });

    showToast(`Ученик ${data.studentName} успешно записан к ${data.tutorName}`);
  };

  // Reschedule Appointment (Drag & Drop or Modal)
  const handleReschedule = (
    appointmentId: string,
    newTutorId: string,
    newDate: string,
    newStartTime: string
  ) => {
    const targetTutor = tutors.find(t => t.id === newTutorId);
    if (!targetTutor) return;

    // Calculate new end time (+1 hour)
    const [h, m] = newStartTime.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    const newEndTime = `${endH}:${String(m).padStart(2, '0')}`;

    setAppointments(prev =>
      prev.map(app => {
        if (app.id === appointmentId) {
          return {
            ...app,
            tutorId: targetTutor.id,
            tutorName: targetTutor.name,
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
          };
        }
        return app;
      })
    );

    // Free the new slot
    const newSlotKey = `${newTutorId}_${newDate}_${newStartTime}`;
    setOpenSlots(prev => {
      const next = { ...prev };
      delete next[newSlotKey];
      return next;
    });

    showToast(`Урок перенесён на ${newDate} в ${newStartTime}`);
  };

  // Mark Completed
  const handleMarkCompleted = (appointmentId: string, recommendation?: string) => {
    setAppointments(prev =>
      prev.map(app => {
        if (app.id === appointmentId) {
          return {
            ...app,
            status: 'completed',
            postLessonFeedback: {
              completed: true,
              studentLevel: app.postLessonFeedback?.studentLevel || 'Средний',
              readyToBuy: app.postLessonFeedback?.readyToBuy || 'high',
              recommendation: recommendation || app.postLessonFeedback?.recommendation || 'Рекомендован пакет занятий',
              notes: app.postLessonFeedback?.notes,
              submittedAt: new Date().toISOString(),
            },
          };
        }
        return app;
      })
    );
    showToast('Урок отмечен как проведённый');
  };

  // Mark Absent
  const handleMarkAbsent = (appointmentId: string, notes?: string) => {
    setAppointments(prev =>
      prev.map(app => {
        if (app.id === appointmentId) {
          return {
            ...app,
            status: 'cancelled',
            notes: notes || 'Неявка ученика',
          };
        }
        return app;
      })
    );
    showToast('Зафиксирована неявка ученика');
  };

  // Save Trial Outcome (Point 4: Purchases and Declines)
  const handleSaveTrialResult = (appointmentId: string, result: TrialSalesResult) => {
    setAppointments(prev =>
      prev.map(app => {
        if (app.id === appointmentId) {
          return {
            ...app,
            trialResult: result,
            status: result.outcome === 'no_show' ? 'cancelled' : 'completed',
          };
        }
        return app;
      })
    );

    if (result.outcome === 'purchased') {
      showToast(`Оплата ${(result.purchaseAmount || 27200).toLocaleString('ru-RU')} ₽ зафиксирована в аналитике! 💰`);
    } else if (result.outcome === 'declined') {
      showToast('Отказ после пробного зафиксирован в воронке');
    } else if (result.outcome === 'thinking') {
      showToast('Статус «Клиент думает» сохранен');
    } else {
      showToast('Результат пробного урока обновлен');
    }
  };

  // Update Appointment (Edit lesson details)
  const handleUpdateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev =>
      prev.map(app => (app.id === updatedAppointment.id ? updatedAppointment : app))
    );
    setSelectedLesson(updatedAppointment);
    showToast('Данные урока успешно обновлены ✓');
  };

  // Cancel Appointment
  const handleCancelAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(app => app.id !== appointmentId));
    showToast('Запись отменена');
  };

  // Restore Database Backup
  const handleRestoreData = (data: {
    appointments?: Appointment[];
    tutors?: Tutor[];
    managers?: Manager[];
    openSlots?: Record<string, boolean>;
  }) => {
    if (data.appointments && Array.isArray(data.appointments)) {
      setAppointments(data.appointments);
    }
    if (data.tutors && Array.isArray(data.tutors)) {
      setTutors(data.tutors);
    }
    if (data.managers && Array.isArray(data.managers)) {
      setManagers(data.managers);
    }
    if (data.openSlots && typeof data.openSlots === 'object') {
      setOpenSlots(data.openSlots);
    }
    showToast('База данных успешно восстановлена!');
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    localStorage.removeItem('stopyaterok_appointments');
    localStorage.removeItem('stopyaterok_tutors');
    localStorage.removeItem('stopyaterok_managers');
    localStorage.removeItem('stopyaterok_open_slots');

    setAppointments(getInitialAppointments());
    setTutors(TUTORS);
    setManagers(INITIAL_MANAGERS);

    const initial: Record<string, boolean> = {};
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let d = 0; d < 14; d++) {
      const dayDate = addDays(weekStart, d);
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const dayOfWeek = dayDate.getDay() === 0 ? 7 : dayDate.getDay();

      TUTORS.forEach(t => {
        if (t.availableDays.includes(dayOfWeek)) {
          ['10:00', '14:00', '16:00', '18:00', '19:00'].forEach(time => {
            initial[`${t.id}_${dayStr}_${time}`] = true;
          });
        }
      });
    }
    setOpenSlots(initial);
    showToast('База данных сброшена к исходным демо-данным');
  };

  // Check if any extra filter is active
  const hasActiveFilters = 
    selectedSubject !== 'all' || 
    selectedGradeFilter !== 'all' || 
    selectedGoalFilter !== 'all' ||
    selectedTypeFilter !== 'all';

  const resetAllFilters = () => {
    setSelectedSubject('all');
    setSelectedGradeFilter('all');
    setSelectedGoalFilter('all');
    setSelectedTypeFilter('all');
    showToast('Фильтры сброшены');
  };

  // Filtered appointments for list view / search
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.status === 'cancelled') return false;
      if (selectedSubject !== 'all' && !app.subject.toLowerCase().includes(selectedSubject.toLowerCase())) {
        return false;
      }
      if (!matchesGradeFilter(app.grade, selectedGradeFilter)) {
        return false;
      }
      if (!matchesGoalFilter(app, selectedGoalFilter)) {
        return false;
      }
      if (!matchesLessonTypeFilter(app, selectedTypeFilter)) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          app.studentName.toLowerCase().includes(term) ||
          app.tutorName.toLowerCase().includes(term) ||
          app.parentPhone.includes(term) ||
          app.subject.toLowerCase().includes(term) ||
          (app.notes && app.notes.toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });
  }, [appointments, selectedSubject, selectedGradeFilter, selectedGoalFilter, selectedTypeFilter, searchTerm]);

  // Current logged in tutor object if tutor
  const currentTutor = useMemo(() => {
    if (currentUser.role === 'tutor' && currentUser.tutorId) {
      return tutors.find(t => t.id === currentUser.tutorId) || tutors[0];
    }
    return tutors[0];
  }, [currentUser, tutors]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col antialiased">
      {/* Anti-poaching notification banner if role is tutor */}
      {currentUser.role === 'tutor' && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck size={15} className="shrink-0" />
              <span>
                <strong>Защита клиентской базы школы:</strong> Вы вошли как <u>{currentUser.name}</u>. Контакты учеников замаскированы.
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTutorForSlotsModal(currentTutor)}
                className="text-[11px] font-bold bg-white text-amber-900 px-2.5 py-0.5 rounded shadow-2xs hover:bg-amber-50 transition-colors flex items-center space-x-1"
              >
                <Zap size={11} />
                <span>Заполнить мои слоты</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors"
              >
                Сменить профиль
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs">
              5
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">
                  СТО ПЯТЁРОК
                </span>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  CRM & График
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Запись на вводные уроки, слоты учителей и аналитика продаж
              </p>
            </div>
          </div>

          {/* View Switcher: Grid vs List */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 size={14} />
              <span>Шахматка</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={14} />
              <span>Список записей</span>
            </button>
          </div>

          {/* Free Slots Counter */}
          <div 
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-bold shadow-2xs"
            title="Количество свободных открытых слотов для записи на выбранный день"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isSameDay(selectedDate, new Date()) ? 'Свободно сегодня:' : 'Свободно окон:'}{' '}
              <strong className="text-emerald-950 font-black text-sm">{freeSlotsCount}</strong>
            </span>
          </div>

          {/* Actions: Analytics, Teachers, Managers, Auth Profile */}
          <div className="flex items-center space-x-2">
            {/* Point 4: Analytics Button */}
            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Аналитика конверсии пробных, продаж и отказов"
            >
              <TrendingUp size={14} />
              <span>Аналитика продаж</span>
            </button>

            {/* Point 1: Tutor Quick Slots Button if tutor */}
            {currentUser.role === 'tutor' && (
              <button
                type="button"
                onClick={() => setTutorForSlotsModal(currentTutor)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                title="Управление своими свободными окнами"
              >
                <Zap size={14} className="text-indigo-600" />
                <span className="hidden sm:inline">Мои слоты</span>
              </button>
            )}

            {/* Manage Teachers Button */}
            <button
              type="button"
              onClick={() => setIsTutorManagerOpen(true)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200/60"
              title="Управление составом преподавателей, заслугами и ставками"
            >
              <Users size={14} className="text-indigo-600" />
              <span className="hidden sm:inline">Учителя ({tutors.length})</span>
            </button>

            {/* Manage Managers Button (Admin only) */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setIsManagerModalOpen(true)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200/60 hidden md:flex"
                title="Управление сотрудниками отдела продаж"
              >
                <Briefcase size={14} className="text-blue-600" />
                <span>Менеджеры ({managers.length})</span>
              </button>
            )}

            {/* Live Cloud Sync Badge */}
            <button
              type="button"
              onClick={() => setIsSyncOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border cursor-pointer ${
                cloudSyncStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="Статус синхронизации базы данных (нажмите для подробностей)"
            >
              <Cloud size={13} className={cloudSyncStatus === 'connected' ? 'text-emerald-600' : cloudSyncStatus === 'syncing' ? 'text-blue-600' : 'text-amber-600'} />
              <span className="hidden sm:inline">
                {cloudSyncStatus === 'syncing'
                  ? 'Синхронизация...'
                  : cloudSyncStatus === 'connected'
                  ? `Общая база • ${lastSyncTime}`
                  : 'База в браузере (локально)'}
              </span>
            </button>

            {/* Sync & Backup Button */}
            <button
              type="button"
              onClick={() => setIsSyncOpen(true)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200/60"
              title="Резервное сохранение базы (JSON), экспорт расписания (iCal) и Telegram"
            >
              <Share2 size={14} className="text-emerald-600" />
              <span className="hidden lg:inline">Сохранение / Синхронизация</span>
            </button>

            {/* Profile / Auth Button */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs border ${
                currentUser.role === 'admin'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : currentUser.role === 'manager'
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Сменить роль (Администратор / Отдел продаж / Преподаватель)"
            >
              {currentUser.role === 'admin' ? (
                <Crown size={14} className="text-amber-600" />
              ) : currentUser.role === 'manager' ? (
                <Briefcase size={14} className="text-indigo-600" />
              ) : (
                <User size={14} className="text-emerald-600" />
              )}
              <span className="max-w-[120px] truncate">
                {currentUser.name}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Sub-header Controls */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Row 1: Week Navigator + Search + Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Center Week Navigator & 1-2 Year Calendar Button */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors"
                  title="Предыдущая неделя"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors"
                  title="Следующая неделя"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Clickable week label */}
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900 px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                title="Нажмите, чтобы открыть календарь на 1–2 года вперед"
              >
                <CalendarIcon size={14} className="text-indigo-600" />
                <span>{getRuWeekRange(weekStart)}</span>
              </button>

              {/* Dedicated Calendar Button */}
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                title="Выбор месяца и года (2026–2028)"
              >
                <CalendarIcon size={14} />
                <span>Календарь (1–2 года)</span>
              </button>
            </div>

            {/* Quick search input and Add Booking button */}
            <div className="flex items-center space-x-2 flex-1 sm:flex-initial justify-end">
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Поиск по ученику, запросу МОП..."
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 flex-shrink-0"
              >
                <Plus size={15} />
                <span>+ Записать на пробное</span>
              </button>
            </div>
          </div>

          {/* Row 2: Point 3 - Filters by Subject, Grade, and Goal */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            {/* Filter pills: Subjects */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                <span>Предмет:</span>
              </span>
              {SUBJECT_PILLS.map(p => {
                const isSelected = selectedSubject === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedSubject(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Filter pills: Point 3 - Classes & Goals (ЕГЭ, ОГЭ, Олимпиады) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                {/* Lesson Type */}
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                    <BookOpen size={12} />
                    <span>Тип:</span>
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'trial', label: '🔵 Пробные' },
                      { id: 'regular', label: '🟣 Регулярные' },
                    ].map(t => {
                      const isSelected = selectedTypeFilter === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTypeFilter(t.id)}
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grades */}
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                    <GraduationCap size={12} />
                    <span>Класс:</span>
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                    {GRADE_PILLS.map(g => {
                      const isSelected = selectedGradeFilter === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGradeFilter(g.id)}
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-white text-indigo-900 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goals */}
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                    <Target size={12} />
                    <span>Цель:</span>
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                    {GOAL_PILLS.map(goal => {
                      const isSelected = selectedGoalFilter === goal.id;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setSelectedGoalFilter(goal.id)}
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {goal.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reset active filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <X size={12} />
                  <span>Сбросить фильтры</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col min-h-0">
        {viewMode === 'grid' ? (
          <div className="flex-1 min-h-[620px]">
            <ScheduleGrid
              tutors={tutors}
              appointments={appointments}
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              weekDays={weekDays}
              role={currentUser.role}
              selectedTutorId={currentUser.role === 'tutor' ? selectedTutorId : undefined}
              openSlots={openSlots}
              onToggleSlot={handleToggleSlot}
              onOpenBooking={handleOpenBooking}
              onOpenLessonDetail={app => setSelectedLesson(app)}
              onRescheduleAppointment={handleReschedule}
              selectedSubject={selectedSubject}
              selectedGradeFilter={selectedGradeFilter}
              selectedGoalFilter={selectedGoalFilter}
              selectedTypeFilter={selectedTypeFilter}
              onOpenTutorSlotsModal={tutor => setTutorForSlotsModal(tutor)}
            />
          </div>
        ) : (
          <div className="flex-1">
            <BookingsList
              appointments={filteredAppointments}
              tutors={tutors}
              onCancelAppointment={handleCancelAppointment}
              onOpenBooking={() => handleOpenBooking()}
              onOpenLessonDetail={app => setSelectedLesson(app)}
              role={currentUser.role}
              currentTutorId={currentUser.role === 'tutor' ? selectedTutorId : undefined}
              selectedGradeFilter={selectedGradeFilter}
              selectedGoalFilter={selectedGoalFilter}
              onSelectGradeFilter={g => setSelectedGradeFilter(g)}
              onSelectGoalFilter={g => setSelectedGoalFilter(g)}
            />
          </div>
        )}
      </main>

      {/* 4. Modals */}
      {/* Fast Booking Modal (MOP request: Name, Grade, Goal, Request) */}
      <FastBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBook={handleCreateAppointment}
        tutors={tutors}
        prefillTutorId={bookingPrefill.tutorId}
        prefillDate={bookingPrefill.date}
        prefillTime={bookingPrefill.time}
        existingAppointments={appointments}
      />

      {/* Lesson Detail Card (Trial Result, MOP Request, Anti-Poaching, Edit lesson) */}
      <LessonDetailModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        appointment={selectedLesson}
        onMarkCompleted={handleMarkCompleted}
        onMarkAbsent={handleMarkAbsent}
        onOpenReschedule={app => setRescheduleLesson(app)}
        onCancelAppointment={handleCancelAppointment}
        onSaveTrialResult={handleSaveTrialResult}
        onUpdateAppointment={handleUpdateAppointment}
        tutors={tutors}
        role={currentUser.role}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleLesson}
        onClose={() => setRescheduleLesson(null)}
        appointment={rescheduleLesson}
        tutors={tutors}
        onReschedule={handleReschedule}
      />

      {/* 1-2 Year Calendar (2026-2028) */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={d => setSelectedDate(d)}
        appointments={appointments}
      />

      {/* Tutor Profile, Achievements, and Roster Modal */}
      <TutorManagerModal
        isOpen={isTutorManagerOpen}
        onClose={() => setIsTutorManagerOpen(false)}
        tutors={tutors}
        onAddTutor={handleAddTutor}
        onUpdateTutor={handleUpdateTutor}
        onDeleteTutor={handleDeleteTutor}
      />

      {/* Manager Roster Modal */}
      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        managers={managers}
        onAddManager={handleAddManager}
        onUpdateManager={handleUpdateManager}
        onDeleteManager={handleDeleteManager}
      />

      {/* Role-based Authorization Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        tutors={tutors}
        managers={managers}
      />

      {/* Point 1: Tutor Free Slots Modal */}
      {tutorForSlotsModal && (
        <TutorSlotsModal
          isOpen={!!tutorForSlotsModal}
          onClose={() => setTutorForSlotsModal(null)}
          tutor={tutorForSlotsModal}
          weekStart={weekStart}
          openSlots={currentOpenSlotsArray}
          appointments={appointments}
          onToggleSlot={handleToggleSlot}
          onBatchSetSlots={handleBatchSetSlots}
        />
      )}

      {/* Point 4: Trial Sales & Outcomes Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        appointments={appointments}
        tutors={tutors}
      />

      {/* Sync with Calendar & Telegram Modal */}
      <SyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        appointments={appointments}
        tutors={tutors}
        managers={managers}
        openSlots={openSlots}
        onRestoreData={handleRestoreData}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-lg border border-slate-700 flex items-center space-x-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
