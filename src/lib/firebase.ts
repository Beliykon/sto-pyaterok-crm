import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, disableNetwork, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { isFirestoreQuotaExhausted, setFirestoreQuotaExhausted } from './syncService';

// Suppress noisy network reconnection warnings when running in offline/Spark-quota mode
try {
  setLogLevel('silent');
} catch {
  // ignore
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testConnection() {
  // If we already know quota is exhausted, immediately operate in offline mode
  if (isFirestoreQuotaExhausted()) {
    try {
      await disableNetwork(db);
    } catch {
      // ignore
    }
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration (client is offline).");
    } else if (
      error?.code === 'unavailable' || 
      error?.code === 'resource-exhausted' || 
      error?.message?.includes('Quota') ||
      error?.message?.includes('unavailable')
    ) {
      setFirestoreQuotaExhausted(24);
      try {
        await disableNetwork(db);
      } catch {
        // ignore
      }
    }
  }
}

testConnection().catch(() => {});


