import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCHRGPEhC_IcbqAEP9lrYkpXCPV9xr5xfM",
    authDomain: "exampulse-285b3.firebaseapp.com",
    databaseURL: "https://exampulse-285b3-default-rtdb.firebaseio.com",
    projectId: "exampulse-285b3",
    storageBucket: "exampulse-285b3.firebasestorage.app",
    messagingSenderId: "344609509118",
    appId: "1:344609509118:web:096e02c3dc8c72d8c9dfaf"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const database = getDatabase(app);