'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/admin/students', icon: '🎓', label: 'Students' },
  { href: '/admin/curriculum', icon: '📚', label: 'Curriculum' },
  { href: '/admin/analytics', icon: '📊', label: 'Analytics' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gray-900 text-white p-5">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center font-bold text-lg">L</div>
        <div>
          <div className="font-bold text-sm">LearnMate AI</div>
          <div className="text-xs text-gray-400">Admin Panel</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 w-full text-left mt-4">
        <span>🚪</span><span>Logout</span>
      </button>
    </aside>
  );
}
