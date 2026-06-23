import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import HomeworkClient from '@/components/student/HomeworkClient';

export default async function HomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (!student) redirect('/register');

  const [{ data: pending }, { data: submitted }, { data: subjects }] = await Promise.all([
    supabase.from('homework').select('*, subjects(*)').eq('student_id', student.id).in('status', ['assigned', 'overdue']).order('created_at', { ascending: false }),
    supabase.from('homework').select('*, subjects(*), homework_submissions(*, ai_marking_results(*))').eq('student_id', student.id).in('status', ['submitted', 'marked']).order('created_at', { ascending: false }).limit(10),
    supabase.from('subjects').select('*').eq('is_active', true),
  ]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 p-6 pb-24 md:pb-6 max-w-4xl">
        <HomeworkClient student={student} pending={pending || []} submitted={submitted || []} subjects={subjects || []} />
      </main>
    </div>
  );
}
