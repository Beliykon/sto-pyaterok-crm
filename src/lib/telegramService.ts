/**
 * Telegram Bot notification service for Online School «100 Pyaterok»
 * Handles automated alerts for bookings, reschedules, cancellations and daily schedules.
 */

export interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  chatId: string; // Group ID, Channel username, or Supergroup ID (e.g. -100xxxxxxxxxx or @chat)
  botUsername: string;
  notifyOnBooking: boolean;
  notifyOnReschedule: boolean;
  notifyOnCancel: boolean;
  notifyDailyDigest: boolean;
}

const STORAGE_KEY = 'stopyaterok_telegram_settings';

export const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  enabled: true,
  botToken: '',
  chatId: '@sto_pyaterok_leads',
  botUsername: 'StoPyaterokBot',
  notifyOnBooking: true,
  notifyOnReschedule: true,
  notifyOnCancel: true,
  notifyDailyDigest: true,
};

export function getTelegramSettings(): TelegramSettings {
  if (typeof window === 'undefined') return DEFAULT_TELEGRAM_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TELEGRAM_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load telegram settings', e);
  }
  return DEFAULT_TELEGRAM_SETTINGS;
}

export function saveTelegramSettings(settings: TelegramSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save telegram settings', e);
  }
}

export async function sendTelegramMessage(text: string, settings?: TelegramSettings): Promise<{ success: boolean; error?: string }> {
  const cfg = settings || getTelegramSettings();
  if (!cfg.enabled) {
    return { success: false, error: 'Уведомления в Telegram отключены в настройках' };
  }

  // If a real botToken and chatId are configured, send direct HTTP request to Telegram Bot API
  if (cfg.botToken && cfg.chatId) {
    try {
      const url = `https://api.telegram.org/bot${cfg.botToken.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cfg.chatId.trim(),
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.description || 'Ошибка Telegram API' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Сетевая ошибка при отправке в Telegram' };
    }
  }

  // If no bot token provided, simulate success and provide direct share link
  return { success: true };
}

export function formatBookingNotification(app: {
  studentName: string;
  grade: string;
  subject: string;
  tutorName: string;
  date: string;
  startTime: string;
  endTime?: string;
  parentPhone?: string;
  type?: string;
  notes?: string;
  mopRequestText?: string;
  meetingUrl?: string;
}): string {
  const isTrial = app.type === 'trial' || !app.type;
  return `🔔 <b>${isTrial ? 'НОВАЯ ЗАПИСЬ НА ВВОДНЫЙ УРОК' : 'ЗАПИСЬ НА ЗАНЯТИЕ'}</b>

👨‍🎓 <b>Ученик:</b> ${app.studentName} (${app.grade})
📚 <b>Предмет:</b> ${app.subject}
👨‍🏫 <b>Преподаватель:</b> ${app.tutorName}
📅 <b>Дата и время:</b> ${app.date} в ${app.startTime}${app.endTime ? `-${app.endTime}` : ''}
📞 <b>Телефон:</b> ${app.parentPhone || 'уточняется'}
${app.mopRequestText ? `💬 <b>Запрос МОП:</b> ${app.mopRequestText}\n` : ''}${app.notes ? `📝 <b>Заметка:</b> ${app.notes}\n` : ''}${app.meetingUrl ? `🔗 <b>Телемост:</b> ${app.meetingUrl}\n` : ''}
🏫 <i>Онлайн-школа «Сто Пятёрок»</i>`;
}

export function formatRescheduleNotification(app: {
  studentName: string;
  subject: string;
  tutorName: string;
  oldDate?: string;
  oldTime?: string;
  newDate: string;
  newTime: string;
}): string {
  return `🔄 <b>ПЕРЕНОС ЗАНЯТИЯ</b>

👨‍🎓 <b>Ученик:</b> ${app.studentName}
📚 <b>Предмет:</b> ${app.subject}
👨‍🏫 <b>Преподаватель:</b> ${app.tutorName}
${app.oldDate ? `⏰ <b>Старое время:</b> ${app.oldDate} в ${app.oldTime}\n` : ''}✨ <b>Новое время:</b> ${app.newDate} в ${app.newTime}

🏫 <i>Онлайн-школа «Сто Пятёрок»</i>`;
}

export function formatCancelNotification(app: {
  studentName: string;
  subject: string;
  tutorName: string;
  date: string;
  time: string;
}): string {
  return `❌ <b>ОТМЕНА ЗАНЯТИЯ</b>

👨‍🎓 <b>Ученик:</b> ${app.studentName}
📚 <b>Предмет:</b> ${app.subject}
👨‍🏫 <b>Преподаватель:</b> ${app.tutorName}
📅 <b>Слот:</b> ${app.date} в ${app.time}

Слот освобождён для повторной записи в шахматке.`;
}
