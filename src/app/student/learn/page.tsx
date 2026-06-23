import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import Link from 'next/link';
import { getLevelLabel } from '@/lib/utils';

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).single();
  if (!student) redirect('/register');

  const { data: levels } = await supabase.from('learning_levels').select('*, subjects(*)').eq('student_id', student.id);
  const { data: paths } = await supabase.from('learning_paths').select('*, subjects(*)').eq('student_id', student.id);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar studentName={student.full_name} />
      <main className="flex-1 p-6 pb-24 md:pb-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📚 My Learning</h1>
            <p className="text-gray-500 text-sm mt-1">Your personalised subjects and learning paths</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {levels?.map(level => {
              const { label, color } = getLevelLabel(level.current_age_level, student.age);
              const path = paths?.find(p => p.subject_id === level.subject_id);
              return (
                <div key={level.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{level.subjects?.icon || '📚'}</div>
                      <div>
                        <div className="font-bold text-gray-900">{level.subjects?.name}</div>
                        <div className={`text-xs font-medium ${color}`}>{label}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-bold text-gray-900">Age {level.current_age_level}</div>
                      <div className="text-gray-400 text-xs">Target: Age {level.target_age_level}</div>
                    </div>
                  </div>

                  <div className="progress-bar mb-2">
                    <div className="progress-fill" style={{ width: `${level.progress_percentage}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{level.progress_percentage.toFixed(0)}% to next level</p>

                  {path ? (
                    <div className="bg-primary-50 rounded-lg p-3 mb-3 text-xs text-primary-700">
                      📍 {path.title} • ~{path.estimated_weeks} weeks
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Link href={`/student/chat?subject=${level.subject_id}`} className="btn-primary flex-1 text-center text-sm py-2">
                      Start Learning
                    </Link>
                    {!path && (
                      <button
                        onClick={async () => {
                          await fetch('/api/ai/learning-path', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ studentId: student.id, subjectId: level.subject_id }),
                          });
                        }}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        Get Path
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {(!levels || levels.length === 0) && (
              <div className="col-span-2 card text-center py-10">
                <div className="text-4xl mb-3">🧪</div>
                <h2 className="font-bold text-gray-900 mb-2">No subjects yet</h2>
                <p className="text-gray-500 text-sm mb-4">Complete the AI diagnostic test to unlock your learning subjects</p>
                <Link href="/student/diagnostic" className="btn-primary">Take Diagnostic Test</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
