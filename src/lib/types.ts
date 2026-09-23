export type Role = 'manager' | 'tutor';
export type UserRole = 'admin' | 'manager' | 'tutor';

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'admin';
  active: boolean;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  tutorId?: string;
  managerId?: string;
  avatar?: string;
}

export type LessonType = 'trial' | 'regular' | 'exam_prep' | 'consultation';
export type LessonStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';
export type ConfirmationStatus = 'unconfirmed' | 'reminded' | 'confirmed';

export type LearningGoal = 'ege' | 'oge' | 'olympiad' | 'grades' | 'admission' | 'other';

export type TrialOutcome = 'purchased' | 'declined' | 'thinking' | 'no_show';
export type DeclineReason = 'expensive' | 'tutor_mismatch' | 'competitor' | 'changed_mind' | 'schedule_conflict' | 'other';

export interface TrialSalesResult {
  outcome: TrialOutcome;
  purchasedPackage?: '8_lessons' | '16_lessons' | '32_lessons' | '64_lessons' | 'custom';
  purchaseAmount?: number; // e.g. 27200
  declineReason?: DeclineReason;
  declineComment?: string;
  updatedAt?: string;
  managerName?: string;
}

export interface MopRequestInfo {
  studentName: string;
  grade: string;
  goal: string;
  requestText: string;
}

export type HomeworkStatus = 'none' | 'assigned' | 'submitted' | 'late' | 'missing';

export interface LessonHomework {
  title: string;
  deadline?: string;
  status: HomeworkStatus;
  notes?: string;
  link?: string;
}

export interface PostLessonFeedback {
  completed: boolean;
  recommendation: string; // e.g. "Курс ЕГЭ 2 раза в неделю (Пакет 16 занятий)"
  studentLevel: string;   // e.g. "Средний (45-50 баллов, цель 80+)"
  readyToBuy: 'high' | 'medium' | 'low';
  notes?: string;
  submittedAt?: string;
}

export interface Tutor {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
  subjects: string[];
  color: string;
  phone: string;
  telegram: string;
  rating: number;
  activeStudents: number;
  availableDays: number[]; // 1 = Mon, ..., 7 = Sun
  bio: string;
  salesConversionRate: number; // e.g. 84 = 84% conversion from trial to paid
  tag?: string;                // e.g. 'Топ продаж 🔥', 'Эксперт ОГЭ/ЕГЭ'
  // Lifelong achievements & qualifications
  education?: string;          // ВУЗ, высшая педагогическая категория
  experienceYears?: number;    // Стаж в годах
  achievements?: string[];     // Заслуги и достижения за жизнь
  hourlyRate?: number;         // Ставка за урок в рублях
  targetGrades?: string[];     // ['1-4', '5-8', '9', '10', '11']
  targetGoals?: string[];      // ['ege', 'oge', 'olympiad', 'grades']
  // Ergonomics & Well-being
  preferredBreakMinutes?: number; // 0, 10, 15
  maxDailyLessons?: number;       // default 5
  defaultWhiteboardUrl?: string;  // e.g. 'https://sboard.online/board/math-diana'
  isPausedToday?: boolean;        // emergency break
}

export type LeadOffer = 'grant30' | 'matkapital' | 'trial_free' | 'quiz_diagnostic' | 'standard';

export interface LeadQuizContext {
  gradeCategory?: '1-4' | '5-7' | '8-9' | '10-11';
  targetScore?: string; // e.g. "ОГЭ на 5", "ЕГЭ 80+", "Спасти четвертную 3->4"
  currentGradeScore?: string; // e.g. "Тройка, пробелы в базе"
  primaryOffer?: LeadOffer; // e.g. "grant30" (Грант 30%) или "matkapital"
  leadSource?: string; // e.g. "Квиз на сайте sto-pyaterok.ru"
}

export interface Appointment {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  parentName?: string;
  parentPhone: string;
  grade: string; // e.g., '11 класс (ЕГЭ)', '9 класс (ОГЭ)', '7 класс'
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: LessonType;
  status: LessonStatus;
  notes?: string;
  meetingUrl?: string;
  createdAt: string;
  managerName: string;
  // Sales Director additions
  confirmationStatus?: ConfirmationStatus; // 'unconfirmed' | 'reminded' | 'confirmed'
  postLessonFeedback?: PostLessonFeedback;
  dealValue?: number; // Estimated deal value in rubles (e.g. 38400)
  // Tutor Ergonomics & HUD additions
  studentGoal?: string;       // e.g. "ЕГЭ Профиль 80+, разобрать задачу №14"
  tutorNotes?: string;        // Private lesson log: "Остановились на методе координат"
  whiteboardUrl?: string;     // Personal board link (Sboard/Miro)
  homework?: LessonHomework;  // Homework tracker
  // Owner & Platform Additions: Sto-Pyaterok Quiz Diagnosis & Offer Context
  quizContext?: LeadQuizContext;
  // Trial Outcome & Sales Analytics
  trialResult?: TrialSalesResult;
  mopRequest?: MopRequestInfo;
  learningGoalCategory?: 'ege' | 'oge' | 'olympiad' | 'grades' | 'admission' | 'other';
}

export interface TutorSlot {
  id: string;
  tutorId: string;
  date: string;
  time: string; // HH:mm
  isBooked: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'booking' | 'cancellation' | 'reschedule' | 'reminder';
  read: boolean;
  tutorId?: string;
  isHotLead?: boolean;
}
