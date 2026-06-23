import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { getRiskColor } from '@/lib/utils';

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') redirect('/student/dashboard');

  const { data: students } = await supabase
    .from('students')
    .select('*, age_groups(name), parents(full_name, whatsapp_number)')
    .order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎓 Students</h1>
              <p className="text-gray-500 text-sm">{students?.length || 0} students registered</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Age / Level', 'Parent', 'Streak', 'Risk', 'Registered'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students?.map(student => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{student.full_name}</div>
                      <div className="text-xs text-gray-500">{student.current_form}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>Age {student.age}</div>
                      <div className="text-xs text-gray-500">{student.age_groups?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.parents ? (
                        <div>
                          <div>{(student.parents as { full_name: string }).full_name}</div>
                          <div className="text-xs text-gray-400">{(student.parents as { whatsapp_number?: string }).whatsapp_number || 'No WhatsApp'}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-orange-600">{student.study_streak} 🔥</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(student.risk_status)}`}>
                        {student.risk_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!students?.length && (
              <div className="text-center py-10 text-gray-400 text-sm">No students registered yet</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
