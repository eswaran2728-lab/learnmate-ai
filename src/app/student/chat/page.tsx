import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import AIChatClient from '@/components/student/AIChatClient';

export default async function AIChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (!student) redirect('/register');

  const { data: levels } = await supabase.from('learning_levels').select('*, subjects(*)').eq('student_id', student.id);
  const { data: subjects } = await supabase.from('subjects').select('*').eq('is_active', true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <AIChatClient student={student} levels={levels || []} subjects={subjects || []} />
      </main>
    </div>
  );
}
