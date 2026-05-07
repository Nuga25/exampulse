import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top — brand */}
      <View style={s.top}>
        <Image
          source={require('../assets/logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.appName}>ExamPulse</Text>
        <Text style={s.headline}>Never miss an{'\n'}exam again.</Text>
        <Text style={s.sub}>
          Real-time notifications and your personalised timetable, always in your pocket.
        </Text>
      </View>

      {/* Bottom — actions */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <Text style={s.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <Text style={s.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          By continuing you agree to our Terms and Privacy Policy
        </Text>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  top: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  headline: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000666',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 16,
  },
  sub: {
    fontSize: 15,
    color: '#888',
    lineHeight: 23,
    maxWidth: 300,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  primaryBtn: {
    height: 54,
    backgroundColor: '#000666',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000666',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000666',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: '#000666',
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 16,
  },
});