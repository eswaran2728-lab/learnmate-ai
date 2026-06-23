import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai, AI_MODEL } from '@/lib/openai/client';
import { buildMarkingPrompt } from '@/lib/openai/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { submissionId, homeworkId, studentId } = body;

    const supabase = await createClient();

    const { data: submission } = await supabase
      .from('homework_submissions')
      .select('*, homework(*, subjects(name))')
      .eq('id', submissionId)
      .single();

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const { data: student } = await supabase.from('students').select('age').eq('id', studentId).single();

    const prompt = buildMarkingPrompt({
      questions: submission.homework.questions,
      studentAnswers: submission.answers,
      subject: submission.homework.subjects?.name || 'General',
      studentAge: student?.age || 13,
    });

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    const result = JSON.parse(content || '{}');

    // Save marking result
    const { data: markingResult } = await supabase.from('ai_marking_results').insert({
      submission_id: submissionId,
      homework_id: homeworkId,
      student_id: studentId,
      score: result.score || 0,
      max_score: result.max_score || submission.homework.questions.length,
      feedback: result.feedback || {},
    }).select().single();

    // Update homework status
    await supabase.from('homework').update({ status: 'marked' }).eq('id', homeworkId);

    return NextResponse.json({ result: markingResult, feedback: result.feedback });
  } catch (error) {
    console.error('Marking error:', error);
    return NextResponse.json({ error: 'Failed to mark homework' }, { status: 500 });
  }
}
