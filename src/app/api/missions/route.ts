import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0];

    // Check if mission already exists
    const { data: existing } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('student_id', studentId)
      .eq('mission_date', today)
      .single();

    if (existing) return NextResponse.json({ mission: existing });

    // Get student's learning levels to build mission
    const { data: levels } = await supabase
      .from('learning_levels')
      .select('*, subjects(*)')
      .eq('student_id', studentId)
      .limit(3);

    const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();

    if (!levels?.length) return NextResponse.json({ error: 'No levels found' }, { status: 400 });

    // Build tasks from weak subjects
    const tasks = levels.map((level, i) => ({
      subject_id: level.subject_id,
      subject_name: level.subjects?.name || 'Subject',
      subject_icon: level.subjects?.icon || '📚',
      duration_minutes: i === 0 ? 20 : 15,
      type: i === 0 ? 'lesson' : i === 1 ? 'practice' : 'homework',
      status: 'pending',
      topic: `Level ${level.current_age_level} Review`,
    }));

    const totalMinutes = tasks.reduce((s: number, t: { duration_minutes: number }) => s + t.duration_minutes, 0);

    const { data: mission } = await supabase.from('daily_missions').insert({
      student_id: studentId,
      mission_date: today,
      tasks,
      total_minutes: totalMinutes,
      completed_minutes: 0,
      status: 'pending',
      completion_percentage: 0,
    }).select().single();

    return NextResponse.json({ mission });
  } catch (error) {
    console.error('Mission creation error:', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}
