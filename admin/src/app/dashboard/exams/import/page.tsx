'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ref, push, set } from 'firebase/database';
import { database } from '../../../../lib/firebase';
import Link from 'next/link';

interface ExtractedExam {
  courseCode: string;
  courseTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  department: string;
  level: string;
  selected: boolean;
  error?: string;
}

export default function ImportTimetablePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<ExtractedExam[]>([]);
  const [error, setError] = useState('');
  const [parseError, setParseError] = useState('');
  const [progress, setProgress] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setExams([]);
      setParseError('');
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setParseError('');
    setProgress('Uploading document...');

    try {
        const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        });

        setProgress('AI is reading your timetable...');

        const response = await fetch('http://localhost:3000/api/parse/exam-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64, mimeType: file.type }),
        });

        setProgress('Processing extracted data...');
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Parse failed');

        setProgress(`✅ Found ${data.data.length} exams`);
        const extracted = data.data.map((exam: any) => ({ ...exam, selected: true }));
        setExams(extracted);

    } catch (err: any) {
        setParseError(err.message || 'Failed to parse timetable.');
        setProgress('');
    } finally {
        setParsing(false);
    }
    };

  const toggleExam = (index: number) => {
    setExams(prev => prev.map((e, i) =>
      i === index ? { ...e, selected: !e.selected } : e
    ));
  };

  const updateExam = (index: number, field: string, value: string) => {
    setExams(prev => prev.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    ));
  };

  const handleSaveAll = async () => {
    const selected = exams.filter(e => e.selected);
    if (selected.length === 0) {
        setError('Please select at least one exam to save.');
        return;
    }

    setSaving(true);
    setError('');

    try {
        const response = await fetch('http://localhost:3000/api/parse/save-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exams: selected.map(exam => ({
            courseCode: exam.courseCode.toUpperCase(),
            courseTitle: exam.courseTitle,
            date: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            venue: exam.venue,
            department: exam.department,
            level: String(exam.level),
            instructions: '',
            }))
        }),
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        router.push('/dashboard/exams');
    } catch (err: any) {
        setError(err.message || 'Failed to save exams. Please try again.');
    } finally {
        setSaving(false);
    }
    };

  const selectedCount = exams.filter(e => e.selected).length;

  return (
    <div className="max-w-6xl mx-auto p-margin">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-xs text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-sm">
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span>›</span>
        <Link href="/dashboard/exams" className="hover:text-primary">Exam Schedule</Link>
        <span>›</span>
        <span className="text-primary font-bold">Import Timetable</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-primary mb-xs">
            AI Timetable Import
          </h1>
          <p className="text-on-surface-variant max-w-xl">
            Upload your examination timetable PDF or image. Our AI will extract all exam records automatically.
          </p>
        </div>
        <span className="flex items-center gap-xs px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold uppercase tracking-wider">
          ✨ AI Powered
        </span>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-outline-variant rounded-2xl p-md mb-md shadow-sm">
        <div className="flex items-center gap-xs mb-md border-b border-surface-container pb-sm">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          <h2 className="text-headline-md font-semibold text-primary">Upload Timetable Document</h2>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-outline-variant rounded-xl p-lg text-center cursor-pointer hover:border-primary hover:bg-primary-fixed transition-all mb-md"
        >
          <span className="material-symbols-outlined text-5xl text-outline mb-md block">description</span>
          {file ? (
            <>
              <p className="font-bold text-primary text-lg">{file.name}</p>
              <p className="text-on-surface-variant text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB — Click to change
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-on-surface text-lg mb-1">
                Drop your timetable here
              </p>
              <p className="text-on-surface-variant text-sm">
                Supports PDF and images (PNG, JPG)
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {parseError && (
          <div className="mb-md p-sm bg-error-container text-error rounded-lg text-sm">
            {parseError}
          </div>
        )}

        {parsing && (
        <div className="mb-md">
            <div className="flex justify-between text-xs font-semibold text-on-surface-variant mb-2">
            <span>{progress}</span>
            <span className="animate-pulse">Please wait...</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div className="h-2 bg-primary rounded-full animate-pulse w-full" />
            </div>
            <p className="text-xs text-on-surface-variant mt-2 text-center">
            Large timetables may take 1-5 minutes. Do not close this page.
            </p>
        </div>
        )}

        <button
        onClick={handleParse}
        disabled={!file || parsing}
        className="w-full bg-primary text-on-primary py-4 rounded-xl flex items-center justify-center gap-sm font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50 text-sm"
        >
        {parsing ? (
            <>
            <span className="animate-spin material-symbols-outlined text-sm">sync</span>
            {progress || 'Processing...'}
            </>
        ) : (
            <>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Extract Exams with AI
            </>
        )}
        </button>
      </div>

      {/* Results Section */}
      {exams.length > 0 && (
        <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-md">
          <div className="p-md border-b border-outline-variant flex justify-between items-center">
            <div>
              <h2 className="text-headline-md font-semibold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">checklist</span>
                Extracted Exams
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                AI found {exams.length} exam{exams.length !== 1 ? 's' : ''}. Review and edit before saving.
              </p>
            </div>
            <div className="flex items-center gap-sm">
              <button
                onClick={() => setExams(prev => prev.map(e => ({ ...e, selected: true })))}
                className="text-xs font-bold text-primary hover:underline"
              >
                Select All
              </button>
              <span className="text-outline">·</span>
              <button
                onClick={() => setExams(prev => prev.map(e => ({ ...e, selected: false })))}
                className="text-xs font-bold text-on-surface-variant hover:underline"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {exams.map((exam, index) => (
              <div
                key={index}
                className={`p-md transition-colors ${exam.selected ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
              >
                <div className="flex items-start gap-md">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={exam.selected}
                    onChange={() => toggleExam(index)}
                    className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                  />

                  {/* Exam fields */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-sm">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Course Code</label>
                      <input
                        value={exam.courseCode}
                        onChange={(e) => updateExam(index, 'courseCode', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm font-mono text-primary focus:border-primary outline-none"
                      />
                    </div>
                    <div className="col-span-2 lg:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Course Title</label>
                      <input
                        value={exam.courseTitle}
                        onChange={(e) => updateExam(index, 'courseTitle', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Date</label>
                      <input
                        type="date"
                        value={exam.date}
                        onChange={(e) => updateExam(index, 'date', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Start Time</label>
                      <input
                        type="time"
                        value={exam.startTime}
                        onChange={(e) => updateExam(index, 'startTime', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">End Time</label>
                      <input
                        type="time"
                        value={exam.endTime}
                        onChange={(e) => updateExam(index, 'endTime', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Venue</label>
                      <input
                        value={exam.venue}
                        onChange={(e) => updateExam(index, 'venue', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Department</label>
                      <input
                        value={exam.department}
                        onChange={(e) => updateExam(index, 'department', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Level</label>
                      <select
                        value={exam.level}
                        onChange={(e) => updateExam(index, 'level', e.target.value)}
                        className="w-full border border-outline-variant rounded-lg py-2 px-3 text-sm focus:border-primary outline-none bg-white"
                      >
                        <option value="">Select</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Bar */}
      {exams.length > 0 && (
        <div className="bg-white border border-outline-variant rounded-2xl p-md shadow-sm flex justify-between items-center">
          <div>
            <p className="font-bold text-on-surface">
              {selectedCount} of {exams.length} exam{exams.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-on-surface-variant">
              Students will be notified automatically when saved.
            </p>
          </div>
          <div className="flex gap-sm">
            <Link
              href="/dashboard/exams"
              className="border border-outline-variant text-on-surface py-3 px-md rounded-xl font-semibold hover:bg-surface-container transition-colors text-sm"
            >
              Cancel
            </Link>
            <button
              onClick={handleSaveAll}
              disabled={saving || selectedCount === 0}
              className="bg-primary text-on-primary py-3 px-md rounded-xl font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50 text-sm flex items-center gap-xs"
            >
              {saving ? 'Saving...' : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save {selectedCount} Exam{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}