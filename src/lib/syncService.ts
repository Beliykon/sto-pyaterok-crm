import { db } from './firebase';
import { doc, onSnapshot, setDoc, disableNetwork, enableNetwork } from 'firebase/firestore';
import { Appointment, Manager, Tutor } from './types';

export interface SchoolSyncData {
  appointments: Appointment[];
  openSlots: Record<string, boolean>;
  tutors: Tutor[];
  managers: Manager[];
  updatedAt: string;
  updatedBy: string;
}

const STATE_DOC_ID = 'main_crm_state';
const QUOTA_STORAGE_KEY = 'stopyaterok_firestore_quota_exhausted_until';

export function isFirestoreQuotaExhausted(): boolean {
  try {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (!isNaN(until) && until > Date.now()) {
        return true;
      }
    }
  } catch {
    // ignore storage access issues
  }
  return false;
}

export function setFirestoreQuotaExhausted(hours: number = 6) {
  try {
    const until = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(QUOTA_STORAGE_KEY, String(until));
  } catch {
    // ignore storage access issues
  }
}

export function clearFirestoreQuotaExhausted() {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function reconnectCloudSync() {
  clearFirestoreQuotaExhausted();
  try {
    await enableNetwork(db);
  } catch {
    // ignore
  }
}

// Subscribe to real-time changes from cloud
export function subscribeToSchoolState(
  onData: (data: SchoolSyncData) => void,
  onError?: (error: any) => void
) {
  // If quota is already exhausted, disable network to avoid connection failed logs
  if (isFirestoreQuotaExhausted()) {
    disableNetwork(db).catch(() => {});
    if (onError) onError(new Error('Quota limit exceeded / offline'));
    return () => {};
  }

  const docRef = doc(db, 'school_state', STATE_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SchoolSyncData;
        onData(data);
      }
    },
    (err) => {
      if (
        err?.code === 'resource-exhausted' ||
        err?.code === 'unavailable' ||
        err?.message?.includes('Quota') ||
        err?.message?.includes('unavailable') ||
        err?.message?.includes('Connection failed')
      ) {
        setFirestoreQuotaExhausted(12);
        disableNetwork(db).catch(() => {});
      }
      if (onError) onError(err);
    }
  );
}

// Push local state updates to cloud (debounced or on user action)
let saveTimeout: any = null;

export function pushSchoolStateToCloud(
  data: {
    appointments: Appointment[];
    openSlots: Record<string, boolean>;
    tutors: Tutor[];
    managers: Manager[];
  },
  userName: string = 'Сотрудник'
) {
  if (saveTimeout) clearTimeout(saveTimeout);

  // If daily quota is reached on Firestore Free tier or offline, bypass all remote writes immediately
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  saveTimeout = setTimeout(async () => {
    // Double check before sending network request
    if (isFirestoreQuotaExhausted()) {
      return;
    }

    try {
      const docRef = doc(db, 'school_state', STATE_DOC_ID);
      const payload: SchoolSyncData = {
        appointments: data.appointments,
        openSlots: data.openSlots,
        tutors: data.tutors,
        managers: data.managers,
        updatedAt: new Date().toISOString(),
        updatedBy: userName
      };
      await setDoc(docRef, payload, { merge: true });
    } catch (e: any) {
      if (
        e?.code === 'resource-exhausted' ||
        e?.code === 'unavailable' ||
        e?.message?.includes('Quota') ||
        e?.message?.includes('unavailable') ||
        e?.message?.includes('Connection failed')
      ) {
        setFirestoreQuotaExhausted(12);
        disableNetwork(db).catch(() => {});
        console.warn(
          'Firestore cloud write quota reached or backend unavailable. Switched to offline mode with local storage preservation.'
        );
      } else {
        console.warn('Unable to push cloud sync update:', e?.message || e);
      }
    }
  }, 1500); // 1.5-second debounce to avoid rapid write spam
}
