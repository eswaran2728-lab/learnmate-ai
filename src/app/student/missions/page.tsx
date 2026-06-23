import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import MissionsClient from '@/components/student/MissionsClient';

export default async function MissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (!student) redirect('/register');

  const today = new Date().toISOString().split('T')[0];
  const { data: todayMission } = await supabase.from('daily_missions').select('*').eq('student_id', student.id).eq('mission_date', today).single();
  const { data: recentMissions } = await supabase.from('daily_missions').select('*').eq('student_id', student.id).order('mission_date', { ascending: false }).limit(7);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 p-6 pb-24 md:pb-6 max-w-3xl">
        <MissionsClient student={student} todayMission={todayMission} recentMissions={recentMissions || []} />
      </main>
    </div>
  );
}
