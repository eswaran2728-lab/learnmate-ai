-- ============================================================
-- LearnMate AI - Complete Supabase Schema
-- Created by ESWARAN A/L Padmanathan
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms', 'ta', 'zh')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGE GROUPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.age_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('preschool', 'primary', 'secondary', 'pre_university')),
  teaching_style JSONB NOT NULL DEFAULT '{
    "tone": "friendly",
    "explanation_complexity": "simple",
    "use_visuals": true,
    "lesson_duration_minutes": 20,
    "examples_type": "everyday"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default age groups
INSERT INTO public.age_groups (name, min_age, max_age, level, teaching_style) VALUES
('Preschool', 4, 6, 'preschool', '{"tone":"very_fun","explanation_complexity":"very_simple","use_visuals":true,"lesson_duration_minutes":10,"examples_type":"cartoon_animals"}'),
('Primary', 7, 12, 'primary', '{"tone":"encouraging","explanation_complexity":"simple","use_visuals":true,"lesson_duration_minutes":20,"examples_type":"everyday_objects"}'),
('Secondary', 13, 17, 'secondary', '{"tone":"supportive","explanation_complexity":"moderate","use_visuals":true,"lesson_duration_minutes":30,"examples_type":"real_world"}'),
('Pre-University', 18, 19, 'pre_university', '{"tone":"professional","explanation_complexity":"advanced","use_visuals":false,"lesson_duration_minutes":45,"examples_type":"career_focused"}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER NOT NULL,
  school_level TEXT NOT NULL CHECK (school_level IN ('preschool', 'primary', 'secondary', 'pre_university')),
  current_form TEXT,
  age_group_id UUID REFERENCES public.age_groups(id),
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ms', 'ta', 'zh')),
  parent_id UUID,
  study_streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  risk_status TEXT DEFAULT 'stable' CHECK (risk_status IN ('stable', 'needs_attention', 'at_risk')),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  diagnostic_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp_number TEXT,
  whatsapp_opted_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for student parent
ALTER TABLE public.students ADD CONSTRAINT fk_student_parent FOREIGN KEY (parent_id) REFERENCES public.parents(id);

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ms TEXT,
  code TEXT UNIQUE NOT NULL,
  school_level TEXT NOT NULL CHECK (school_level IN ('preschool', 'primary', 'secondary', 'pre_university', 'all')),
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#2563EB',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO public.subjects (name, name_ms, code, school_level, icon, color) VALUES
('English', 'Bahasa Inggeris', 'ENG', 'all', '📖', '#2563EB'),
('Bahasa Melayu', 'Bahasa Melayu', 'BM', 'all', '🇲🇾', '#10B981'),
('Mathematics', 'Matematik', 'MATH', 'all', '🔢', '#7C3AED'),
('Science', 'Sains', 'SCI', 'primary', '🔬', '#F59E0B'),
('Additional Mathematics', 'Matematik Tambahan', 'ADDMATH', 'secondary', '📐', '#6D28D9'),
('Biology', 'Biologi', 'BIO', 'secondary', '🧬', '#059669'),
('Chemistry', 'Kimia', 'CHEM', 'secondary', '⚗️', '#DC2626'),
('Physics', 'Fizik', 'PHY', 'secondary', '⚡', '#0891B2'),
('History', 'Sejarah', 'SEJ', 'secondary', '🏛️', '#92400E'),
('Geography', 'Geografi', 'GEO', 'secondary', '🌍', '#065F46'),
('Accounting', 'Perakaunan', 'ACC', 'secondary', '💰', '#1D4ED8'),
('Economics', 'Ekonomi', 'ECO', 'secondary', '📊', '#5B21B6'),
('ABC & Reading', 'ABC & Membaca', 'PREREAD', 'preschool', '🔤', '#EC4899'),
('Numbers & Counting', 'Nombor & Mengira', 'PRENUM', 'preschool', '🔢', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CURRICULUM TOPICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  age_level INTEGER NOT NULL,
  school_form TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  prerequisites UUID[] DEFAULT '{}',
  estimated_minutes INTEGER DEFAULT 30,
  keywords TEXT[] DEFAULT '{}',
  is_foundation BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIAGNOSTIC TESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  questions JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DIAGNOSTIC RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_test_id UUID REFERENCES public.diagnostic_tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  detected_age_level INTEGER NOT NULL,
  school_age INTEGER NOT NULL,
  gap_years INTEGER GENERATED ALWAYS AS (school_age - detected_age_level) STORED,
  score DECIMAL(5,2),
  strong_topics TEXT[] DEFAULT '{}',
  weak_topics TEXT[] DEFAULT '{}',
  missing_foundations TEXT[] DEFAULT '{}',
  learning_speed TEXT DEFAULT 'average' CHECK (learning_speed IN ('slow', 'average', 'fast')),
  learning_style TEXT DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  recommendations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEARNING LEVELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  current_age_level INTEGER NOT NULL,
  target_age_level INTEGER NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================================================
-- LEARNING PATHS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topics JSONB DEFAULT '[]',
  current_topic_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  estimated_weeks INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{
    "explanation": "",
    "examples": [],
    "step_by_step": [],
    "practice_questions": [],
    "key_points": []
  }',
  teaching_mode TEXT DEFAULT 'normal' CHECK (teaching_mode IN ('eli5', 'normal', 'visual', 'story', 'exam_focused')),
  ai_generated BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY MISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks JSONB NOT NULL DEFAULT '[]',
  total_minutes INTEGER DEFAULT 50,
  completed_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, mission_date)
);

-- ============================================================
-- HOMEWORK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  due_date TIMESTAMPTZ,
  difficulty_mix JSONB DEFAULT '{"easy": 3, "medium": 3, "hard": 2}',
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'marked', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HOMEWORK SUBMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  typed_answers TEXT,
  image_urls TEXT[] DEFAULT '{}',
  pdf_url TEXT,
  submission_type TEXT DEFAULT 'typed' CHECK (submission_type IN ('typed', 'image', 'pdf', 'mixed')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI MARKING RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_marking_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score / NULLIF(max_score, 0)) * 100, 2)) STORED,
  feedback JSONB NOT NULL DEFAULT '{
    "overall": "",
    "mistakes": [],
    "correct_methods": [],
    "encouragement": "",
    "revision_topics": []
  }',
  marked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROGRESS TRACKING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.progress_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_studied INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  homework_completed INTEGER DEFAULT 0,
  quiz_score DECIMAL(5,2),
  level_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, tracked_date)
);

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'streak_7', 'streak_30', 'homework_hero', 'focus_champion',
    'improvement_star', 'math_comeback', 'english_builder',
    'science_explorer', 'first_lesson', 'diagnostic_done',
    'perfect_score', 'level_up', 'mission_master'
  )),
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.curriculum_topics(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  teaching_mode TEXT DEFAULT 'normal',
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- ============================================================
-- PARENT REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parent_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'diagnostic')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content JSONB NOT NULL DEFAULT '{
    "summary": "",
    "subjects": [],
    "missions_completed": 0,
    "homework_submitted": 0,
    "study_streak": 0,
    "exam_readiness": 0,
    "risk_status": "stable",
    "recommendations": []
  }',
  sent_via_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WHATSAPP LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN (
    'homework_missed', 'mission_missed', 'weekly_progress',
    'big_improvement', 'risk_warning', 'diagnostic_complete',
    'level_up', 'custom'
  )),
  message_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description) VALUES
('ai_model', '"gpt-4o"', 'OpenAI model to use for teaching'),
('max_daily_ai_calls', '100', 'Max AI API calls per student per day'),
('whatsapp_enabled', 'true', 'Enable WhatsApp notifications'),
('diagnostic_questions_per_subject', '10', 'Number of diagnostic questions per subject'),
('daily_mission_duration_minutes', '50', 'Total daily mission duration in minutes')
ON CONFLICT DO NOTHING;

-- ============================================================
-- EXAM READINESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_readiness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) DEFAULT 0,
  subject_scores JSONB DEFAULT '{}',
  readiness_level TEXT DEFAULT 'not_ready' CHECK (readiness_level IN ('not_ready', 'basic', 'developing', 'proficient', 'ready')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marking_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_readiness ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Students can access their own records
CREATE POLICY "Students view own record" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students update own record" ON public.students FOR UPDATE USING (user_id = auth.uid());

-- Subjects are public read
CREATE POLICY "Subjects are publicly readable" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Curriculum topics are publicly readable" ON public.curriculum_topics FOR SELECT USING (true);
CREATE POLICY "Age groups are publicly readable" ON public.age_groups FOR SELECT USING (true);

-- Students access own diagnostic data
CREATE POLICY "Students view own diagnostics" ON public.diagnostic_tests FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students insert own diagnostics" ON public.diagnostic_tests FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- Students access own learning data
CREATE POLICY "Students access own learning levels" ON public.learning_levels FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own learning paths" ON public.learning_paths FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own lessons" ON public.lessons FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own missions" ON public.daily_missions FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own homework" ON public.homework FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own submissions" ON public.homework_submissions FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own marking" ON public.ai_marking_results FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own progress" ON public.progress_tracking FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own achievements" ON public.achievements FOR SELECT USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own chat" ON public.chat_history FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students access own exam readiness" ON public.exam_readiness FOR ALL USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- Parents access their children's data
CREATE POLICY "Parents view own record" ON public.parents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Parents update own record" ON public.parents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Parents view children" ON public.students FOR SELECT USING (
  parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid())
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.daily_missions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage bucket for homework uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('homework', 'homework', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
