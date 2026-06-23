import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ParentSidebar from '@/components/layout/ParentSidebar';
import { getLevelLabel, getRiskColor, formatStreak, getExamReadinessLabel } from '@/lib/utils';

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: parent } = await supabase.from('parents').select('*').eq('user_id', user.id).single();
  if (!parent) redirect('/register');

  const { data: children } = await supabase.from('students').select('*, age_groups(name)').eq('parent_id', parent.id);

  const childData = await Promise.all((children || []).map(async child => {
    const [{ data: levels }, { data: mission }, { data: homework }, { data: examReadiness }] = await Promise.all([
      supabase.from('learning_levels').select('*, subjects(*)').eq('student_id', child.id),
      supabase.from('daily_missions').select('*').eq('student_id', child.id).eq('mission_date', new Date().toISOString().split('T')[0]).single(),
      supabase.from('homework').select('*').eq('student_id', child.id).in('status', ['assigned', 'overdue']),
      supabase.from('exam_readiness').select('*').eq('student_id', child.id).single(),
    ]);
    return { child, levels: levels || [], mission, homework: homework || [], examReadiness };
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ParentSidebar parentName={parent.full_name} />
      <main className="flex-1 p-6 max-w-5xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👨‍👩‍👧 Parent Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {parent.full_name}</p>
          </div>

          {childData.length === 0 && (
            <div className="card text-center py-10">
              <div className="text-4xl mb-3">👶</div>
              <h2 className="font-bold text-gray-900 mb-2">No children linked yet</h2>
              <p className="text-gray-500 text-sm">Ask your child to register and select you as their parent</p>
            </div>
          )}

          {childData.map(({ child, levels, mission, homework, examReadiness }) => {
            const riskClass = getRiskColor(child.risk_status);
            const examLabel = getExamReadinessLabel(examReadiness?.overall_score || 0);

            return (
              <div key={child.id} className="card">
                {/* Child Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {child.full_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">{child.full_name}</h2>
                      <p className="text-sm text-gray-500">Age {child.age} • {child.age_groups?.name} • {child.current_form}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskClass}`}>
                    {child.risk_status === 'stable' ? '✅ Stable' :
                     child.risk_status === 'needs_attention' ? '⚠️ Needs Attention' : '🚨 At Risk'}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-orange-600">{child.study_streak}</div>
                    <div className="text-xs text-orange-500">Day Streak 🔥</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-blue-600">{mission?.completion_percentage?.toFixed(0) || 0}%</div>
                    <div className="text-xs text-blue-500">Today&apos;s Mission</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-red-600">{homework.length}</div>
                    <div className="text-xs text-red-500">Homework Due</div>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${examLabel.color.includes('green') ? 'bg-green-50' : examLabel.color.includes('blue') ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                    <div className={`text-xl font-bold ${examLabel.color}`}>{examReadiness?.overall_score?.toFixed(0) || 0}%</div>
                    <div className="text-xs text-gray-500">Exam Readiness</div>
                  </div>
                </div>

                {/* Subject Levels */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Subject Levels vs Age</h3>
                  <div className="space-y-2">
                    {levels.slice(0, 4).map(level => {
                      const { label, color } = getLevelLabel(level.current_age_level, child.age);
                      return (
                        <div key={level.id} className="flex items-center gap-3">
                          <span className="text-sm w-32 text-gray-700">{level.subjects?.icon} {level.subjects?.name}</span>
                          <div className="flex-1 progress-bar">
                            <div className="progress-fill" style={{ width: `${level.progress_percentage}%` }} />
                          </div>
                          <span className={`text-xs font-medium w-28 text-right ${color}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alerts */}
                {homework.filter(h => h.status === 'overdue').length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    ⚠️ {child.full_name.split(' ')[0]} has {homework.filter(h => h.status === 'overdue').length} overdue homework assignment(s)
                  </div>
                )}

                {mission?.status === 'missed' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 mt-2">
                    📱 Today&apos;s learning mission was not completed. Please encourage {child.full_name.split(' ')[0]} to study.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
