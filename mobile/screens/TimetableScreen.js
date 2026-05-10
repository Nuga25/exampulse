import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotifications } from '../utils/notifications';

const CACHE_KEY = 'exampulse_timetable_cache';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${ampm}`;
};

const isUpcoming = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
};

const getDaysUntil = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
};

export default function TimetableScreen({ navigation }) {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        loadExams(data.department, data.level, data.courses || []);
        registerForPushNotifications(user.uid);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const loadExams = (department, level, courses) => {
    const examsRef = ref(database, 'exams');
    onValue(examsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const all = snapshot.val();

        // Build list of registered course codes — strip spaces and uppercase
        const registeredCodes = courses && courses.length > 0
          ? courses.map(c => c.courseCode.replace(/\s/g, '').toUpperCase())
          : [];

        let filtered;

        if (registeredCodes.length > 0) {
          // Filter by registered course codes
          filtered = Object.entries(all)
            .map(([id, val]) => ({ id, ...val }))
            .filter(exam => {
              const examCode = exam.courseCode?.replace(/\s/g, '').toUpperCase();
              return registeredCodes.includes(examCode);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
          // Fallback — filter by department and level if no courses registered
          filtered = Object.entries(all)
            .map(([id, val]) => ({ id, ...val }))
            .filter(exam =>
              exam.department?.trim().toLowerCase() === department?.trim().toLowerCase() &&
              String(exam.level).trim() === String(level).trim()
            )
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        setExams(filtered);
        setIsOffline(false);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      } else {
        setExams([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) { setExams(JSON.parse(cached)); setIsOffline(true); }
      } catch (e) {}
      setLoading(false);
      setRefreshing(false);
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (userData) loadExams(userData.department, userData.level, userData.courses || []);
  };

  const upcomingExams = exams.filter(e => isUpcoming(e.date));
  const nextExam = upcomingExams[0] || null;
  const remainingExams = upcomingExams.slice(1);
  const pastExams = exams.filter(e => !isUpcoming(e.date));
  const firstName = userData?.fullName?.trim().split(' ')[0] || 'Student';

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator size="large" color="#000666" />
        <Text style={s.loadingText}>Loading your timetable...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000666" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {firstName} 👋</Text>
          <Text style={s.headerSub}>
            {upcomingExams.length > 0
              ? `You have ${upcomingExams.length} upcoming exam${upcomingExams.length > 1 ? 's' : ''}`
              : 'No upcoming exams'}
          </Text>
        </View>
        <Image source={require('../assets/logo.png')} style={s.headerLogo} resizeMode="contain" />
      </View>

      {isOffline && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>📶  Offline — showing cached timetable</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#000666" />}
      >
        {/* Next Exam Hero Card */}
        {nextExam ? (
          <TouchableOpacity
            style={s.heroCard}
            onPress={() => navigation.navigate('ExamDetail', { exam: nextExam })}
            activeOpacity={0.88}
          >
            <View style={s.heroCardTop}>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>NEXT EXAM</Text>
              </View>
              <Text style={s.heroDaysUntil}>{getDaysUntil(nextExam.date)}</Text>
            </View>
            <Text style={s.heroCourseCode}>{nextExam.courseCode}</Text>
            <Text style={s.heroCourseTitle}>{nextExam.courseTitle}</Text>
            <View style={s.heroMeta}>
              <View style={s.heroMetaItem}>
                <Text style={s.heroMetaIcon}>🕐</Text>
                <Text style={s.heroMetaText}>{formatTime(nextExam.startTime)}</Text>
              </View>
              <View style={s.heroMetaDot} />
              <View style={s.heroMetaItem}>
                <Text style={s.heroMetaIcon}>📅</Text>
                <Text style={s.heroMetaText}>{formatDate(nextExam.date)}</Text>
              </View>
              <View style={s.heroMetaDot} />
              <View style={s.heroMetaItem}>
                <Text style={s.heroMetaIcon}>📍</Text>
                <Text style={s.heroMetaText}>{nextExam.venue}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={s.noNextCard}>
            <Text style={s.noNextIcon}>✅</Text>
            <Text style={s.noNextTitle}>All clear</Text>
            <Text style={s.noNextSub}>No upcoming exams scheduled</Text>
          </View>
        )}

        {/* Upcoming list */}
        {remainingExams.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Upcoming Exams</Text>
              <Text style={s.sectionCount}>{remainingExams.length} remaining</Text>
            </View>
            <View style={s.tableCard}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderText, { flex: 2 }]}>COURSE</Text>
                <Text style={[s.tableHeaderText, { flex: 2 }]}>SCHEDULE</Text>
                <Text style={[s.tableHeaderText, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
              </View>
              {remainingExams.map((exam, index) => (
                <TouchableOpacity
                  key={exam.id}
                  onPress={() => navigation.navigate('ExamDetail', { exam })}
                  activeOpacity={0.85}
                >
                  {index > 0 && <View style={s.tableRowDivider} />}
                  <View style={s.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tableCode}>{exam.courseCode}</Text>
                      <Text style={s.tableTitle} numberOfLines={1}>{exam.courseTitle}</Text>
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tableDate}>{formatDate(exam.date)}</Text>
                      <Text style={s.tableTime}>{formatTime(exam.startTime)}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <View style={s.statusBadge}>
                        <Text style={s.statusBadgeText}>SET</Text>
                      </View>
                    </View>
                  </View>
                 </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Past exams */}
        {pastExams.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Completed</Text>
              <Text style={s.sectionCount}>{pastExams.length} done</Text>
            </View>
            <View style={s.tableCard}>
              {pastExams.map((exam, index) => (
                <TouchableOpacity
                  key={exam.id}
                  onPress={() => navigation.navigate('ExamDetail', { exam })}
                  activeOpacity={0.85}
                >
                  {index > 0 && <View style={s.tableRowDivider} />}
                  <View style={[s.tableRow, { opacity: 0.5 }]}>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tableCode}>{exam.courseCode}</Text>
                      <Text style={s.tableTitle} numberOfLines={1}>{exam.courseTitle}</Text>
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tableDate}>{formatDate(exam.date)}</Text>
                      <Text style={s.tableTime}>{formatTime(exam.startTime)}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <View style={s.doneBadge}>
                        <Text style={s.doneBadgeText}>DONE</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {exams.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No exams scheduled yet</Text>
            <Text style={s.emptySub}>Your timetable will appear here once your department's exams are published.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6fa', gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },
  header: {
    backgroundColor: '#000666',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  headerLogo: { width: 36, height: 36, opacity: 0.9 },
  offlineBanner: {
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  offlineText: { fontSize: 12, color: '#856404', fontWeight: '500', textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Hero card
  heroCard: {
    backgroundColor: '#000666',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000666',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroDaysUntil: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  heroCourseCode: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroCourseTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 20 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaIcon: { fontSize: 12 },
  heroMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  heroMetaDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.3)' },

  noNextCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  noNextIcon: { fontSize: 40, marginBottom: 12 },
  noNextTitle: { fontSize: 18, fontWeight: '700', color: '#0a0a1a', marginBottom: 6 },
  noNextSub: { fontSize: 13, color: '#888', textAlign: 'center' },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0a0a1a' },
  sectionCount: { fontSize: 12, color: '#888', fontWeight: '500' },

  // Table
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f6fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f5',
  },
  tableHeaderText: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 0.8, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
  tableRowDivider: { height: 1, backgroundColor: '#f5f6fa', marginHorizontal: 16 },
  tableCode: { fontSize: 12, fontWeight: '800', color: '#000666', letterSpacing: 0.5 },
  tableTitle: { fontSize: 12, color: '#666', marginTop: 2 },
  tableDate: { fontSize: 12, fontWeight: '600', color: '#0a0a1a' },
  tableTime: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 9, fontWeight: '800', color: '#2e7d32', letterSpacing: 0.5 },
  doneBadge: {
    backgroundColor: '#f0f0f5',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  doneBadgeText: { fontSize: 9, fontWeight: '800', color: '#999', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0a0a1a', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
});