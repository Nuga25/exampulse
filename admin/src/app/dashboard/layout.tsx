'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading || !user) return null;

  const navItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Overview' },
    { href: '/dashboard/exams', icon: 'calendar_month', label: 'Exam Schedule' },
    { href: '/dashboard/notifications', icon: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Top Nav */}
      <header className="bg-white flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50 border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <span className="text-xl font-black tracking-tighter text-primary">ExamPulse</span>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-sm font-medium text-on-surface-variant">{user.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-xs px-sm py-xs text-error hover:bg-error-container transition-colors rounded text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full z-40 bg-gray-50 w-64 border-r border-outline-variant pt-16">
        <div className="px-6 py-8">
          <div className="flex items-center gap-sm mb-lg">
            <div className="bg-primary-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-on-primary-container">school</span>
            </div>
            <div>
              <div className="text-base font-black text-primary">Admin Portal</div>
              <div className="text-[11px] uppercase tracking-widest text-outline">Exam Coordinator</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-sm px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-primary border-r-4 border-primary shadow-sm'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/dashboard/exams/new"
            className="mt-lg w-full bg-primary text-on-primary py-3 px-4 rounded-xl flex items-center justify-center gap-xs font-bold shadow-lg active:scale-[0.98] transition-transform text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Exam
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}