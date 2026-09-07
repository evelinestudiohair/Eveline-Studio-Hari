import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with specified database ID
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Analytics safely if in browser environment
export const analytics =
  typeof window !== 'undefined'
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    : null;

// Firestore Collection References Constants
export const COLLECTIONS = {
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  CLIENTS: 'clients',
  AVAILABILITY: 'availability',
  BLOCKED_SLOTS: 'blocked_slots',
  WEEKS: 'weeks',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

export default app;
