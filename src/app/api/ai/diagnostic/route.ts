import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai/client';
import { buildDiagnosticPrompt } from '@/lib/openai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { subjectName, studentAge, schoolLevel, currentForm } = await req.json();

    const prompt = buildDiagnosticPrompt({ subject: subjectName, studentAge, schoolLevel, currentForm });

    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ questions: [], error: 'Failed to generate questions' }, { status: 500 });
  }
}
