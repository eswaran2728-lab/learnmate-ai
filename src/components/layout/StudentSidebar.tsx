'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/student/chat', icon: '💬', label: 'AI Teacher' },
  { href: '/student/missions', icon: '🎯', label: 'Daily Missions' },
  { href: '/student/learn', icon: '📚', label: 'Learn' },
  { href: '/student/homework', icon: '📝', label: 'Homework' },
  { href: '/student/achievements', icon: '🏆', label: 'Achievements' },
];

export default function StudentSidebar({ studentName = 'Student' }: { studentName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-2 z-50 px-2">
        {links.slice(0, 5).map(link => (
          <Link key={link.href} href={link.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              pathname === link.href ? 'text-primary-600 font-semibold' : 'text-gray-500'
            }`}>
            <span className="text-xl">{link.icon}</span>
            <span>{link.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 p-5">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">L</div>
          <div>
            <div className="font-bold text-gray-900 text-sm">LearnMate AI</div>
            <div className="text-xs text-gray-400">AI Personal Teacher</div>
          </div>
        </div>

        {/* Student info */}
        <div className="bg-primary-50 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{studentName}</div>
              <div className="text-xs text-primary-600">Student</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}
              className={pathname === link.href ? 'sidebar-link-active' : 'sidebar-link'}>
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout}
          className="sidebar-link w-full text-left mt-4 text-red-500 hover:bg-red-50 hover:text-red-600">
          <span className="text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}
