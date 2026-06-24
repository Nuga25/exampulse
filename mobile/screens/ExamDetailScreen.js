import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${ampm}`;
};

const getSession = (timeStr) => {
  if (!timeStr) return '';
  const hour = parseInt(timeStr.split(':')[0]);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

const getCountdown = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const examDate = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diff = examDate - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d : ${hours}h`;
  if (hours > 0) return `${hours}h : ${minutes}m`;
  return `${minutes}m`;
};

const DetailRow = ({ label, value }) => (
  <View style={d.row}>
    <Text style={d.rowLabel}>{label}</Text>
    <Text style={d.rowValue}>{value}</Text>
  </View>
);

export default function ExamDetailScreen({ route, navigation }) {
  const { exam } = route.params;
  const [countdown, setCountdown] = useState(getCountdown(exam.date, exam.startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(exam.date, exam.startTime));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000666" />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Exam Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — course code + title */}
        <View style={s.heroRow}>
          <View style={s.heroCard}>
            <View style={s.heroAccent} />
            <View style={s.heroBody}>
              <Text style={s.courseCode}>{exam.courseCode}</Text>
              <Text style={s.courseTitle}>{exam.courseTitle}</Text>
              <View style={s.badgeRow}>
                <View style={s.confirmedBadge}>
                  <Text style={s.confirmedBadgeText}>CONFIRMED</Text>
                </View>
                <View style={s.deptBadge}>
                  <Text style={s.deptBadgeText}>{exam.department}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Countdown card */}
          {countdown ? (
            <View style={s.countdownCard}>
              <Text style={s.countdownIcon}>⏰</Text>
              <Text style={s.countdownLabel}>TIME LEFT</Text>
              <Text style={s.countdownValue}>{countdown}</Text>
            </View>
          ) : (
            <View style={[s.countdownCard, { backgroundColor: '#f0f0f5' }]}>
              <Text style={s.countdownIcon}>✅</Text>
              <Text style={[s.countdownLabel, { color: '#999' }]}>STATUS</Text>
              <Text style={[s.countdownValue, { color: '#999', fontSize: 14 }]}>Completed</Text>
            </View>
          )}
        </View>

        {/* Schedule card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <Text style={s.cardIconText}>📅</Text>
            </View>
            <Text style={s.cardTitle}>Schedule</Text>
          </View>
          <View style={s.cardDivider} />
          <DetailRow label="Exam Date" value={formatDate(exam.date)} />
          <View style={s.rowDivider} />
          <DetailRow label="Session" value={getSession(exam.startTime)} />
          <View style={s.rowDivider} />
          <DetailRow
            label="Time"
            value={exam.endTime
              ? `${formatTime(exam.startTime)} — ${formatTime(exam.endTime)}`
              : formatTime(exam.startTime)
            }
          />
        </View>

        {/* Venue card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <Text style={s.cardIconText}>📍</Text>
            </View>
            <Text style={s.cardTitle}>Venue</Text>
          </View>
          <View style={s.cardDivider} />
          <DetailRow label="Hall / Room" value={exam.venue} />
          <View style={s.rowDivider} />
          <DetailRow label="Level" value={`${exam.level} Level`} />
        </View>

        {/* Instructions card */}
        {exam.instructions ? (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconBox}>
                <Text style={s.cardIconText}>📋</Text>
              </View>
              <Text style={s.cardTitle}>Instructions</Text>
            </View>
            <View style={s.cardDivider} />
            <Text style={s.instructionsText}>{exam.instructions}</Text>
          </View>
        ) : null}

        {/* Required materials */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <Text style={s.cardIconText}>🎒</Text>
            </View>
            <Text style={s.cardTitle}>Required Materials</Text>
          </View>
          <View style={s.cardDivider} />
          {['Valid Student ID', 'Exam Docket', 'Blue / Black Pen', 'Scientific Calculator'].map((item) => (
            <View key={item} style={s.materialRow}>
              <Text style={s.materialTick}>✓</Text>
              <Text style={s.materialText}>{item}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0a0a1a', maxWidth: '55%', textAlign: 'right' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  topBar: {
    backgroundColor: '#000666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: '#fff', fontWeight: '600' },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  scroll: { padding: 20, paddingBottom: 48 },

  // Hero
  heroRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  heroCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heroAccent: { width: 4, backgroundColor: '#006b5f' },
  heroBody: { flex: 1, padding: 16 },
  courseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006b5f',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000666',
    letterSpacing: -0.2,
    marginBottom: 12,
    lineHeight: 22,
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  confirmedBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confirmedBadgeText: { fontSize: 9, fontWeight: '800', color: '#2e7d32', letterSpacing: 0.5 },
  deptBadge: {
    backgroundColor: '#f0f0f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deptBadgeText: { fontSize: 9, fontWeight: '700', color: '#666', letterSpacing: 0.3 },

  // Countdown
  countdownCard: {
    width: 90,
    backgroundColor: '#000666',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000666',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  countdownIcon: { fontSize: 24, marginBottom: 6 },
  countdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconBox: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0a0a1a' },
  cardDivider: { height: 1, backgroundColor: '#f5f6fa', marginBottom: 4 },
  rowDivider: { height: 1, backgroundColor: '#f5f6fa' },

  // Instructions
  instructionsText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    paddingTop: 8,
  },

  // Materials
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f6fa',
  },
  materialTick: { fontSize: 14, color: '#006b5f', fontWeight: '800' },
  materialText: { fontSize: 14, color: '#0a0a1a', fontWeight: '500' },
});