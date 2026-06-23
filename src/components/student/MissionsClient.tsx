'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DailyMission, MissionTask } from '@/types';

interface Props {
  student: { id: string; full_name: string; study_streak: number };
  todayMission: DailyMission | null;
  recentMissions: DailyMission[];
}

export default function MissionsClient({ student, todayMission, recentMissions }: Props) {
  const router = useRouter();
  const [mission, setMission] = useState<DailyMission | null>(todayMission);
  const [generating, setGenerating] = useState(false);

  async function generateMission() {
    setGenerating(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await res.json();
      if (data.mission) setMission(data.mission);
    } finally {
      setGenerating(false);
    }
  }

  async function completeTask(taskIndex: number) {
    if (!mission) return;
    const supabase = createClient();
    const updatedTasks = mission.tasks.map((t: MissionTask, i: number) =>
      i === taskIndex ? { ...t, status: 'completed' } : t
    );
    const completedCount = updatedTasks.filter((t: MissionTask) => t.status === 'completed').length;
    const completedMinutes = updatedTasks.filter((t: MissionTask) => t.status === 'completed').reduce((s: number, t: MissionTask) => s + t.duration_minutes, 0);
    const completionPct = (completedCount / updatedTasks.length) * 100;
    const isComplete = completionPct === 100;

    const updated = {
      ...mission,
      tasks: updatedTasks,
      completed_minutes: completedMinutes,
      completion_percentage: completionPct,
      status: (isComplete ? 'completed' : 'in_progress') as DailyMission['status'],
    };
    setMission(updated);

    await supabase.from('daily_missions').update({
      tasks: updatedTasks,
      completed_minutes: completedMinutes,
      completion_percentage: completionPct,
      status: isComplete ? 'completed' : 'in_progress',
    }).eq('id', mission.id);

    if (isComplete) {
      // Update streak
      await supabase.from('students').update({ study_streak: student.study_streak + 1, last_active_at: new Date().toISOString() }).eq('id', student.id);
    }
  }

  const today = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎯 Daily Missions</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {/* Streak */}
      <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🔥</div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{student.study_streak} Day Streak</div>
            <div className="text-sm text-orange-500">Keep it going! Study every day to maintain your streak.</div>
          </div>
        </div>
      </div>

      {/* Today's Mission */}
      {!mission ? (
        <div className="card text-center py-10">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No mission yet today</h2>
          <p className="text-gray-500 text-sm mb-6">Generate your personalised daily mission based on your weak areas</p>
          <button onClick={generateMission} disabled={generating} className="btn-primary px-8">
            {generating ? 'Creating mission...' : 'Generate Today\'s Mission 🚀'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Today&apos;s Mission</h2>
              <p className="text-sm text-gray-500">{mission.completed_minutes}/{mission.total_minutes} minutes completed</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mission.status === 'completed' ? 'bg-green-100 text-green-700' :
              mission.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {mission.status === 'completed' ? '✅ Completed!' :
               mission.status === 'in_progress' ? '⚡ In Progress' : '📋 Pending'}
            </span>
          </div>

          <div className="progress-bar mb-5">
            <div className="progress-fill" style={{ width: `${mission.completion_percentage}%` }} />
          </div>
          <p className="text-xs text-right text-gray-400 -mt-4 mb-4">{mission.completion_percentage.toFixed(0)}% complete</p>

          <div className="space-y-3">
            {mission.tasks?.map((task: MissionTask, i: number) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                task.status === 'completed' ? 'border-green-200 bg-green-50' :
                task.status === 'in_progress' ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'
              }`}>
                <span className="text-2xl">{task.subject_icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{task.subject_name}</div>
                  <div className="text-sm text-gray-500">{task.topic} • {task.duration_minutes} min • {task.type}</div>
                </div>
                {task.status === 'completed' ? (
                  <span className="text-green-600 font-bold text-lg">✓</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/student/chat?subject=${task.subject_id}`)}
                      className="text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      Start Learning
                    </button>
                    <button
                      onClick={() => completeTask(i)}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Mark Done ✓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {mission.status === 'completed' && (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="font-bold text-green-800">Mission Complete!</div>
              <div className="text-sm text-green-600 mt-1">Amazing work today! Your streak is growing 🔥</div>
            </div>
          )}
        </div>
      )}

      {/* Recent Missions */}
      {recentMissions.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">📅 Recent Missions</h2>
          <div className="space-y-2">
            {recentMissions.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="text-sm text-gray-700">{new Date(m.mission_date).toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 progress-bar">
                    <div className="progress-fill" style={{ width: `${m.completion_percentage}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${
                    m.status === 'completed' ? 'text-green-600' :
                    m.status === 'missed' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {m.completion_percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
