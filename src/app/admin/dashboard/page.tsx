import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminCharts from '@/components/admin/AdminCharts';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') redirect('/student/dashboard');

  const [
    { count: totalStudents },
    { count: totalParents },
    { data: students },
    { data: subjects },
    { data: whatsappLogs },
    { data: homeworkData },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('parents').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('risk_status, school_level, created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('subjects').select('name, school_level').eq('is_active', true),
    supabase.from('whatsapp_logs').select('status').limit(100),
    supabase.from('ai_marking_results').select('percentage').limit(100),
  ]);

  const riskCounts = {
    stable: students?.filter(s => s.risk_status === 'stable').length || 0,
    needs_attention: students?.filter(s => s.risk_status === 'needs_attention').length || 0,
    at_risk: students?.filter(s => s.risk_status === 'at_risk').length || 0,
  };

  const levelCounts = {
    preschool: students?.filter(s => s.school_level === 'preschool').length || 0,
    primary: students?.filter(s => s.school_level === 'primary').length || 0,
    secondary: students?.filter(s => s.school_level === 'secondary').length || 0,
    pre_university: students?.filter(s => s.school_level === 'pre_university').length || 0,
  };

  const avgScore = homeworkData?.length
    ? (homeworkData.reduce((s, h) => s + (h.percentage || 0), 0) / homeworkData.length).toFixed(1)
    : 0;

  const pieData = [
    { name: 'Stable', value: riskCounts.stable, color: '#10B981' },
    { name: 'Needs Attention', value: riskCounts.needs_attention, color: '#F59E0B' },
    { name: 'At Risk', value: riskCounts.at_risk, color: '#EF4444' },
  ];

  const barData = [
    { name: 'Preschool', count: levelCounts.preschool },
    { name: 'Primary', count: levelCounts.primary },
    { name: 'Secondary', count: levelCounts.secondary },
    { name: 'Pre-Uni', count: levelCounts.pre_university },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">LearnMate AI Platform Overview</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: totalStudents || 0, icon: '🎓', color: 'bg-blue-50 text-blue-600' },
              { label: 'Total Parents', value: totalParents || 0, icon: '👨‍👩‍👧', color: 'bg-purple-50 text-purple-600' },
              { label: 'Active Subjects', value: subjects?.length || 0, icon: '📚', color: 'bg-green-50 text-green-600' },
              { label: 'Avg Homework Score', value: `${avgScore}%`, icon: '📝', color: 'bg-orange-50 text-orange-600' },
            ].map(stat => (
              <div key={stat.label} className={`card flex items-center gap-3`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.color.split(' ')[0]}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <AdminCharts barData={barData} pieData={pieData} />

          {/* WhatsApp Stats */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">📱 WhatsApp Notifications</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Sent', value: whatsappLogs?.filter(l => l.status === 'sent').length || 0, color: 'text-green-600' },
                { label: 'Delivered', value: whatsappLogs?.filter(l => l.status === 'delivered').length || 0, color: 'text-blue-600' },
                { label: 'Failed', value: whatsappLogs?.filter(l => l.status === 'failed').length || 0, color: 'text-red-600' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Students */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">🆕 Recent Registrations</h2>
            <div className="space-y-2">
              {students?.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 capitalize">{s.school_level}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.risk_status === 'stable' ? 'bg-green-100 text-green-700' :
                      s.risk_status === 'needs_attention' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{s.risk_status}</span>
                    <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
