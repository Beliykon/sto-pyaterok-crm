import React from 'react';

interface TutorAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

const PALETTE = [
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-blue-100 text-blue-700 border-blue-200',
];

export function getInitials(name: string): string {
  if (!name) return 'Р';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function getTutorColorClass(name: string, color?: string): string {
  if (color && COLOR_CLASSES[color]) {
    return COLOR_CLASSES[color];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export default function TutorAvatar({
  name,
  size = 'md',
  className = '',
  color,
}: TutorAvatarProps) {
  const initials = getInitials(name);
  const colorClass = getTutorColorClass(name, color);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px] rounded-md border',
    sm: 'w-7 h-7 text-xs rounded-lg border font-bold',
    md: 'w-9 h-9 text-xs rounded-xl border font-bold',
    lg: 'w-11 h-11 text-sm rounded-xl border font-extrabold',
    xl: 'w-14 h-14 text-base rounded-2xl border font-extrabold',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none tracking-tight shadow-2xs ${sizeClasses} ${colorClass} ${className}`}
      title={name}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
}
