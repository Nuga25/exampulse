import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../config/firebase';

const Field = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, hint }) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  return (
    <View style={fs.wrap}>
      <Text style={fs.label}>{label}</Text>
      {hint && <Text style={fs.hint}>{hint}</Text>}
      <View style={[fs.box, focused && fs.boxFocused]}>
        <TextInput
          style={[fs.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#aab"
          secureTextEntry={hidden}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 15 }}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const fs = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  hint: { fontSize: 11, color: '#999', marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#f5f6fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  boxFocused: { borderColor: '#000666', backgroundColor: '#fff' },
  input: { fontSize: 15, color: '#0a0a1a' },
});

const SectionCard = ({ title, children }) => (
  <View style={sc.card}>
    <Text style={sc.title}>{title}</Text>
    <View style={sc.divider} />
    {children}
  </View>
);

const sc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#0a0a1a', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f0f0f5', marginBottom: 16 },
});

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !matricNumber || !email || !department || !level || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Your passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await set(ref(database, `users/${uid}`), {
        fullName: fullName.trim(),
        matricNumber: matricNumber.toUpperCase().trim(),
        email: email.trim(),
        department: department.trim(),
        level: level.trim(),
        role: 'student',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') message = 'An account with this email already exists.';
      else if (error.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
      else if (error.code === 'auth/weak-password') message = 'Password is too weak.';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000666" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Create Account</Text>
            <Text style={s.headerSub}>ExamPulse Student Portal</Text>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionCard title="Personal Details">
            <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. John Doe" autoCapitalize="words" />
            <Field label="Matric Number" value={matricNumber} onChangeText={setMatricNumber} placeholder="e.g. 220591260" autoCapitalize="characters" />
          </SectionCard>

          <SectionCard title="Academic Information">
            <Field label="Department" value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science" autoCapitalize="words" />
            <Field label="Level" value={level} onChangeText={setLevel} placeholder="e.g. 300" keyboardType="numeric" autoCapitalize="none" />
          </SectionCard>

          <SectionCard title="Account Security">
            <Field
              label="Personal Email"
              hint="Used only for password reset — not shown to others"
              value={email}
              onChangeText={setEmail}
              placeholder="johndoe@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry />
            <Field label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />
          </SectionCard>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitBtnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginRow}>
            <Text style={s.loginText}>Already have an account? <Text style={s.loginLink}>Sign In</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000666' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#000666',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { backgroundColor: '#f5f6fa', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  submitBtn: {
    height: 54,
    backgroundColor: '#000666',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000666',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginRow: { alignItems: 'center', paddingBottom: 16 },
  loginText: { fontSize: 14, color: '#666' },
  loginLink: { color: '#000666', fontWeight: '700' },
});