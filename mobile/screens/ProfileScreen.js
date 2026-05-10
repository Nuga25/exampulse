import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { ref, onValue } from 'firebase/database';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!user) return;
    const userRef = ref(database, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) setUserData(snapshot.val());
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  };

  const initials = userData?.fullName
    ? userData.fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const courses = userData?.courses || [];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <Text style={s.headerSub}>Your academic account</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          {userData && (
            <>
              <Text style={s.name}>{userData.fullName}</Text>
              <Text style={s.matric}>{userData.matricNumber}</Text>
            </>
          )}
        </View>

        {/* Info Card */}
        {userData && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Academic Info</Text>
            <View style={s.cardDivider} />
            <InfoRow label="Department" value={userData.department} />
            <View style={s.rowDivider} />
            <InfoRow label="Level" value={`${userData.level} Level`} />
            <View style={s.rowDivider} />
            <InfoRow label="Semester" value={userData.semester || '—'} />
            <View style={s.rowDivider} />
            <InfoRow label="Session" value={userData.session || '—'} />
            <View style={s.rowDivider} />
            <InfoRow label="Email" value={userData.email} />
          </View>
        )}

        {/* Registered Courses */}
        <View style={s.card}>
          <View style={s.coursesHeader}>
            <Text style={s.cardTitle}>Registered Courses</Text>
            <Text style={s.coursesCount}>{courses.length} courses</Text>
          </View>
          <View style={s.cardDivider} />
          {courses.length === 0 ? (
            <Text style={s.noCourses}>No courses registered yet.</Text>
          ) : (
            courses.map((course, index) => (
              <View key={index}>
                <View style={s.courseRow}>
                  <View style={s.courseLeft}>
                    <Text style={s.courseCode}>{course.courseCode}</Text>
                    <Text style={s.courseTitle} numberOfLines={1}>{course.courseTitle}</Text>
                  </View>
                  <View style={s.courseRight}>
                    <View style={[s.statusBadge, course.status === 'E' && s.electiveBadge]}>
                      <Text style={[s.statusText, course.status === 'E' && s.electiveText]}>
                        {course.status === 'E' ? 'ELECTIVE' : 'CORE'}
                      </Text>
                    </View>
                    <Text style={s.courseUnits}>{course.units} units</Text>
                  </View>
                </View>
                {index < courses.length - 1 && <View style={s.rowDivider} />}
              </View>
            ))
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.88}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ExamPulse v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  header: {
    backgroundColor: '#000666',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  content: { padding: 20, paddingBottom: 48 },
  avatarWrap: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#000666',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0a0a1a', letterSpacing: -0.3 },
  matric: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0a0a1a', marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: '#f0f0f5', marginBottom: 8 },
  rowDivider: { height: 1, backgroundColor: '#f5f6fa' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#0a0a1a', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  coursesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  coursesCount: { fontSize: 12, color: '#888', fontWeight: '500' },
  noCourses: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 20 },
  courseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  courseLeft: { flex: 1, marginRight: 12 },
  courseCode: { fontSize: 12, fontWeight: '800', color: '#000666', letterSpacing: 0.5 },
  courseTitle: { fontSize: 12, color: '#666', marginTop: 2 },
  courseRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  electiveBadge: { backgroundColor: '#fff3e0' },
  statusText: { fontSize: 9, fontWeight: '800', color: '#2e7d32', letterSpacing: 0.5 },
  electiveText: { color: '#e65100' },
  courseUnits: { fontSize: 11, color: '#999' },
  signOutBtn: {
    height: 54, backgroundColor: '#fff',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#ff3b30', marginBottom: 16,
  },
  signOutText: { color: '#ff3b30', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: '#bbb' },
});