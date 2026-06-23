import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai/client';
import { buildHomeworkPrompt } from '@/lib/openai/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = buildHomeworkPrompt(body);

    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    const parsed = JSON.parse(content || '{}');
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Homework generation error:', error);
    return NextResponse.json({ error: 'Failed to generate homework' }, { status: 500 });
  }
}
