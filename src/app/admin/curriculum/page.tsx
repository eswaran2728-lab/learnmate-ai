import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default async function AdminCurriculumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') redirect('/student/dashboard');

  const { data: subjects } = await supabase.from('subjects').select('*').order('school_level');
  const { data: topics } = await supabase.from('curriculum_topics').select('*, subjects(name, icon)').order('order_index');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">📚 Curriculum Management</h1>

          {/* Subjects */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Active Subjects ({subjects?.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {subjects?.map(s => (
                <div key={s.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{s.school_level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">Curriculum Topics ({topics?.length || 0})</h2>
            <div className="space-y-2">
              {topics?.slice(0, 20).map(topic => (
                <div key={topic.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{(topic.subjects as { icon: string })?.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                      <div className="text-xs text-gray-500">{(topic.subjects as { name: string })?.name} • Age {topic.age_level}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.is_foundation && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Foundation</span>
                    )}
                    <span className="text-xs text-gray-400">{topic.estimated_minutes} min</span>
                  </div>
                </div>
              ))}
              {!topics?.length && <p className="text-sm text-gray-400 text-center py-6">No topics added yet</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
