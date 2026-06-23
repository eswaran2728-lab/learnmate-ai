export type UserRole = 'student' | 'parent' | 'admin';
export type SchoolLevel = 'preschool' | 'primary' | 'secondary' | 'pre_university';
export type RiskStatus = 'stable' | 'needs_attention' | 'at_risk';
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic';
export type LearningSpeed = 'slow' | 'average' | 'fast';
export type TeachingMode = 'eli5' | 'normal' | 'visual' | 'story' | 'exam_focused';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  school_level: SchoolLevel;
  current_form?: string;
  age_group_id: string;
  preferred_language: string;
  parent_id?: string;
  study_streak: number;
  last_active_at?: string;
  risk_status: RiskStatus;
  onboarding_complete: boolean;
  diagnostic_complete: boolean;
  created_at: string;
}

export interface Parent {
  id: string;
  user_id: string;
  full_name: string;
  whatsapp_number?: string;
  whatsapp_opted_in: boolean;
}

export interface Subject {
  id: string;
  name: string;
  name_ms?: string;
  code: string;
  school_level: SchoolLevel | 'all';
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
}

export interface DiagnosticResult {
  id: string;
  student_id: string;
  subject_id: string;
  subject?: Subject;
  detected_age_level: number;
  school_age: number;
  gap_years: number;
  score: number;
  strong_topics: string[];
  weak_topics: string[];
  missing_foundations: string[];
  learning_speed: LearningSpeed;
  learning_style: LearningStyle;
  recommendations: Record<string, unknown>;
}

export interface LearningLevel {
  id: string;
  student_id: string;
  subject_id: string;
  subject?: Subject;
  current_age_level: number;
  target_age_level: number;
  progress_percentage: number;
}

export interface DailyMission {
  id: string;
  student_id: string;
  mission_date: string;
  tasks: MissionTask[];
  total_minutes: number;
  completed_minutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  completion_percentage: number;
}

export interface MissionTask {
  subject_id: string;
  subject_name: string;
  subject_icon: string;
  duration_minutes: number;
  type: 'lesson' | 'practice' | 'homework' | 'revision';
  status: 'pending' | 'in_progress' | 'completed';
  lesson_id?: string;
  topic: string;
}

export interface Homework {
  id: string;
  student_id: string;
  subject_id: string;
  subject?: Subject;
  title: string;
  questions: HomeworkQuestion[];
  due_date?: string;
  status: 'assigned' | 'submitted' | 'marked' | 'overdue';
  created_at: string;
}

export interface HomeworkQuestion {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'short_answer' | 'multiple_choice' | 'problem_solving';
  options?: string[];
  expected_answer?: string;
  marks: number;
}

export interface AIMarkingResult {
  id: string;
  submission_id: string;
  student_id: string;
  score: number;
  max_score: number;
  percentage: number;
  feedback: {
    overall: string;
    mistakes: Array<{ question: string; error: string; correct_method: string }>;
    correct_methods: string[];
    encouragement: string;
    revision_topics: string[];
  };
}

export interface Achievement {
  id: string;
  student_id: string;
  badge_type: string;
  badge_name: string;
  badge_description?: string;
  badge_icon: string;
  earned_at: string;
}

export interface ProgressData {
  date: string;
  minutes_studied: number;
  lessons_completed: number;
  homework_completed: number;
  quiz_score?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExamReadiness {
  student_id: string;
  overall_score: number;
  subject_scores: Record<string, number>;
  readiness_level: 'not_ready' | 'basic' | 'developing' | 'proficient' | 'ready';
}
