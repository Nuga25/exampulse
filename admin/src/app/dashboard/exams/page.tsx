'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { database } from '../../../lib/firebase';
import Link from 'next/link';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const examsRef = ref(database, 'exams');
    const unsubscribe = onValue(examsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
        setExams(arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } else {
        setExams([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, courseCode: string) => {
    if (!confirm(`Delete ${courseCode}? This cannot be undone.`)) return;
    await remove(ref(database, `exams/${id}`));
  };

  const handleDeleteAll = async () => {
  if (!confirm('Delete ALL exam records? This cannot be undone and will notify affected students.')) return;
  await remove(ref(database, 'exams'));
};

  return (
    <div className="max-w-6xl mx-auto p-margin">
      <div className="flex justify-between items-end mb-lg">
      <div>
        <h2 className="text-headline-lg font-bold text-primary">Exam Schedule</h2>
        <p className="text-on-surface-variant">{exams.length} examination{exams.length !== 1 ? 's' : ''} scheduled</p>
      </div>
      <div className="flex gap-sm">
        {exams.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="border border-error text-error px-md py-sm rounded-xl flex items-center gap-xs font-bold hover:bg-error-container transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Delete All
          </button>
        )}
        <Link
          href="/dashboard/exams/import"
          className="border border-primary text-primary px-md py-sm rounded-xl flex items-center gap-xs font-bold hover:bg-primary-fixed transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Import from PDF
        </Link>
        <Link
          href="/dashboard/exams/new"
          className="bg-primary text-on-primary px-md py-sm rounded-xl flex items-center gap-xs font-bold shadow-lg active:scale-[0.98] transition-transform text-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add New Exam
        </Link>
      </div>
    </div>

      {loading ? (
        <div className="text-center py-lg text-on-surface-variant">Loading...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-lg text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-md block">calendar_month</span>
          <p className="text-headline-md font-semibold text-on-surface-variant mb-sm">No exams scheduled yet</p>
          <Link href="/dashboard/exams/new" className="text-primary font-bold hover:underline">
            Create your first exam record
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                {['Course Code', 'Course Title', 'Date', 'Time', 'Venue', 'Department', 'Level', 'Actions'].map((h) => (
                  <th key={h} className="px-md py-sm text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.map((exam, index) => (
                <tr key={exam.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/30'}`}>
                  <td className="px-md py-sm font-mono font-bold text-primary tracking-wider">{exam.courseCode}</td>
                  <td className="px-md py-sm font-medium">{exam.courseTitle}</td>
                  <td className="px-md py-sm text-on-surface-variant">{exam.date}</td>
                  <td className="px-md py-sm text-on-surface-variant">{exam.startTime}{exam.endTime ? ` — ${exam.endTime}` : ''}</td>
                  <td className="px-md py-sm text-on-surface-variant">{exam.venue}</td>
                  <td className="px-md py-sm text-on-surface-variant">{exam.department}</td>
                  <td className="px-md py-sm">
                    <span className="bg-primary-fixed text-primary px-2 py-1 rounded-full text-xs font-bold">{exam.level}L</span>
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-xs">
                        <Link
                        href={`/dashboard/exams/${exam.id}/edit`}
                        className="p-1 text-primary hover:bg-primary-fixed rounded transition-colors"
                        title="Edit"
                        >
                        <span className="material-symbols-outlined text-base">edit</span>
                        </Link>
                        <button
                        onClick={() => handleDelete(exam.id, exam.courseCode)}
                        className="p-1 text-error hover:bg-error-container rounded transition-colors"
                        title="Delete"
                        >
                        <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}