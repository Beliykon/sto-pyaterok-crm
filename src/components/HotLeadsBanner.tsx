import React from 'react';
import { Appointment } from '../lib/types';
import { Flame, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';

interface HotLeadsBannerProps {
  appointments: Appointment[];
  onCloseDeal: (appointmentId: string) => void;
}

export default function HotLeadsBanner({
  appointments,
  onCloseDeal,
}: HotLeadsBannerProps) {
  // Find appointments that have postLessonFeedback and are ready for closing deal
  const hotLeads = appointments.filter(
    a => a.postLessonFeedback && a.status !== 'cancelled'
  );

  if (hotLeads.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-sm space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
            <Flame size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span>Горячие заявки после пробного урока ({hotLeads.length})</span>
              <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                готов к оплате
              </span>
            </h3>
            <p className="text-[11px] text-slate-600">
              Преподаватель провел урок и передал рекомендацию пакета для максимальной конверсии
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hotLeads.map(lead => {
          const feedback = lead.postLessonFeedback!;
          return (
            <div
              key={lead.id}
              className="p-3.5 bg-white rounded-xl border border-amber-200/90 shadow-xs flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-slate-900">{lead.studentName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                      {lead.subject}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Преподаватель: <strong className="text-slate-800">{lead.tutorName}</strong>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    feedback.readyToBuy === 'high'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {feedback.readyToBuy === 'high' ? '🔥 Готов покупать' : '⚡ Тёплый интерес'}
                </span>
              </div>

              {/* Recommendation pill */}
              <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 text-[11px] text-amber-950">
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles size={12} className="text-amber-600" />
                  <span>Рекомендация репетитора:</span>
                </div>
                <div className="font-semibold text-slate-800 mt-0.5">{feedback.recommendation}</div>
                {feedback.notes && (
                  <div className="text-[10px] text-slate-600 italic mt-0.5">«{feedback.notes}»</div>
                )}
              </div>

              {/* Contact info and action without phone calls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  <span className="text-[11px] text-slate-400 block">Контакт родителя:</span>
                  <span className="font-bold text-slate-800">{lead.parentPhone}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onCloseDeal(lead.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <CheckCircle2 size={13} />
                  <span>Оформить оплату</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
