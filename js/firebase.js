/**
 * Our Nikah Memories - Firebase Cloud Firestore Integration
 * Provides real-time cross-device synchronization for guest selfies, access logs,
 * and approved members. Ensures selfies taken on ANY mobile phone appear immediately
 * in the Admin Dashboard on Salman's phone.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

// Firebase configuration from provisioned environment
export const firebaseConfig = {
  projectId: "gen-lang-client-0999255214",
  appId: "1:409766921210:web:2c33f27bc06ac8f764da43",
  apiKey: "AIzaSyB5WJtqpakgUXP8DXrMDl4_F0tFbCfzldQ",
  authDomain: "gen-lang-client-0999255214.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-ournikahmemories-2fb993da-8d84-45ab-904d-5f975b21802d",
  storageBucket: "gen-lang-client-0999255214.firebasestorage.app",
  messagingSenderId: "409766921210",
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Validate connection per skill instructions
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Checking fallback.');
    }
  }
}

// 1. Save guest selfie access record to Firestore
export async function saveSelfieToFirestore(log) {
  try {
    const logId = log.id || ('log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const cleanLog = {
      id: logId,
      memberId: log.memberId || 'mem_guest',
      name: log.name || 'Wedding Guest',
      email: log.email || '',
      phone: log.phone || '',
      folderId: log.folderId || 'shaadi',
      folderName: log.folderName || 'Shaadi',
      selfieImage: log.selfieImage || '',
      timestamp: log.timestamp || new Date().toISOString(),
      deviceInfo: log.deviceInfo || 'Mobile Web',
      status: log.status || 'Granted',
    };

    const docRef = doc(db, 'access_logs', logId);
    await setDoc(docRef, cleanLog);
    console.log('Selfie saved to Firestore successfully:', logId);
    return { success: true, id: logId, log: cleanLog };
  } catch (err) {
    console.error('Failed to save selfie to Firestore:', err);
    return { success: false, error: err };
  }
}

// 2. Fetch all guest selfies from Firestore
export async function getSelfiesFromFirestore() {
  try {
    const logsRef = collection(db, 'access_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((docSnap) => {
      logs.push(docSnap.data());
    });
    return logs;
  } catch (err) {
    console.warn('getSelfiesFromFirestore query error, trying un-ordered fetch:', err);
    try {
      const logsRef = collection(db, 'access_logs');
      const snapshot = await getDocs(logsRef);
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data());
      });
      // Sort in JS
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return logs;
    } catch (fallbackErr) {
      console.error('Failed to fetch selfies from Firestore:', fallbackErr);
      return [];
    }
  }
}

// 3. Subscribe to real-time selfie updates for Admin Dashboard
export function subscribeToSelfies(onUpdate) {
  try {
    const logsRef = collection(db, 'access_logs');
    return onSnapshot(
      logsRef,
      (snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data());
        });
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onUpdate(logs);
      },
      (error) => {
        console.warn('Firestore subscription warning:', error);
      }
    );
  } catch (err) {
    console.error('Failed to subscribe to Firestore selfies:', err);
    return () => {};
  }
}
