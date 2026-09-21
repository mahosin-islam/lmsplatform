export interface DeadlineStatus {
  label: string;
  color: "red" | "amber" | "gray";
  overdue: boolean;
}

export function getDeadlineStatus(
  deadline: string | null | undefined
): DeadlineStatus {
  if (!deadline) return { label: "No deadline", color: "gray", overdue: false };
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) {
    return { label: "No deadline", color: "gray", overdue: false };
  }
  const diff = due.getTime() - Date.now();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);

  if (diff < 0) return { label: "Overdue", color: "red", overdue: true };
  if (hours < 1) return { label: "Due soon", color: "amber", overdue: false };
  if (hours < 24) return { label: `Due in ${hours} hours`, color: "amber", overdue: false };
  if (days < 3) return { label: `Due in ${days} days`, color: "amber", overdue: false };
  return { label: `Due in ${days} days`, color: "gray", overdue: false };
}

export function gradeLetter(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

export function scoreBadgeClass(percent: number): string {
  if (percent >= 80) return "bg-emerald-100 text-emerald-700";
  if (percent >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}