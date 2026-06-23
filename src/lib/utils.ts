import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAgeGroup(age: number): string {
  if (age <= 6) return 'preschool';
  if (age <= 12) return 'primary';
  if (age <= 17) return 'secondary';
  return 'pre_university';
}

export function getLevelLabel(ageLevel: number, studentAge: number): {
  label: string; color: string; gap: number;
} {
  const gap = studentAge - ageLevel;
  if (gap <= 0) return { label: 'On Track', color: 'text-green-600', gap };
  if (gap <= 1) return { label: '1 Year Behind', color: 'text-yellow-600', gap };
  if (gap <= 2) return { label: '2 Years Behind', color: 'text-orange-500', gap };
  return { label: `${gap} Years Behind`, color: 'text-red-600', gap };
}

export function getRiskColor(status: string): string {
  switch (status) {
    case 'stable': return 'text-green-600 bg-green-50';
    case 'needs_attention': return 'text-yellow-600 bg-yellow-50';
    case 'at_risk': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function formatStreak(streak: number): string {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return '1 day streak 🔥';
  return `${streak} day streak 🔥`;
}

export function getExamReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Ready', color: 'text-green-600' };
  if (score >= 60) return { label: 'Proficient', color: 'text-blue-600' };
  if (score >= 40) return { label: 'Developing', color: 'text-yellow-600' };
  if (score >= 20) return { label: 'Basic', color: 'text-orange-600' };
  return { label: 'Not Ready', color: 'text-red-600' };
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export const BADGE_DEFINITIONS: Record<string, { name: string; icon: string; description: string }> = {
  streak_7: { name: '7 Day Streak', icon: '🔥', description: 'Studied 7 days in a row' },
  streak_30: { name: '30 Day Streak', icon: '⚡', description: 'Studied 30 days in a row' },
  homework_hero: { name: 'Homework Hero', icon: '📝', description: 'Submitted 10 homework assignments' },
  focus_champion: { name: 'Focus Champion', icon: '🎯', description: 'Completed 5 missions in a row' },
  improvement_star: { name: 'Improvement Star', icon: '⭐', description: 'Improved by 2 age levels' },
  math_comeback: { name: 'Math Comeback', icon: '🔢', description: 'Raised Math level by 1 year' },
  english_builder: { name: 'English Builder', icon: '📖', description: 'Raised English level by 1 year' },
  science_explorer: { name: 'Science Explorer', icon: '🔬', description: 'Completed 5 Science lessons' },
  first_lesson: { name: 'First Lesson', icon: '🎓', description: 'Completed your first lesson' },
  diagnostic_done: { name: 'Diagnostic Done', icon: '🧠', description: 'Completed the AI diagnostic test' },
  perfect_score: { name: 'Perfect Score', icon: '💯', description: 'Got 100% on a homework assignment' },
  level_up: { name: 'Level Up', icon: '🚀', description: 'Advanced to the next level' },
  mission_master: { name: 'Mission Master', icon: '✅', description: 'Completed 20 daily missions' },
};
