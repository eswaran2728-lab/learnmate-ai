'use client';

import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatStreak, getLevelLabel, getExamReadinessLabel, BADGE_DEFINITIONS } from '@/lib/utils';
import type { Student, LearningLevel, DailyMission, Homework, Achievement, ExamReadiness, ProgressData } from '@/types';

interface Props {
  student: Student & { age_groups?: { name: string } };
  levels: (LearningLevel & { subjects?: { name: string; icon: string; color: string } })[];
  todayMission: DailyMission | null;
  homework: (Homework & { subjects?: { name: string; icon: string } })[];
  achievements: Achievement[];
  examReadiness: ExamReadiness | null;
  progressData: ProgressData[];
}

export default function StudentDashboardClient({ student, levels, todayMission, homework, achievements, examReadiness, progressData }: Props) {
  const examLabel = getExamReadinessLabel(examReadiness?.overall_score || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeGreeting()}, {student.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {student.age_groups?.name} • {formatStreak(student.study_streak)}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          student.risk_status === 'stable' ? 'bg-green-100 text-green-700' :
          student.risk_status === 'needs_attention' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {student.risk_status === 'stable' ? '✅ Stable' :
           student.risk_status === 'needs_attention' ? '⚠️ Needs Attention' : '🚨 At Risk'}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl font-bold text-primary-600">{student.study_streak}</div>
          <div className="text-sm text-gray-500">Day Streak 🔥</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-bold text-purple-600">{levels.length}</div>
          <div className="text-sm text-gray-500">Subjects Active</div>
        </div>
        <div className="stat-card">
          <div className={`text-2xl font-bold ${examLabel.color}`}>{examReadiness?.overall_score?.toFixed(0) || 0}%</div>
          <div className="text-sm text-gray-500">Exam Readiness</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-bold text-green-600">{achievements.length}</div>
          <div className="text-sm text-gray-500">Achievements 🏆</div>
        </div>
      </div>

      {/* Today's Mission */}
      {todayMission && (
        <div className="card border-l-4 border-l-primary-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">🎯 Today&apos;s Mission</h2>
              <p className="text-sm text-gray-500">{todayMission.completed_minutes}/{todayMission.total_minutes} min completed</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              todayMission.status === 'completed' ? 'bg-green-100 text-green-700' :
              todayMission.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              todayMission.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {todayMission.status.replace('_', ' ')}
            </span>
          </div>
          <div className="progress-bar mb-4">
            <div className="progress-fill" style={{ width: `${todayMission.completion_percentage}%` }} />
          </div>
          <div className="space-y-2">
            {todayMission.tasks?.slice(0, 3).map((task, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{task.subject_icon || '📚'}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{task.subject_name}</div>
                    <div className="text-xs text-gray-500">{task.topic} • {task.duration_minutes} min</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {task.status === 'completed' ? '✓ Done' : task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
          <Link href="/student/missions" className="btn-primary w-full mt-4 text-center block text-sm">
            {todayMission.status === 'completed' ? 'View Mission Summary' : 'Continue Mission →'}
          </Link>
        </div>
      )}

      {/* Subject Levels */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">📊 Your Subject Levels</h2>
          <Link href="/student/learn" className="text-xs text-primary-600 font-medium">View All</Link>
        </div>
        <div className="space-y-3">
          {levels.map(level => {
            const { label, color } = getLevelLabel(level.current_age_level, student.age);
            return (
              <div key={level.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>{level.subjects?.icon || '📚'}</span>
                    <span className="text-sm font-medium text-gray-800">{level.subjects?.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">Age {level.current_age_level} Level</div>
                    <div className={`text-xs ${color}`}>{label}</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${level.progress_percentage}%` }} />
                </div>
              </div>
            );
          })}
          {levels.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Complete the AI diagnostic test to see your levels.
            </p>
          )}
        </div>
      </div>

      {/* Progress Chart + Homework row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Progress Chart */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">📈 Study Progress (7 Days)</h2>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={[...progressData].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="tracked_date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="minutes_studied" stroke="#2563EB" fill="#EFF6FF" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400">
              Start studying to see your progress chart!
            </div>
          )}
        </div>

        {/* Pending Homework */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">📝 Homework Due</h2>
            <Link href="/student/homework" className="text-xs text-primary-600 font-medium">View All</Link>
          </div>
          <div className="space-y-2">
            {homework.map(hw => (
              <Link key={hw.id} href={`/student/homework/${hw.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-primary-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span>{hw.subjects?.icon || '📝'}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{hw.title}</div>
                    <div className="text-xs text-gray-500">{hw.subjects?.name}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  hw.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {hw.status}
                </span>
              </Link>
            ))}
            {homework.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">🎉 No pending homework!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">🏆 Recent Achievements</h2>
            <Link href="/student/achievements" className="text-xs text-primary-600 font-medium">View All</Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {achievements.map(a => {
              const badge = BADGE_DEFINITIONS[a.badge_type] || { icon: '🏆', name: a.badge_name };
              return (
                <div key={a.id} className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl px-3 py-2">
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{badge.name}</div>
                    <div className="text-xs text-gray-500">{new Date(a.earned_at).toLocaleDateString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
