import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { pickAndParseCourseForm } from '../utils/parseDocument';

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
          textContentType={secureTextEntry ? 'oneTimeCode' : 'none'}
          autoComplete="off"
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

// Step indicator
const StepIndicator = ({ currentStep }) => (
  <View style={si.wrap}>
    {[1, 2, 3].map((step) => (
      <View key={step} style={si.stepWrap}>
        <View style={[si.circle, currentStep >= step && si.circleActive]}>
          <Text style={[si.circleText, currentStep >= step && si.circleTextActive]}>
            {currentStep > step ? '✓' : step}
          </Text>
        </View>
        {step < 3 && <View style={[si.line, currentStep > step && si.lineActive]} />}
      </View>
    ))}
  </View>
);

const si = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepWrap: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f0f0f5', alignItems: 'center', justifyContent: 'center',
  },
  circleActive: { backgroundColor: '#000666' },
  circleText: { fontSize: 13, fontWeight: '700', color: '#999' },
  circleTextActive: { color: '#fff' },
  line: { width: 48, height: 2, backgroundColor: '#f0f0f5', marginHorizontal: 4 },
  lineActive: { backgroundColor: '#000666' },
});

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);

  // Step 1 — basic info
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 — AI parsed courses
  const [parsedData, setParsedData] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');

  // Step 3 — confirm and submit
  const [loading, setLoading] = useState(false);

  const handleStep1 = () => {
    if (!fullName || !email || !matricNumber || !password) {
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
    setStep(2);
  };

  const handleUploadCourseForm = async () => {
    setParsing(true);
    try {
      const data = await pickAndParseCourseForm();
      if (!data) { setParsing(false); return; }

      setParsedData(data);
      setCourses(data.courses || []);
      setDepartment(data.department || '');
      setLevel(String(data.level || ''));
      setStep(3);
    } catch (error) {
      Alert.alert('Parse failed', 'Could not read your course form. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleRegister = async () => {
    if (courses.length === 0) {
      Alert.alert('No courses', 'Please upload your course registration form first.');
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
        courses: courses.map(c => ({
          courseCode: c.courseCode.replace(/\s/g, '').toUpperCase(),
          courseTitle: c.courseTitle,
          units: c.units,
          status: c.status,
        })),
        semester: parsedData?.semester || '',
        session: parsedData?.session || '',
        createdAt: new Date().toISOString(),
      });

    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') message = 'An account with this email already exists.';
      else if (error.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
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
          <TouchableOpacity
            onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
            style={s.backBtn}
          >
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Create Account</Text>
            <Text style={s.headerSub}>
              {step === 1 ? 'Basic information' : step === 2 ? 'Upload course form' : 'Confirm your courses'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator currentStep={step} />

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <View>
              <View style={s.card}>
                <Text style={s.cardTitle}>Personal Details</Text>
                <View style={s.cardDivider} />
                <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. Jane Doe" autoCapitalize="words" />
                <Field label="Matric Number" value={matricNumber} onChangeText={setMatricNumber} placeholder="e.g. 220591260" autoCapitalize="characters" />
              </View>

              <View style={s.card}>
                <Text style={s.cardTitle}>Account Security</Text>
                <View style={s.cardDivider} />
                <Field
                  label="Personal Email"
                  hint="Used only for password reset"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="janedoe@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field label="Password" value={password} onChangeText={setPassword} placeholder="Min. 6 characters" secureTextEntry />
                <Field label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />
              </View>

              <TouchableOpacity style={s.primaryBtn} onPress={handleStep1} activeOpacity={0.88}>
                <Text style={s.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Upload course form */}
          {step === 2 && (
            <View>
              <View style={s.card}>
                <Text style={s.cardTitle}>Course Registration Form</Text>
                <View style={s.cardDivider} />
                <Text style={s.uploadDesc}>
                  Upload your official course registration form PDF. Our AI will automatically extract your registered courses for this semester.
                </Text>

                <View style={s.uploadBox}>
                  <Text style={s.uploadIcon}>📄</Text>
                  <Text style={s.uploadTitle}>Upload Course Form PDF</Text>
                  <Text style={s.uploadSub}>Your form from the university portal</Text>
                </View>

                <TouchableOpacity
                  style={[s.primaryBtn, parsing && { opacity: 0.7 }]}
                  onPress={handleUploadCourseForm}
                  disabled={parsing}
                  activeOpacity={0.88}
                >
                  {parsing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={s.primaryBtnText}>Reading your form...</Text>
                    </View>
                  ) : (
                    <Text style={s.primaryBtnText}>📎  Select PDF</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setStep(3)} style={s.skipBtn}>
                <Text style={s.skipBtnText}>Skip for now — enter courses manually later</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3 — Confirm courses */}
          {step === 3 && (
            <View>
              {/* Parsed info summary */}
              {parsedData && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryTitle}>✅ Form Read Successfully</Text>
                  <Text style={s.summaryText}>{department} — {level} Level</Text>
                  <Text style={s.summaryText}>{parsedData.semester} • {parsedData.session}</Text>
                </View>
              )}

              {/* Course list */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Your Registered Courses ({courses.length})</Text>
                <View style={s.cardDivider} />
                {courses.length === 0 ? (
                  <Text style={s.noCourses}>No courses found. You can add them later from your profile.</Text>
                ) : (
                  courses.map((course, index) => (
                    <View key={index} style={[s.courseRow, index < courses.length - 1 && s.courseRowBorder]}>
                      <View style={s.courseLeft}>
                        <Text style={s.courseCode}>{course.courseCode.replace(/\s/g, '')}</Text>
                        <Text style={s.courseTitle}>{course.courseTitle}</Text>
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
                  ))
                )}
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Create Account</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep(2)} style={s.skipBtn}>
                <Text style={s.skipBtnText}>← Re-upload form</Text>
              </TouchableOpacity>
            </View>
          )}

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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 20, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { backgroundColor: '#f5f6fa', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0a0a1a', marginBottom: 12 },
  cardDivider: { height: 1, backgroundColor: '#f0f0f5', marginBottom: 16 },
  uploadDesc: { fontSize: 14, color: '#666', lineHeight: 21, marginBottom: 20 },
  uploadBox: {
    borderWidth: 2, borderColor: '#e0e0ff', borderStyle: 'dashed',
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20,
    backgroundColor: '#f8f8ff',
  },
  uploadIcon: { fontSize: 40, marginBottom: 8 },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: '#000666', marginBottom: 4 },
  uploadSub: { fontSize: 13, color: '#888' },
  primaryBtn: {
    height: 54, backgroundColor: '#000666',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000666', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  skipBtnText: { fontSize: 13, color: '#888' },
  summaryCard: {
    backgroundColor: '#e8f5e9', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#2e7d32',
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#2e7d32', marginBottom: 4 },
  summaryText: { fontSize: 13, color: '#444', marginTop: 2 },
  courseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  courseRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f6fa' },
  courseLeft: { flex: 1, marginRight: 12 },
  courseCode: { fontSize: 12, fontWeight: '800', color: '#000666', letterSpacing: 0.5 },
  courseTitle: { fontSize: 13, color: '#666', marginTop: 2 },
  courseRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    backgroundColor: '#e8f5e9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  electiveBadge: { backgroundColor: '#fff3e0' },
  statusText: { fontSize: 9, fontWeight: '800', color: '#2e7d32', letterSpacing: 0.5 },
  electiveText: { color: '#e65100' },
  courseUnits: { fontSize: 11, color: '#999' },
  noCourses: { fontSize: 14, color: '#888', textAlign: 'center', paddingVertical: 20 },
  loginRow: { alignItems: 'center', paddingVertical: 16 },
  loginText: { fontSize: 14, color: '#666' },
  loginLink: { color: '#000666', fontWeight: '700' },
});