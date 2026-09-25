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
  senderId?: string;
}

const STATE_DOC_ID = 'main_crm_state';
const QUOTA_STORAGE_KEY = 'stopyaterok_firestore_quota_exhausted_until';
export const CLIENT_INSTANCE_ID = 'client_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();

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
      // Ignore local optimistic writes to prevent reverting newer local user actions
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }

      if (snapshot.exists()) {
        const rawData = snapshot.data() as Partial<SchoolSyncData>;
        
        // If this update was published by our own client session, do not echo it back
        if (rawData.senderId && rawData.senderId === CLIENT_INSTANCE_ID) {
          return;
        }

        // Clean openSlots: only keep keys where value is strictly true
        const cleanedSlots: Record<string, boolean> = {};
        if (rawData.openSlots && typeof rawData.openSlots === 'object') {
          Object.entries(rawData.openSlots).forEach(([k, v]) => {
            if (v === true) {
              cleanedSlots[k] = true;
            }
          });
        }

        const data: SchoolSyncData = {
          appointments: Array.isArray(rawData.appointments) ? rawData.appointments : [],
          openSlots: cleanedSlots,
          tutors: Array.isArray(rawData.tutors) ? rawData.tutors : [],
          managers: Array.isArray(rawData.managers) ? rawData.managers : [],
          updatedAt: rawData.updatedAt || new Date().toISOString(),
          updatedBy: rawData.updatedBy || 'Сотрудник',
          senderId: rawData.senderId
        };

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
  userName: string = 'Сотрудник',
  immediate: boolean = false
) {
  if (saveTimeout) clearTimeout(saveTimeout);

  // If daily quota is reached on Firestore Free tier or offline, bypass all remote writes immediately
  if (isFirestoreQuotaExhausted()) {
    return;
  }

  const performSave = async () => {
    // Double check before sending network request
    if (isFirestoreQuotaExhausted()) {
      return;
    }

    try {
      const docRef = doc(db, 'school_state', STATE_DOC_ID);
      
      // Clean openSlots before saving to eliminate any undefined, null, or false keys
      const cleanSlots: Record<string, boolean> = {};
      if (data.openSlots) {
        Object.entries(data.openSlots).forEach(([k, v]) => {
          if (v === true) {
            cleanSlots[k] = true;
          }
        });
      }

      const payload: SchoolSyncData = {
        appointments: data.appointments,
        openSlots: cleanSlots,
        tutors: data.tutors,
        managers: data.managers,
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        senderId: CLIENT_INSTANCE_ID
      };

      // CRITICAL: Do NOT use { merge: true } here.
      // Firestore's { merge: true } does not remove deleted keys from Map fields.
      // Full document write ensures deleted slots are permanently removed from Firestore!
      await setDoc(docRef, payload);
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
  };

  if (immediate) {
    performSave();
  } else {
    saveTimeout = setTimeout(performSave, 350); // 350ms debounce for responsive sync
  }
}
