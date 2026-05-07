import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [matricFocused, setMatricFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!matricNumber || !password) {
      Alert.alert('Missing fields', 'Please enter your matric number and password');
      return;
    }
    setLoading(true);
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      if (!snapshot.exists()) {
        Alert.alert('Not found', 'No accounts found. Please register first.');
        setLoading(false);
        return;
      }
      let userEmail = null;
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.matricNumber === matricNumber.toUpperCase()) {
          userEmail = data.email;
        }
      });
      if (!userEmail) {
        Alert.alert('Not found', 'Matric number not found. Please check and try again.');
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, userEmail, password);
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Try again later.';
      }
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000666" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={s.hero}>
            <View style={s.heroInner}>
              <Image
                source={require('../assets/logo.png')}
                style={{ width: 56, height: 56, marginBottom: 16 }}
                resizeMode="contain"
              />
              <Text style={s.heroTitle}>ExamPulse</Text>
              <Text style={s.heroSub}>Your academic command centre</Text>
            </View>
          </View>

          {/* Form Area */}
          <View style={s.formArea}>
            <Text style={s.formTitle}>Welcome back</Text>
            <Text style={s.formSub}>Sign in to access your timetable</Text>

            {/* Matric Input */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Matric Number</Text>
              <View style={[s.inputBox, matricFocused && s.inputBoxFocused]}>
                <TextInput
                  style={s.inputText}
                  placeholder="e.g. 220591260"
                  placeholderTextColor="#aab"
                  value={matricNumber}
                  onChangeText={setMatricNumber}
                  autoCapitalize="characters"
                  onFocus={() => setMatricFocused(true)}
                  onBlur={() => setMatricFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={s.fieldWrap}>
              <View style={s.fieldLabelRow}>
                <Text style={s.fieldLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={s.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[s.inputBox, passwordFocused && s.inputBoxFocused]}>
                <TextInput
                  style={[s.inputText, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#aab"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Text style={s.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[s.signInBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.signInBtnText}>Sign In</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Register */}
            <TouchableOpacity
              style={s.registerBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.88}
            >
              <Text style={s.registerBtnText}>Create an account</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000666',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: '#000666',
  },
  hero: {
    backgroundColor: '#000666',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 28,
  },
  heroInner: {
    alignItems: 'center',
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoMarkText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  formArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0a0a1a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000666',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#f5f6fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputBoxFocused: {
    borderColor: '#000666',
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 15,
    color: '#0a0a1a',
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeText: {
    fontSize: 16,
  },
  signInBtn: {
    height: 54,
    backgroundColor: '#000666',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000666',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  signInBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },
  registerBtn: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000666',
  },
  registerBtnText: {
    color: '#000666',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});