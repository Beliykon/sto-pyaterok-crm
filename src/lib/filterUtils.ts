import { Appointment, Tutor } from './types';

/**
 * Normalizes grade matching across all grade formats and ranges:
 * - 'all': matches all
 * - '1-4': 1, 2, 3, 4, 1-4, 1–4, начальная школа
 * - '5-8': 5, 6, 7, 8, 5-8, 5–8, 5-6, 7-8
 * - '9': 9, 9 класс, огэ
 * - '10': 10, 10 класс
 * - '11': 11, 11 класс, егэ
 */
export function matchesGradeFilter(gradeStr: string | undefined, filterId: string): boolean {
  if (!filterId || filterId === 'all') return true;
  if (!gradeStr) return false;
  const g = gradeStr.toLowerCase();

  if (filterId === '1-4') {
    return (
      /(?:^|[^\d])([1-4]|1[-–]4)(?:[^\d]|$)/.test(g) ||
      g.includes('начальн') ||
      g.includes('1-4') ||
      g.includes('1–4') ||
      g.includes('1 кл') ||
      g.includes('2 кл') ||
      g.includes('3 кл') ||
      g.includes('4 кл')
    );
  }

  if (filterId === '5-8') {
    return (
      /(?:^|[^\d])([5-8]|5[-–]8|5[-–]6|7[-–]8)(?:[^\d]|$)/.test(g) ||
      g.includes('5-8') ||
      g.includes('5–8') ||
      g.includes('5-6') ||
      g.includes('7-8') ||
      g.includes('5 кл') ||
      g.includes('6 кл') ||
      g.includes('7 кл') ||
      g.includes('8 кл')
    );
  }

  if (filterId === '9') {
    return (
      /(?:^|[^\d])9(?:[^\d]|$)/.test(g) ||
      g.includes('9 кл') ||
      g.includes('9-й') ||
      g.includes('огэ')
    );
  }

  if (filterId === '10') {
    return (
      /(?:^|[^\d])10(?:[^\d]|$)/.test(g) ||
      g.includes('10 кл') ||
      g.includes('10-й')
    );
  }

  if (filterId === '11') {
    return (
      /(?:^|[^\d])11(?:[^\d]|$)/.test(g) ||
      g.includes('11 кл') ||
      g.includes('11-й') ||
      g.includes('егэ')
    );
  }

  return g.includes(filterId.toLowerCase());
}

/**
 * Checks whether an appointment represents a trial lesson.
 * Covers all variants: type 'trial', 'exam_prep' trial sessions, price 0,
 * trialResult, quizContext, or notes indicating a trial/introductory lesson.
 */
export function isTrialLesson(app: Appointment): boolean {
  if (app.type === 'trial' || app.type === 'consultation') return true;
  if (Boolean(app.trialResult)) return true;
  if (Boolean(app.quizContext)) return true;
  if (app.dealValue === 0) return true;
  const n = (app.notes || '').toLowerCase();
  if (n.includes('пробн') || n.includes('вводн') || n.includes('первый') || n.includes('[запрос моп]') || n.includes('диагностик')) {
    return true;
  }
  if (app.type === 'exam_prep') {
    return !n.includes('абонемент') && !n.includes('регулярн');
  }
  return false;
}

/**
 * Checks whether an appointment matches the lesson type filter.
 * - 'all': all
 * - 'trial': matches all trial/introductory lessons
 * - 'regular': matches regular ongoing lessons
 * - 'today': scheduled for today
 * - 'exam': matches exam-prep or ЕГЭ/ОГЭ sessions
 * - 'olympiad': matches Olympiad lessons
 */
export function matchesLessonTypeFilter(app: Appointment, filterType: string): boolean {
  if (!filterType || filterType === 'all') return true;

  if (filterType === 'trial') {
    return isTrialLesson(app);
  }

  if (filterType === 'regular') {
    return !isTrialLesson(app) || app.type === 'regular';
  }

  if (filterType === 'today') {
    const today = new Date().toISOString().split('T')[0];
    return app.date === today;
  }

  if (filterType === 'exam') {
    return app.type === 'exam_prep' || matchesGoalFilter(app, 'ege') || matchesGoalFilter(app, 'oge');
  }

  if (filterType === 'olympiad') {
    return matchesGoalFilter(app, 'olympiad');
  }

  return app.type === filterType;
}

/**
 * Matches appointment against learning goal:
 * - 'all': all
 * - 'ege': ЕГЭ, профиль, база, 11 класс, 80+, 90+, бюджет
 * - 'oge': ОГЭ, 9 класс, сдача ОГЭ
 * - 'olympiad': Олимпиады, Всерос, Высшая проба, Ломоносов, Физтех, перечневые
 * - 'grades': Успеваемость, оценки, пробелы, подтянуть, школьная программа
 */
export function matchesGoalFilter(app: Appointment, goalId: string): boolean {
  if (!goalId || goalId === 'all') return true;

  const gid = goalId.toLowerCase();

  // Explicit category check
  if (app.learningGoalCategory && app.learningGoalCategory.toLowerCase() === gid) {
    return true;
  }

  // Combined text to search
  const text = [
    app.learningGoalCategory,
    app.studentGoal,
    app.grade,
    app.subject,
    app.notes,
    app.quizContext?.targetScore,
    app.quizContext?.currentGradeScore,
    app.quizContext?.primaryOffer,
    app.mopRequest?.requestText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (gid === 'ege') {
    return (
      text.includes('егэ') ||
      text.includes('ege') ||
      text.includes('профиль') ||
      text.includes('11 класс') ||
      text.includes('11 кл') ||
      text.includes('100 бал') ||
      text.includes('80+') ||
      text.includes('90+') ||
      text.includes('бауман')
    );
  }

  if (gid === 'oge') {
    return (
      text.includes('огэ') ||
      text.includes('oge') ||
      text.includes('9 класс') ||
      text.includes('9 кл') ||
      text.includes('гиа')
    );
  }

  if (gid === 'olympiad') {
    return (
      text.includes('олимпиад') ||
      text.includes('olympiad') ||
      text.includes('всерос') ||
      text.includes('всош') ||
      text.includes('перечнев') ||
      text.includes('высшая проба') ||
      text.includes('ломоносов') ||
      text.includes('физтех') ||
      text.includes('турнир') ||
      text.includes('росатом')
    );
  }

  if (gid === 'grades') {
    return (
      text.includes('успеваемост') ||
      text.includes('grades') ||
      text.includes('оценк') ||
      text.includes('пробел') ||
      text.includes('четверт') ||
      text.includes('подтянуть') ||
      text.includes('база') ||
      text.includes('повышение') ||
      text.includes('школьн')
    );
  }

  return text.includes(gid);
}

/**
 * Filter tutors according to subject, grade, and goal
 */
export function tutorMatchesFilters(
  tutor: Tutor,
  filters: {
    subject: string;
    grade: string;
    goal: string;
    type?: string;
  },
  appointments: Appointment[]
): boolean {
  // 1. Subject filter
  if (filters.subject && filters.subject !== 'all') {
    const s = filters.subject.toLowerCase();
    const teachesSubject = tutor.subjects.some(subj => subj.toLowerCase().includes(s));
    if (!teachesSubject) return false;
  }

  // 2. Grade filter
  if (filters.grade && filters.grade !== 'all') {
    const targetMatches = tutor.targetGrades?.some(tg => matchesGradeFilter(tg, filters.grade));
    const bioMatches = matchesGradeFilter(tutor.bio, filters.grade);
    const hasLessonsWithGrade = appointments.some(
      a => a.tutorId === tutor.id && a.status !== 'cancelled' && matchesGradeFilter(a.grade, filters.grade)
    );
    // If tutor has neither target grade nor bio mention nor appointments with this grade:
    if (!targetMatches && !bioMatches && !hasLessonsWithGrade) {
      if (filters.grade === '1-4' && tutor.bio.toLowerCase().includes('егэ') && !tutor.subjects.some(s => s.toLowerCase().includes('база') || s.toLowerCase().includes('начальн'))) {
        return false;
      }
    }
  }

  // 3. Goal filter
  if (filters.goal && filters.goal !== 'all') {
    const targetMatches = tutor.targetGoals?.some(tg => tg.toLowerCase() === filters.goal.toLowerCase());
    const bioMatches =
      (filters.goal === 'ege' && (tutor.bio.toLowerCase().includes('егэ') || tutor.subjects.some(s => s.toLowerCase().includes('егэ')))) ||
      (filters.goal === 'oge' && (tutor.bio.toLowerCase().includes('огэ') || tutor.subjects.some(s => s.toLowerCase().includes('огэ')))) ||
      (filters.goal === 'olympiad' && (tutor.bio.toLowerCase().includes('олимпиад') || tutor.achievements?.some(ac => ac.toLowerCase().includes('олимпиад')))) ||
      (filters.goal === 'grades' && (tutor.bio.toLowerCase().includes('успеваемост') || tutor.subjects.some(s => s.toLowerCase().includes('алгебр') || s.toLowerCase().includes('база'))));

    const hasLessonsWithGoal = appointments.some(
      a => a.tutorId === tutor.id && a.status !== 'cancelled' && matchesGoalFilter(a, filters.goal)
    );

    if (!targetMatches && !bioMatches && !hasLessonsWithGoal) {
      return false;
    }
  }

  return true;
}
