'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/parent/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/parent/reports', icon: '📊', label: 'Reports' },
];

export default function ParentSidebar({ parentName = 'Parent' }: { parentName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">L</div>
        <div>
          <div className="font-bold text-gray-900 text-sm">LearnMate AI</div>
          <div className="text-xs text-gray-400">Parent Portal</div>
        </div>
      </div>
      <div className="bg-purple-50 rounded-xl p-3 mb-6">
        <div className="text-sm font-semibold text-gray-900">{parentName}</div>
        <div className="text-xs text-purple-600">Parent</div>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className={pathname === link.href ? 'sidebar-link-active' : 'sidebar-link'}>
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <button onClick={handleLogout} className="sidebar-link w-full text-left mt-4 text-red-500 hover:bg-red-50 hover:text-red-600">
        <span>🚪</span><span>Logout</span>
      </button>
    </aside>
  );
}
