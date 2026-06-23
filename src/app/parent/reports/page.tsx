import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ParentSidebar from '@/components/layout/ParentSidebar';

export default async function ParentReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: parent } = await supabase.from('parents').select('*').eq('user_id', user.id).single();
  if (!parent) redirect('/register');

  const { data: children } = await supabase.from('students').select('*').eq('parent_id', parent.id);
  const { data: reports } = await supabase.from('parent_reports').select('*').eq('parent_id', parent.id).order('created_at', { ascending: false }).limit(10);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ParentSidebar parentName={parent.full_name} />
      <main className="flex-1 p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Progress Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Weekly AI-generated reports for your children</p>
          </div>

          {reports?.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <h2 className="font-bold text-gray-900 mb-2">No reports yet</h2>
              <p className="text-gray-500 text-sm">Weekly reports are generated automatically every Monday</p>
            </div>
          )}

          {reports?.map(report => (
            <div key={report.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {report.report_type === 'weekly' ? '📅 Weekly Report' : '📊 Report'}
                  </h2>
                  <p className="text-sm text-gray-500">{new Date(report.report_date).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {report.sent_via_whatsapp && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">📱 WhatsApp sent</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Missions', value: report.content?.missions_completed || 0, icon: '🎯' },
                  { label: 'Homework', value: report.content?.homework_submitted || 0, icon: '📝' },
                  { label: 'Streak', value: `${report.content?.study_streak || 0} days`, icon: '🔥' },
                  { label: 'Exam Ready', value: `${report.content?.exam_readiness || 0}%`, icon: '📚' },
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl">{stat.icon}</div>
                    <div className="font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {report.content?.summary && (
                <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{report.content.summary}</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
