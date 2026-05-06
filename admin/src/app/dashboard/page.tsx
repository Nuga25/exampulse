'use client';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';
import Link from 'next/link';

export default function DashboardPage() {
  const [totalExams, setTotalExams] = useState(0);
  const [recentExams, setRecentExams] = useState<any[]>([]);

  useEffect(() => {
    const examsRef = ref(database, 'exams');
    const unsubscribe = onValue(examsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const examsArray = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setTotalExams(examsArray.length);
        // Show 3 most recent
        const sorted = examsArray.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentExams(sorted.slice(0, 3));
      } else {
        setTotalExams(0);
        setRecentExams([]);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-margin space-y-gutter">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-headline-lg font-bold text-primary">Dashboard Overview</h2>
          <p className="text-on-surface-variant">Real-time status of the examination cycle.</p>
        </div>
        <div className="text-right">
          <p className="text-label-caps text-gray-500 uppercase text-xs">Last Updated</p>
          <p className="font-bold text-sm">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-white p-md border border-outline-variant shadow-sm flex flex-col justify-between rounded-2xl">
          <p className="text-label-caps text-gray-500 flex items-center gap-1 text-xs uppercase">
            <span className="material-symbols-outlined text-sm">description</span> Total Exams
          </p>
          <div className="mt-4">
            <p className="text-3xl font-black text-primary">{totalExams}</p>
            <p className="text-xs text-secondary mt-1 font-semibold">Active records</p>
          </div>
        </div>

        <div className="bg-white p-md border border-outline-variant shadow-sm flex flex-col justify-between rounded-2xl">
          <p className="text-label-caps text-gray-500 flex items-center gap-1 text-xs uppercase">
            <span className="material-symbols-outlined text-sm">campaign</span> Notifications Sent
          </p>
          <div className="mt-4">
            <p className="text-3xl font-black text-primary">—</p>
            <p className="text-xs text-secondary mt-1 font-semibold">Coming Day 6</p>
          </div>
        </div>

        <div className="bg-white p-md border-l-4 border-l-secondary border border-outline-variant shadow-sm flex flex-col justify-between rounded-2xl">
          <p className="text-label-caps text-gray-500 flex items-center gap-1 text-xs uppercase">
            <span className="material-symbols-outlined text-sm">school</span> Students Enrolled
          </p>
          <div className="mt-4">
            <p className="text-3xl font-black text-primary">—</p>
            <p className="text-xs text-gray-500 mt-1">Live count coming soon</p>
          </div>
        </div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Recent Exams */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-2xl overflow-hidden">
          <div className="p-md border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-headline-md font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">history</span> Recent Exams
            </h3>
            <Link href="/dashboard/exams" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentExams.length === 0 ? (
              <div className="p-md text-on-surface-variant text-sm text-center py-lg">
                No exams yet. <Link href="/dashboard/exams/new" className="text-primary font-bold hover:underline">Create one</Link>
              </div>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="p-md flex gap-md hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{exam.courseCode} — {exam.courseTitle}</p>
                    <p className="text-xs text-on-surface-variant">{exam.date} • {exam.startTime} — {exam.venue}</p>
                  </div>
                  <span className="bg-on-primary-container text-white text-[10px] font-bold px-2 py-1 h-fit rounded-lg">NEW</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-primary text-white p-md border border-primary shadow-lg rounded-2xl">
          <h3 className="text-headline-md font-semibold mb-md flex items-center gap-2">
            <span className="material-symbols-outlined">bolt</span> Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/exams/new"
              className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 text-sm font-bold transition-all group rounded-xl"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">post_add</span> Add New Exam
              </span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link
              href="/dashboard/exams"
              className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 text-sm font-bold transition-all group rounded-xl"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_view_day</span> View Schedule
              </span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}