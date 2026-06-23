'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('student');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    // Student fields
    dateOfBirth: '', schoolLevel: '', currentForm: '', preferredLanguage: 'en',
    // Parent fields
    parentName: '', whatsappNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, role },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      if (role === 'student') {
        const age = calculateAge(form.dateOfBirth);
        const ageGroupId = await getAgeGroupId(supabase, age);
        await supabase.from('students').insert({
          user_id: authData.user.id,
          full_name: form.fullName,
          date_of_birth: form.dateOfBirth,
          age,
          school_level: form.schoolLevel,
          current_form: form.currentForm,
          age_group_id: ageGroupId,
          preferred_language: form.preferredLanguage,
        });
        router.push('/student/diagnostic');
      } else if (role === 'parent') {
        await supabase.from('parents').insert({
          user_id: authData.user.id,
          full_name: form.fullName,
          whatsapp_number: form.whatsappNumber,
        });
        router.push('/parent/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">L</div>
          <h1 className="text-2xl font-bold text-gray-900">Join LearnMate AI</h1>
          <p className="text-gray-500 text-sm mt-1">Your personal AI teacher awaits</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {(['student', 'parent'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                      role === r ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {r === 'student' ? '🎓 Student' : '👨‍👩‍👧 Parent'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} className="input-field" placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input-field" placeholder="Min 8 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className="input-field" placeholder="Repeat password" required />
            </div>
            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full mt-2">
              Next Step →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            {role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">School Level</label>
                  <select value={form.schoolLevel} onChange={e => update('schoolLevel', e.target.value)} className="input-field" required>
                    <option value="">Select level</option>
                    <option value="preschool">Preschool (Age 4–6)</option>
                    <option value="primary">Primary School (Age 7–12)</option>
                    <option value="secondary">Secondary School (Form 1–5)</option>
                    <option value="pre_university">Pre-University (Form 6 / STPM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Form / Standard</label>
                  <input type="text" value={form.currentForm} onChange={e => update('currentForm', e.target.value)} className="input-field" placeholder="e.g. Form 4, Standard 5, Year 2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Learning Language</label>
                  <select value={form.preferredLanguage} onChange={e => update('preferredLanguage', e.target.value)} className="input-field">
                    <option value="en">English</option>
                    <option value="ms">Bahasa Melayu</option>
                    <option value="ta">Tamil</option>
                    <option value="zh">Mandarin</option>
                  </select>
                </div>
              </>
            )}
            {role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                <input type="tel" value={form.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value)} className="input-field" placeholder="+60 12-345 6789" />
                <p className="text-xs text-gray-400 mt-1">For receiving progress alerts about your child</p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating account...' : 'Create Account 🎉'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}

function calculateAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

async function getAgeGroupId(supabase: ReturnType<typeof import('@/lib/supabase/client').createClient>, age: number): Promise<string | null> {
  const level = age <= 6 ? 'preschool' : age <= 12 ? 'primary' : age <= 17 ? 'secondary' : 'pre_university';
  const { data } = await supabase.from('age_groups').select('id').eq('level', level).single();
  return data?.id ?? null;
}
