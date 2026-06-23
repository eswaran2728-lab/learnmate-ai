import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') redirect('/student/dashboard');

  const [
    { data: markingResults },
    { data: missions },
    { data: whatsappLogs },
    { data: achievements },
  ] = await Promise.all([
    supabase.from('ai_marking_results').select('percentage, marked_at').order('marked_at', { ascending: false }).limit(200),
    supabase.from('daily_missions').select('status, mission_date').order('mission_date', { ascending: false }).limit(200),
    supabase.from('whatsapp_logs').select('message_type, status, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('achievements').select('badge_type').limit(200),
  ]);

  const completedMissions = missions?.filter(m => m.status === 'completed').length || 0;
  const totalMissions = missions?.length || 0;
  const completionRate = totalMissions > 0 ? ((completedMissions / totalMissions) * 100).toFixed(1) : 0;

  const avgScore = markingResults?.length
    ? (markingResults.reduce((s, r) => s + r.percentage, 0) / markingResults.length).toFixed(1)
    : 0;

  const badgeCounts = achievements?.reduce((acc: Record<string, number>, a) => {
    acc[a.badge_type] = (acc[a.badge_type] || 0) + 1;
    return acc;
  }, {});

  const topBadges = Object.entries(badgeCounts || {}).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">📊 Analytics</h1>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600">{avgScore}%</div>
              <div className="text-sm text-gray-500">Avg Homework Score</div>
              <div className="text-xs text-gray-400">{markingResults?.length} submissions</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
              <div className="text-sm text-gray-500">Mission Completion Rate</div>
              <div className="text-xs text-gray-400">{completedMissions}/{totalMissions} completed</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-600">{achievements?.length || 0}</div>
              <div className="text-sm text-gray-500">Total Badges Earned</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">Top Badges Earned</h2>
              <div className="space-y-2">
                {topBadges.map(([badge, count]) => (
                  <div key={badge} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700 capitalize">{badge.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-primary-600">{count}×</span>
                  </div>
                ))}
                {topBadges.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No badges earned yet</p>}
              </div>
            </div>

            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">WhatsApp Log</h2>
              <div className="space-y-2">
                {whatsappLogs?.slice(0, 8).map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700 capitalize">{log.message_type?.replace(/_/g, ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.status === 'sent' || log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{log.status}</span>
                  </div>
                ))}
                {!whatsappLogs?.length && <p className="text-sm text-gray-400 text-center py-4">No WhatsApp logs yet</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
