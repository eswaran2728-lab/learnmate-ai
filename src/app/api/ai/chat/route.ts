import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, AI_MODEL } from '@/lib/openai/client';
import { buildTeacherSystemPrompt } from '@/lib/openai/prompts';
import type { TeachingMode, LearningStyle, LearningSpeed } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages, studentAge, schoolLevel, currentAgeLevel, targetAgeLevel,
      subjectName, teachingMode, preferredLanguage, studentName,
    } = body;

    const systemPrompt = buildTeacherSystemPrompt({
      studentAge,
      schoolLevel,
      currentAgeLevel,
      targetAgeLevel,
      subject: subjectName,
      teachingMode: (teachingMode as TeachingMode) || 'normal',
      learningStyle: 'visual' as LearningStyle,
      learningSpeed: 'average' as LearningSpeed,
      preferredLanguage: preferredLanguage || 'en',
      studentName,
    });

    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-20), // Keep last 20 messages for context
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content || 'I had trouble responding. Please try again!';
    return NextResponse.json({ message });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { message: 'Sorry, I\'m having trouble right now. Please try again in a moment! 😊' },
      { status: 200 }
    );
  }
}
