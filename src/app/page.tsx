import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">L</div>
          <span className="font-bold text-xl text-gray-900">LearnMate AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Login</Link>
          <Link href="/register" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>🧠</span> Powered by GPT-4o AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Your Personal
          <span className="text-primary-600"> AI Teacher</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          LearnMate AI teaches you according to your <strong>actual ability level</strong>, not just your school year.
          Master foundations first, then advance at your own pace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-base py-3 px-8 rounded-xl">
            Start Learning Free →
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base py-3 px-8 rounded-xl">
            See How It Works
          </Link>
        </div>

        {/* Level Gap Example */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-100 shadow-card p-8 max-w-2xl mx-auto">
          <p className="text-sm font-medium text-gray-500 mb-4">Example: 16-year-old Form 4 Student</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { subject: '🔢 Mathematics', level: 'Age 11 Level', gap: '5 years behind', color: 'bg-red-50 border-red-200 text-red-700' },
              { subject: '📖 English', level: 'Age 14 Level', gap: '2 years behind', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { subject: '🔬 Science', level: 'Age 16 Level', gap: 'On track!', color: 'bg-green-50 border-green-200 text-green-700' },
            ].map((item) => (
              <div key={item.subject} className={`rounded-xl border p-3 ${item.color}`}>
                <div className="font-medium text-sm">{item.subject}</div>
                <div className="text-xs mt-1 opacity-80">{item.level}</div>
                <div className="text-xs font-bold mt-1">{item.gap}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            LearnMate AI rebuilds Math from Age 11, English from Age 14 — while keeping Science at current level.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How LearnMate AI Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🧪', title: 'AI Diagnostic Test', desc: 'AI tests your real knowledge level for each subject — not your school year.' },
            { step: '02', icon: '🗺️', title: 'Personal Learning Path', desc: 'AI creates a custom path that rebuilds missing foundations before advancing.' },
            { step: '03', icon: '💬', title: 'AI Personal Teacher', desc: 'Your patient AI teacher explains concepts in 5 different teaching modes.' },
            { step: '04', icon: '📝', title: 'Smart Homework', desc: 'AI generates homework based on your weak areas. Marks it instantly with feedback.' },
            { step: '05', icon: '🎯', title: 'Daily Missions', desc: 'Personalized daily study missions keep you on track toward your exam goals.' },
            { step: '06', icon: '👨‍👩‍👧', title: 'Parent Portal', desc: 'Parents get weekly AI reports and WhatsApp alerts about progress.' },
          ].map((item) => (
            <div key={item.step} className="card-hover">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-xs font-bold text-primary-600 mb-1">STEP {item.step}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">All Subjects Covered</h2>
          <p className="text-center text-gray-600 mb-10">From Preschool to Pre-University — in English, BM, Tamil & Mandarin</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['📖 English', '🇲🇾 Bahasa Melayu', '🔢 Mathematics', '📐 Add. Maths', '🔬 Science',
              '🧬 Biology', '⚗️ Chemistry', '⚡ Physics', '🏛️ Sejarah', '🌍 Geography',
              '💰 Accounting', '📊 Economics', '🔤 Preschool ABC', '🔢 Preschool Numbers'].map((s) => (
              <span key={s} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Ready to learn the smart way?</h2>
        <p className="text-lg text-gray-600 mb-8">Join thousands of Malaysian students learning at their own pace with AI.</p>
        <Link href="/register" className="btn-primary text-lg py-4 px-10 rounded-xl inline-block">
          Create Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        <p>© 2026 LearnMate AI. All rights reserved.</p>
        <p className="mt-1 font-medium text-gray-600">Created by ESWARAN A/L Padmanathan</p>
      </footer>
    </main>
  );
}
