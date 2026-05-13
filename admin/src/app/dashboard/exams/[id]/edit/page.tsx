'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ref, get, update } from 'firebase/database';
import { database } from '../../../../../lib/firebase';
import Link from 'next/link';

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    courseCode: '',
    courseTitle: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    department: '',
    level: '',
    instructions: '',
  });

  // Load existing exam data
  useEffect(() => {
    const loadExam = async () => {
      try {
        const snapshot = await get(ref(database, `exams/${examId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setForm({
            courseCode: data.courseCode || '',
            courseTitle: data.courseTitle || '',
            date: data.date || '',
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            venue: data.venue || '',
            department: data.department || '',
            level: data.level || '',
            instructions: data.instructions || '',
          });
        } else {
          setError('Exam not found.');
        }
      } catch (err) {
        setError('Failed to load exam.');
      } finally {
        setFetching(false);
      }
    };
    loadExam();
  }, [examId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.courseCode || !form.courseTitle || !form.date || !form.startTime || !form.venue) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await update(ref(database, `exams/${examId}`), {
        ...form,
        courseCode: form.courseCode.toUpperCase(),
        updatedAt: new Date().toISOString(),
      });
      router.push('/dashboard/exams');
    } catch (err) {
      setError('Failed to update exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-5xl mx-auto p-margin flex items-center justify-center min-h-96">
        <p className="text-on-surface-variant">Loading exam data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-margin">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-xs text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-sm">
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/exams" className="hover:text-primary">Exam Schedule</Link>
        <span>›</span>
        <span className="text-primary font-bold">Edit Exam</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-primary mb-xs">Edit Examination</h1>
          <p className="text-on-surface-variant max-w-xl">
            Update the details below. Students will be notified automatically when you save.
          </p>
        </div>
        <span className="flex items-center gap-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold uppercase tracking-wider">
          ✏️ Editing
        </span>
      </div>

      {error && (
        <div className="mb-md p-sm bg-error-container text-error rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-md items-start">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-7 space-y-md">

          {/* Course Information */}
          <div className="bg-white border border-outline-variant p-md rounded-lg shadow-sm">
            <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <h2 className="text-headline-md font-semibold text-primary">Course Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Course Code *
                </label>
                <input
                  name="courseCode"
                  value={form.courseCode}
                  onChange={handleChange}
                  className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md font-mono text-primary text-sm"
                  placeholder="e.g. CSC401"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Course Title *
                </label>
                <input
                  name="courseTitle"
                  value={form.courseTitle}
                  onChange={handleChange}
                  className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                  placeholder="Introduction to Algorithms"
                />
              </div>
            </div>
          </div>

          {/* Schedule Details */}
          <div className="bg-white border border-outline-variant p-md rounded-lg shadow-sm">
            <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
              <span className="material-symbols-outlined text-primary">event</span>
              <h2 className="text-headline-md font-semibold text-primary">Schedule Details</h2>
            </div>
            <div className="space-y-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Exam Date *
                </label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                    Start Time *
                  </label>
                  <input
                    name="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={handleChange}
                    className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                    End Time
                  </label>
                  <input
                    name="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={handleChange}
                    className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white border border-outline-variant p-md rounded-lg shadow-sm">
            <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
              <span className="material-symbols-outlined text-primary">assignment</span>
              <h2 className="text-headline-md font-semibold text-primary">Special Instructions</h2>
            </div>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
              placeholder="e.g. Calculators permitted, bring student ID..."
              rows={4}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-md">

          {/* Location */}
          <div className="bg-white border border-outline-variant p-md rounded-lg shadow-sm">
            <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h2 className="text-headline-md font-semibold text-primary">Location</h2>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                Venue / Hall *
              </label>
              <input
                name="venue"
                value={form.venue}
                onChange={handleChange}
                className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                placeholder="e.g. Main Auditorium"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="bg-white border border-outline-variant p-md rounded-lg shadow-sm">
            <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
              <span className="material-symbols-outlined text-primary">groups</span>
              <h2 className="text-headline-md font-semibold text-primary">Target Audience</h2>
              <span className="text-xs text-on-surface-variant ml-auto">Optional — for display only</span>
            </div>
            <div className="space-y-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Department
                </label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-xs">
                  Level
                </label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="w-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-md text-sm bg-white"
                >
                  <option value="">Select Level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification notice */}
          <div className="bg-primary-fixed p-sm rounded-lg border border-primary-fixed-dim">
            <p className="text-xs text-primary font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              Students will be automatically notified when you save these changes.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl flex items-center justify-center gap-sm font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60 text-sm"
          >
            {loading ? 'Saving...' : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save Changes
              </>
            )}
          </button>

          <Link
            href="/dashboard/exams"
            className="w-full border border-outline-variant text-on-surface py-4 rounded-xl flex items-center justify-center gap-sm font-semibold hover:bg-surface-container transition-colors text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}