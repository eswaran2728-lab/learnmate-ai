import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai/client';
import { buildLearningPathPrompt } from '@/lib/openai/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, subjectId } = body;

    const supabase = await createClient();

    const [{ data: student }, { data: subject }, { data: diagnosticResult }, { data: level }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).single(),
      supabase.from('subjects').select('*').eq('id', subjectId).single(),
      supabase.from('diagnostic_results').select('*').eq('student_id', studentId).eq('subject_id', subjectId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('learning_levels').select('*').eq('student_id', studentId).eq('subject_id', subjectId).single(),
    ]);

    if (!student || !subject) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const prompt = buildLearningPathPrompt({
      subject: subject.name,
      studentAge: student.age,
      currentLevel: level?.current_age_level || student.age - 2,
      targetLevel: level?.target_age_level || student.age,
      weakTopics: diagnosticResult?.weak_topics || [],
      missingFoundations: diagnosticResult?.missing_foundations || [],
      learningSpeed: diagnosticResult?.learning_speed || 'average',
    });

    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    const pathData = JSON.parse(content || '{}');

    // Save learning path
    const { data: savedPath } = await supabase.from('learning_paths').upsert({
      student_id: studentId,
      subject_id: subjectId,
      title: pathData.title,
      description: pathData.description,
      topics: pathData.topics || [],
      estimated_weeks: pathData.estimated_weeks,
      status: 'active',
    }, { onConflict: 'student_id,subject_id' }).select().single();

    return NextResponse.json({ path: savedPath, topics: pathData.topics });
  } catch (error) {
    console.error('Learning path error:', error);
    return NextResponse.json({ error: 'Failed to generate learning path' }, { status: 500 });
  }
}
