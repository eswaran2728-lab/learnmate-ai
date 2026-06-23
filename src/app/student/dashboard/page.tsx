import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import StudentDashboardClient from '@/components/student/StudentDashboardClient';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('*, age_groups(*)')
    .eq('user_id', user.id)
    .single();

  if (!student) redirect('/register');
  if (!student.diagnostic_complete) redirect('/student/diagnostic');

  const [
    { data: levels },
    { data: todayMission },
    { data: homework },
    { data: achievements },
    { data: examReadiness },
    { data: progressData },
  ] = await Promise.all([
    supabase.from('learning_levels').select('*, subjects(*)').eq('student_id', student.id),
    supabase.from('daily_missions').select('*').eq('student_id', student.id).eq('mission_date', new Date().toISOString().split('T')[0]).single(),
    supabase.from('homework').select('*, subjects(*)').eq('student_id', student.id).in('status', ['assigned', 'overdue']).limit(5),
    supabase.from('achievements').select('*').eq('student_id', student.id).order('earned_at', { ascending: false }).limit(6),
    supabase.from('exam_readiness').select('*').eq('student_id', student.id).single(),
    supabase.from('progress_tracking').select('*').eq('student_id', student.id).order('tracked_date', { ascending: false }).limit(7),
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 p-6 pb-24 md:pb-6 max-w-5xl">
        <StudentDashboardClient
          student={student}
          levels={levels || []}
          todayMission={todayMission}
          homework={homework || []}
          achievements={achievements || []}
          examReadiness={examReadiness}
          progressData={progressData || []}
        />
      </main>
    </div>
  );
}
