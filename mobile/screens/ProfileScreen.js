import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { useEffect, useState } from 'react';

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

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <Text style={s.headerSub}>Your academic account</Text>
      </View>

      <View style={s.content}>
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
            <InfoRow label="Department" value={userData.department} />
            <View style={s.cardDivider} />
            <InfoRow label="Level" value={`${userData.level} Level`} />
            <View style={s.cardDivider} />
            <InfoRow label="Email" value={userData.email} />
            <View style={s.cardDivider} />
            <InfoRow label="Role" value="Student" />
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleLogout} activeOpacity={0.88}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>ExamPulse v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value}</Text>
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
  content: { flex: 1, padding: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#000666',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0a0a1a', letterSpacing: -0.3 },
  matric: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDivider: { height: 1, backgroundColor: '#f0f0f5' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#0a0a1a', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  signOutBtn: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ff3b30',
    marginBottom: 16,
  },
  signOutText: { color: '#ff3b30', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: '#bbb' },
});