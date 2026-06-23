'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Homework, HomeworkQuestion } from '@/types';

interface Props {
  student: { id: string; full_name: string; age: number };
  pending: (Homework & { subjects?: { name: string; icon: string; color: string } })[];
  submitted: (Homework & { subjects?: { name: string; icon: string }; homework_submissions?: Array<{ ai_marking_results?: Array<{ score: number; max_score: number; percentage: number; feedback: { overall: string; encouragement: string } }> }> })[];
  subjects: Array<{ id: string; name: string; icon: string; code: string }>;
}

export default function HomeworkClient({ student, pending, submitted, subjects }: Props) {
  const [tab, setTab] = useState<'pending' | 'submitted' | 'generate'>('pending');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genSubject, setGenSubject] = useState('');
  const [generatedHW, setGeneratedHW] = useState<{ title: string; questions: HomeworkQuestion[] } | null>(null);

  async function generateHomework() {
    if (!genSubject) return;
    setGenerating(true);
    try {
      const subject = subjects.find(s => s.id === genSubject);
      const res = await fetch('/api/ai/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject?.name,
          topic: 'Current topic',
          ageLevel: student.age - 1,
          studentAge: student.age,
          difficultyMix: { easy: 3, medium: 3, hard: 2 },
          weakAreas: [],
        }),
      });
      const data = await res.json();
      if (data.title) {
        const supabase = createClient();
        await supabase.from('homework').insert({
          student_id: student.id,
          subject_id: genSubject,
          title: data.title,
          questions: data.questions,
          due_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          status: 'assigned',
        });
        setGeneratedHW(data);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function submitHomework() {
    if (!selectedHomework) return;
    setSubmitting(true);
    const supabase = createClient();

    const answerArray = Object.entries(answers).map(([id, answer]) => ({ question_id: id, answer }));

    const { data: submission } = await supabase.from('homework_submissions').insert({
      homework_id: selectedHomework.id,
      student_id: student.id,
      answers: answerArray,
      submission_type: 'typed',
    }).select().single();

    if (submission) {
      await supabase.from('homework').update({ status: 'submitted' }).eq('id', selectedHomework.id);
      // Trigger AI marking
      await fetch('/api/ai/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          homeworkId: selectedHomework.id,
          studentId: student.id,
        }),
      });
      setSubmitSuccess(true);
      setSelectedHomework(null);
      setAnswers({});
    }
    setSubmitting(false);
  }

  if (selectedHomework) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedHomework(null)} className="text-sm text-primary-600 font-medium flex items-center gap-1">
          ← Back to Homework
        </button>
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{selectedHomework.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{selectedHomework.questions.length} questions</p>

          <div className="space-y-6">
            {selectedHomework.questions.map((q: HomeworkQuestion, i: number) => (
              <div key={q.id} className="border-b border-gray-100 pb-5 last:border-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>{q.difficulty}</span>
                    <span className="text-xs text-gray-500">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Q{i + 1}</span>
                </div>
                <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                {q.type === 'multiple_choice' && q.options ? (
                  <div className="space-y-2">
                    {q.options.map((opt, j) => (
                      <label key={j} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[q.id] === opt ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="radio" name={q.id} value={opt} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))} className="text-primary-600" />
                        <span className="text-sm text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    className="input-field h-20 resize-none"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
          </div>

          <button onClick={submitHomework} disabled={submitting} className="btn-primary w-full mt-4">
            {submitting ? 'Submitting & AI Marking...' : 'Submit for AI Marking 🤖'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📝 Homework</h1>

      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4">
          ✅ Homework submitted! AI is marking it now. Check back in a moment.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'pending', label: `Pending (${pending.length})` },
          { key: 'submitted', label: `Submitted (${submitted.length})` },
          { key: 'generate', label: '+ Generate New' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'pending' | 'submitted' | 'generate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 && <div className="card text-center py-10 text-gray-400">🎉 No pending homework!</div>}
          {pending.map(hw => (
            <div key={hw.id} className="card-hover" onClick={() => setSelectedHomework(hw)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{hw.subjects?.icon || '📝'}</span>
                  <div>
                    <div className="font-medium text-gray-900">{hw.title}</div>
                    <div className="text-sm text-gray-500">{hw.subjects?.name} • {hw.questions?.length} questions</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${hw.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {hw.status}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">{hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No due date'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'submitted' && (
        <div className="space-y-3">
          {submitted.length === 0 && <div className="card text-center py-10 text-gray-400">No submitted homework yet</div>}
          {submitted.map(hw => {
            const marking = hw.homework_submissions?.[0]?.ai_marking_results?.[0];
            return (
              <div key={hw.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{hw.subjects?.icon || '📝'}</span>
                    <div>
                      <div className="font-medium text-gray-900">{hw.title}</div>
                      <div className="text-sm text-gray-500">{hw.subjects?.name}</div>
                    </div>
                  </div>
                  {marking && (
                    <div className="text-right">
                      <div className={`text-xl font-bold ${marking.percentage >= 70 ? 'text-green-600' : marking.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {marking.percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">{marking.score}/{marking.max_score} marks</div>
                    </div>
                  )}
                </div>
                {marking?.feedback?.overall && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    💬 {marking.feedback.overall}
                  </div>
                )}
                {marking?.feedback?.encouragement && (
                  <div className="text-sm text-green-700 mt-2">✨ {marking.feedback.encouragement}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'generate' && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Generate AI Homework</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
              <select value={genSubject} onChange={e => setGenSubject(e.target.value)} className="input-field">
                <option value="">Choose subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <button onClick={generateHomework} disabled={!genSubject || generating} className="btn-primary w-full">
              {generating ? 'AI is creating homework...' : 'Generate Homework 🤖'}
            </button>
            {generatedHW && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="font-medium text-green-800">✅ Homework created: {generatedHW.title}</div>
                <div className="text-sm text-green-600 mt-1">{generatedHW.questions?.length} questions added to Pending tab</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
