import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!matricNumber || !password) {
      Alert.alert('Error', 'Please enter your matric number and password');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Find the email linked to this matric number
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        Alert.alert('Error', 'No accounts found. Please register first.');
        setLoading(false);
        return;
      }

      // Step 2: Search through users for matching matric number
      let userEmail = null;
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.matricNumber === matricNumber.toUpperCase()) {
          userEmail = userData.email;
        }
      });

      if (!userEmail) {
        Alert.alert('Error', 'Matric number not found. Please check and try again.');
        setLoading(false);
        return;
      }

      // Step 3: Sign in with email + password via Firebase Auth
      await signInWithEmailAndPassword(auth, userEmail, password);

      // AuthContext detects login — App.js switches to TimetableScreen automatically

    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      }
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to ExamPulse</Text>

      <TextInput
        style={styles.input}
        placeholder="Matric Number"
        value={matricNumber}
        onChangeText={setMatricNumber}
        autoCapitalize="characters"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3D5AF1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#3D5AF1',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: '#3D5AF1',
    fontSize: 14,
  },
});