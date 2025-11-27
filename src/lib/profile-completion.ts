import { User } from "@/lib/auth";

export interface ProfileCompletionStatus {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

export function calculateProfileCompletion(user: User | null): ProfileCompletionStatus {
  if (!user) {
    return { percentage: 0, missingFields: [], isComplete: false };
  }

  const fields = [
    { key: 'name', value: user.name, label: 'Full Name' },
    { key: 'phone', value: user.phone, label: 'Mobile Number' },
    { key: 'department', value: user.department, label: 'Designation' },
    { key: 'department2', value: user.department, label: 'Department' },
    { key: 'profile_picture_url', value: user.profile_picture_url, label: 'Profile Photo' },
  ];

  const completedFields = fields.filter(field => field.value && field.value.trim() !== '');
  const percentage = Math.round((completedFields.length / fields.length) * 100);
  const missingFields = fields
    .filter(field => !field.value || field.value.trim() === '')
    .map(field => field.label);

  return {
    percentage,
    missingFields,
    isComplete: percentage === 100,
  };
}

export function shouldShowProfileCompletionPopup(): boolean {
  const skipFlag = localStorage.getItem('skipProfilePopup');
  return skipFlag !== 'true';
}

export function markProfilePopupSkipped(): void {
  localStorage.setItem('skipProfilePopup', 'true');
}

export function hasProfileCompletionBeenCelebrated(): boolean {
  return localStorage.getItem('profileCompletionCelebrated') === 'true';
}

export function markProfileCompletionCelebrated(): void {
  localStorage.setItem('profileCompletionCelebrated', 'true');
}
