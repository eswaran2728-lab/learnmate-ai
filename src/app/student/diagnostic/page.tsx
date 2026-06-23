'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DiagnosticQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correct_answer: string;
  age_level: number;
  topic: string;
  difficulty: string;
  marks: number;
}

interface SubjectTest {
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  questions: DiagnosticQuestion[];
  answers: Record<string, string>;
  completed: boolean;
}

export default function DiagnosticPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'select' | 'test' | 'processing' | 'done'>('intro');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ id: string; name: string; icon: string; school_level: string }>>([]);
  const [student, setStudent] = useState<{ id: string; age: number; school_level: string; current_form: string; full_name: string } | null>(null);
  const [tests, setTests] = useState<SubjectTest[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ subject: string; detected_level: number; school_age: number }>>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase.from('students').select('*').eq('user_id', user.id).single();
      if (!studentData) return;
      setStudent(studentData);

      const { data: subjects } = await supabase.from('subjects').select('*').eq('is_active', true)
        .in('school_level', [studentData.school_level, 'all']);
      setAvailableSubjects(subjects || []);
    }
    load();
  }, []);

  function toggleSubject(id: string) {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function startDiagnostic() {
    if (selectedSubjects.length === 0) return;
    setLoading(true);
    const newTests: SubjectTest[] = [];

    for (const subjectId of selectedSubjects) {
      const subject = availableSubjects.find(s => s.id === subjectId)!;
      try {
        const res = await fetch('/api/ai/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            subjectName: subject.name,
            studentAge: student?.age,
            schoolLevel: student?.school_level,
            currentForm: student?.current_form,
          }),
        });
        const data = await res.json();
        newTests.push({
          subjectId,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          questions: data.questions || [],
          answers: {},
          completed: false,
        });
      } catch {
        // If AI fails, create simple placeholder questions
        newTests.push({
          subjectId,
          subjectName: subject.name,
          subjectIcon: subject.icon,
          questions: getPlaceholderQuestions(subject.name),
          answers: {},
          completed: false,
        });
      }
    }

    setTests(newTests);
    setStep('test');
    setLoading(false);
  }

  function answerQuestion(answer: string) {
    const currentTest = tests[currentTestIndex];
    const updatedTests = [...tests];
    updatedTests[currentTestIndex] = {
      ...currentTest,
      answers: { ...currentTest.answers, [currentTest.questions[currentQuestionIndex].id]: answer },
    };
    setTests(updatedTests);

    const isLastQuestion = currentQuestionIndex === currentTest.questions.length - 1;
    const isLastTest = currentTestIndex === tests.length - 1;

    if (isLastQuestion) {
      updatedTests[currentTestIndex].completed = true;
      if (isLastTest) {
        submitDiagnostic(updatedTests);
      } else {
        setCurrentTestIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    setTests(updatedTests);
  }

  async function submitDiagnostic(finalTests: SubjectTest[]) {
    setStep('processing');
    const supabase = createClient();

    const newResults = [];
    for (const test of finalTests) {
      const correctCount = test.questions.filter(q => {
        const ans = test.answers[q.id]?.toLowerCase().trim();
        return ans === q.correct_answer.toLowerCase().trim();
      }).length;
      const scorePercent = (correctCount / test.questions.length) * 100;

      // Detect level based on score (simplified)
      const maxAgeLevel = test.questions.reduce((m, q) => Math.max(m, q.age_level), 0);
      const detectedLevel = Math.max(4, Math.round(maxAgeLevel * (scorePercent / 100)));
      const schoolAge = student?.age || 13;

      newResults.push({
        subject: test.subjectName,
        subjectId: test.subjectId,
        detected_level: detectedLevel,
        school_age: schoolAge,
        score: scorePercent,
        answers: test.answers,
        questions: test.questions,
      });

      // Save to DB
      const { data: diagTest } = await supabase.from('diagnostic_tests').insert({
        student_id: student?.id,
        subject_id: test.subjectId,
        status: 'completed',
        questions: test.questions,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }).select().single();

      if (diagTest) {
        const weakTopics = test.questions.filter(q => test.answers[q.id] !== q.correct_answer).map(q => q.topic);
        const strongTopics = test.questions.filter(q => test.answers[q.id] === q.correct_answer).map(q => q.topic);

        await supabase.from('diagnostic_results').insert({
          diagnostic_test_id: diagTest.id,
          student_id: student?.id,
          subject_id: test.subjectId,
          detected_age_level: detectedLevel,
          school_age: schoolAge,
          score: scorePercent,
          weak_topics: [...new Set(weakTopics)],
          strong_topics: [...new Set(strongTopics)],
          missing_foundations: weakTopics.filter(t => test.questions.find(q => q.topic === t && q.age_level <= 10)),
          learning_speed: 'average',
          learning_style: 'visual',
        });

        await supabase.from('learning_levels').upsert({
          student_id: student?.id,
          subject_id: test.subjectId,
          current_age_level: detectedLevel,
          target_age_level: schoolAge,
          progress_percentage: 0,
        }, { onConflict: 'student_id,subject_id' });
      }
    }

    // Mark diagnostic complete
    if (student) {
      await supabase.from('students').update({ diagnostic_complete: true }).eq('id', student.id);
      await supabase.from('achievements').insert({
        student_id: student.id,
        badge_type: 'diagnostic_done',
        badge_name: 'Diagnostic Done',
        badge_description: 'Completed the AI diagnostic test',
        badge_icon: '🧠',
      });
    }

    setResults(newResults);
    setStep('done');
  }

  const currentTest = tests[currentTestIndex];
  const currentQuestion = currentTest?.questions[currentQuestionIndex];
  const totalQuestions = tests.reduce((s, t) => s + t.questions.length, 0);
  const answeredQuestions = tests.reduce((s, t) => s + Object.keys(t.answers).length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl">

        {/* Intro */}
        {step === 'intro' && (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">AI Diagnostic Test</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Hi <strong>{student?.full_name?.split(' ')[0]}</strong>! Before we start teaching,
              our AI needs to find your <strong>actual level</strong> in each subject.
              This is not an exam — just a friendly check-up! 😊
            </p>
            <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left">
              <div className="text-sm font-medium text-primary-800 mb-2">What happens:</div>
              <ul className="text-sm text-primary-700 space-y-1">
                <li>✅ 10 questions per subject (starts easy, gets harder)</li>
                <li>✅ Takes about 10-15 minutes per subject</li>
                <li>✅ AI finds your real knowledge level</li>
                <li>✅ Creates your personal learning path</li>
              </ul>
            </div>
            <button onClick={() => setStep('select')} className="btn-primary px-8">
              Let&apos;s Start! →
            </button>
          </div>
        )}

        {/* Subject Selection */}
        {step === 'select' && (
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Choose your subjects</h2>
            <p className="text-gray-500 text-sm mb-6">Select the subjects you want to be tested in</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableSubjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedSubjects.includes(subject.id)
                      ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{subject.icon}</span>
                  <span className="text-sm font-medium text-gray-800">{subject.name}</span>
                  {selectedSubjects.includes(subject.id) && <span className="ml-auto text-primary-600">✓</span>}
                </button>
              ))}
            </div>
            <button
              onClick={startDiagnostic}
              disabled={selectedSubjects.length === 0 || loading}
              className="btn-primary w-full"
            >
              {loading ? 'Generating questions...' : `Start Test (${selectedSubjects.length} subjects) →`}
            </button>
          </div>
        )}

        {/* Test */}
        {step === 'test' && currentTest && currentQuestion && (
          <div className="p-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
              <span>{currentTest.subjectIcon} {currentTest.subjectName}</span>
              <span>Question {currentQuestionIndex + 1}/{currentTest.questions.length}</span>
            </div>
            <div className="progress-bar mb-6">
              <div className="progress-fill" style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }} />
            </div>

            <div className="mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty} • {currentQuestion.topic}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentQuestion.question}</h3>

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => answerQuestion(option)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all font-medium text-gray-800"
                  >
                    <span className="text-primary-600 mr-3">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="Type your answer here..."
                  id="shortAnswer"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('shortAnswer') as HTMLTextAreaElement;
                    answerQuestion(el.value);
                    el.value = '';
                  }}
                  className="btn-primary w-full mt-3"
                >
                  Submit Answer →
                </button>
              </div>
            )}

            <button onClick={() => answerQuestion('skip')} className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-600">
              Skip this question
            </button>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4 animate-pulse">🤖</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">AI is analysing your results...</h2>
            <p className="text-gray-500 text-sm">Creating your personalised learning path</p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <p>🔍 Identifying your knowledge level...</p>
              <p>📊 Detecting weak and strong topics...</p>
              <p>🗺️ Building your learning path...</p>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">Diagnostic Complete!</h2>
              <p className="text-gray-500 text-sm mt-1">Here&apos;s what we found about your knowledge levels</p>
            </div>
            <div className="space-y-3 mb-6">
              {results.map((r, i) => {
                const gap = r.school_age - r.detected_level;
                return (
                  <div key={i} className={`p-4 rounded-xl border-2 ${
                    gap <= 0 ? 'border-green-200 bg-green-50' :
                    gap <= 2 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{r.subject}</span>
                      <span className={`text-sm font-bold ${
                        gap <= 0 ? 'text-green-700' : gap <= 2 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        Age {r.detected_level} Level
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {gap <= 0 ? '✅ On track with your age group!' :
                       `⚠️ ${gap} year${gap > 1 ? 's' : ''} behind — we will rebuild from foundations`}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => router.push('/student/dashboard')} className="btn-primary w-full">
              Start Learning Now 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getPlaceholderQuestions(subject: string): DiagnosticQuestion[] {
  return [
    { id: 'q1', question: `What is 5 + 3?`, type: 'multiple_choice', options: ['6', '7', '8', '9'], correct_answer: '8', age_level: 7, topic: 'Basic Addition', difficulty: 'easy', marks: 1 },
    { id: 'q2', question: `What is 12 × 4?`, type: 'multiple_choice', options: ['44', '48', '52', '56'], correct_answer: '48', age_level: 9, topic: 'Multiplication', difficulty: 'easy', marks: 1 },
    { id: 'q3', question: `Solve: 2x + 6 = 14. What is x?`, type: 'multiple_choice', options: ['3', '4', '5', '6'], correct_answer: '4', age_level: 13, topic: 'Basic Algebra', difficulty: 'medium', marks: 2 },
  ];
}
