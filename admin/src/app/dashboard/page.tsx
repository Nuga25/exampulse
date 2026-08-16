'use client';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../lib/firebase';
import Link from 'next/link';

interface Exam {
  id: string;
  courseCode: string;
  courseTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  department: string;
  level: string;
}

export default function DashboardPage() {
  const [totalExams, setTotalExams] = useState(0);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

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
        setAllExams(examsArray);
      } else {
        setTotalExams(0);
        setRecentExams([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Students enrolled
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const students = Object.values(users).filter((u: any) => u.role === 'student');
        setStudentCount(students.length);
      } else {
        setStudentCount(0);
      }
    });

    // Notifications sent (total across all students)
    const notifRef = ref(database, 'notifications');
    const unsubNotifs = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const allNotifs = snapshot.val();
        let total = 0;
        Object.values(allNotifs).forEach((userNotifs: any) => {
          total += Object.keys(userNotifs).length;
        });
        setNotificationCount(total);
      } else {
        setNotificationCount(0);
      }
    });

    return () => {
      unsubUsers();
      unsubNotifs();
    };
  }, []);

  // Breakdown by level
  const levelBreakdown: Record<string, number> = allExams.reduce((acc: Record<string, number>, exam: Exam) => {
    const level = exam.level || 'Unspecified';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  // Breakdown by department
  const deptBreakdown: Record<string, number> = allExams.reduce((acc: Record<string, number>, exam: Exam) => {
    const dept = exam.department || 'Unspecified';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const sortedLevels: [string, number][] = Object.entries(levelBreakdown).sort(([a], [b]) => a.localeCompare(b));
  const sortedDepts: [string, number][] = Object.entries(deptBreakdown).sort(([, a], [, b]) => b - a);
  const maxDeptCount: number = Math.max(...Object.values(deptBreakdown), 1);

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

        <div className="bg-white border border-outline-variant rounded-2xl p-md">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-base">campaign</span> Notifications Sent
          </h3>
          <p className="text-3xl font-black text-primary mt-2">{notificationCount}</p>
          <p className="text-xs text-on-surface-variant font-semibold mt-1">Total dispatched</p>
        </div>

        <div className="bg-white border-l-4 border-l-success border border-outline-variant rounded-2xl p-md">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-base">school</span> Students Enrolled
          </h3>
          <p className="text-3xl font-black text-primary mt-2">{studentCount}</p>
          <p className="text-xs text-success font-semibold mt-1">Registered accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mt-md">
        
        {/* By Level */}
        <div className="bg-white border border-outline-variant rounded-2xl p-md">
          <h3 className="text-headline-md font-semibold text-primary mb-md flex items-center gap-2">
            <span className="material-symbols-outlined">school</span> Exams by Level
          </h3>
          <div className="grid grid-cols-3 gap-sm">
            {sortedLevels.map(([level, count]) => (
              <div key={level} className="bg-surface-container-low rounded-xl p-sm text-center">
                <p className="text-2xl font-black text-primary">{count}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-1">{level}L</p>
              </div>
            ))}
          </div>
        </div>

        {/* By Department */}
        <div className="bg-white border border-outline-variant rounded-2xl p-md">
          <h3 className="text-base font-semibold text-primary mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">apartment</span> Exams by Department
          </h3>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2">
            {sortedDepts.map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-sm">
                <span className="text-xs text-on-surface-variant w-12 shrink-0">{dept}</span>
                <div className="flex-1 bg-surface-container-low rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(count / maxDeptCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
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