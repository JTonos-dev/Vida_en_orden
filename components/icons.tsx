import type { ReactNode } from "react";

export type IconName = "home" | "tasks" | "calendar" | "projects" | "wallet" | "activity" | "settings" | "plus" | "pencil" | "arrowUp" | "arrowDown" | "folder";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-7h6v7"/></>,
  tasks: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 2 2 4-4"/><path d="M15 9h2"/><path d="M7 15h10"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  projects: <><path d="M3 7.5h6l2 2h10v10.5H3z"/><path d="M3 7.5V5h7l2 2.5"/></>,
  wallet: <><path d="M4 6.5h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h13"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
  activity: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.5v-.1A1.7 1.7 0 0 0 8.4 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.5h.3A1.7 1.7 0 0 0 4 8.4a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.46 3.6l.06.06A1.7 1.7 0 0 0 8.4 4 1.7 1.7 0 0 0 9.5 2.3V2h4.1v.3A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 1.7 1.5h.3v4.1h-.3a1.7 1.7 0 0 0-1.7 1.4Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  pencil: <><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2Z"/><path d="m14.5 7.1 2.8 2.8"/></>,
  arrowUp: <><path d="m6 10 6-6 6 6"/><path d="M12 4v16"/></>,
  arrowDown: <><path d="m6 14 6 6 6-6"/><path d="M12 20V4"/></>,
  folder: <><path d="M3 7h6l2 2h10v11H3z"/><path d="M3 7V5h7l2 2"/></>,
};

export function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  return <svg className={`appIcon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
