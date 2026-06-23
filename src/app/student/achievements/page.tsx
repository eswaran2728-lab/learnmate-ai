import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { BADGE_DEFINITIONS } from '@/lib/utils';

export default async function AchievementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (!student) redirect('/register');

  const { data: achievements } = await supabase.from('achievements').select('*').eq('student_id', student.id).order('earned_at', { ascending: false });

  const earnedTypes = new Set(achievements?.map(a => a.badge_type) || []);
  const allBadges = Object.entries(BADGE_DEFINITIONS);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 p-6 pb-24 md:pb-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏆 Achievements</h1>
            <p className="text-gray-500 text-sm mt-1">{achievements?.length || 0} of {allBadges.length} badges earned</p>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((achievements?.length || 0) / allBadges.length) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allBadges.map(([key, badge]) => {
              const earned = earnedTypes.has(key);
              const earnedData = achievements?.find(a => a.badge_type === key);
              return (
                <div key={key} className={`card text-center transition-all ${earned ? 'border-yellow-200 bg-gradient-to-b from-yellow-50 to-orange-50' : 'opacity-50 grayscale'}`}>
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <div className="font-bold text-sm text-gray-900 mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{badge.description}</div>
                  {earned ? (
                    <div className="text-xs text-yellow-700 font-medium bg-yellow-100 rounded-full px-2 py-0.5 inline-block">
                      ✓ Earned {new Date(earnedData?.earned_at || '').toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Not yet earned</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
