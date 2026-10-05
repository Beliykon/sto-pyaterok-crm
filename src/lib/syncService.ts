import { db } from './firebase';
import { doc, onSnapshot, setDoc, getDoc, runTransaction, enableNetwork } from 'firebase/firestore';
import { Appointment, Manager, Tutor } from './types';

export interface SchoolSyncData {
  appointments: Appointment[];
  openSlots: Record<string, boolean>;
  tutors: Tutor[];
  managers: Manager[];
  deletedTutorIds?: string[];
  updatedAt: string;
  updatedBy: string;
  senderId?: string;
}

export interface SyncPushOptions {
  scopedTutorId?: string;
  scopedWeekDates?: string[];
  deletedTutorId?: string;
}

const STATE_DOC_ID = 'main_crm_state';
const QUOTA_STORAGE_KEY = 'stopyaterok_firestore_quota_exhausted_until';
export const CLIENT_INSTANCE_ID = 'client_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();

// Instantly clear any legacy quota lockout from localStorage on startup
try {
  localStorage.removeItem(QUOTA_STORAGE_KEY);
  enableNetwork(db).catch(() => {});
} catch {
  // ignore
}

export function isFirestoreQuotaExhausted(): boolean {
  return false;
}

export function setFirestoreQuotaExhausted(_hours: number = 0) {
  // No-op
}

export function clearFirestoreQuotaExhausted() {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    enableNetwork(db).catch(() => {});
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
          deletedTutorIds: Array.isArray(rawData.deletedTutorIds) ? rawData.deletedTutorIds : [],
          updatedAt: rawData.updatedAt || new Date().toISOString(),
          updatedBy: rawData.updatedBy || 'Сотрудник',
          senderId: rawData.senderId
        };

        onData(data);
      }
    },
    (err) => {
      console.warn('Real-time sync snapshot error (will auto-reconnect):', err?.message || err);
      if (onError) onError(err);
    }
  );
}

// Push local state updates to cloud with smart non-destructive merging
let saveTimeout: any = null;

export function pushSchoolStateToCloud(
  data: {
    appointments: Appointment[];
    openSlots: Record<string, boolean>;
    tutors: Tutor[];
    managers: Manager[];
  },
  userName: string = 'Сотрудник',
  immediate: boolean = false,
  options?: SyncPushOptions
): Promise<boolean> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const performSave = async (): Promise<boolean> => {
    try {
      const docRef = doc(db, 'school_state', STATE_DOC_ID);

      // Clean local openSlots
      const cleanLocalSlots: Record<string, boolean> = {};
      if (data.openSlots) {
        Object.entries(data.openSlots).forEach(([k, v]) => {
          if (v === true) {
            cleanLocalSlots[k] = true;
          }
        });
      }

      // Execute atomic transaction to merge remote data with local modifications
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);

        let remoteTutors: Tutor[] = [];
        let remoteSlots: Record<string, boolean> = {};
        let remoteAppointments: Appointment[] = [];
        let remoteManagers: Manager[] = [];
        let remoteDeletedIds: string[] = [];

        if (snap.exists()) {
          const raw = snap.data() as Partial<SchoolSyncData>;
          if (Array.isArray(raw.tutors)) remoteTutors = raw.tutors;
          if (raw.openSlots && typeof raw.openSlots === 'object') remoteSlots = raw.openSlots;
          if (Array.isArray(raw.appointments)) remoteAppointments = raw.appointments;
          if (Array.isArray(raw.managers)) remoteManagers = raw.managers;
          if (Array.isArray(raw.deletedTutorIds)) remoteDeletedIds = raw.deletedTutorIds;
        }

        const deletedSet = new Set<string>(remoteDeletedIds);
        if (options?.deletedTutorId) {
          deletedSet.add(options.deletedTutorId);
        }

        // 1. Tutors merging: union by id, excluding deleted
        const tutorMap = new Map<string, Tutor>();
        remoteTutors.forEach(t => {
          if (!deletedSet.has(t.id)) {
            tutorMap.set(t.id, t);
          }
        });
        data.tutors.forEach(t => {
          if (!deletedSet.has(t.id)) {
            tutorMap.set(t.id, t);
          }
        });
        const mergedTutors = Array.from(tutorMap.values());

        // 2. Open Slots merging: tutor-scoped updates to prevent teachers overwriting each other
        const mergedSlots: Record<string, boolean> = {};

        if (options?.scopedTutorId) {
          const scopedPrefix = `${options.scopedTutorId}_`;
          // Preserve ALL remote slots for other tutors
          Object.entries(remoteSlots).forEach(([k, v]) => {
            if (v === true && !k.startsWith(scopedPrefix)) {
              mergedSlots[k] = true;
            }
          });
          // Apply current tutor's slots from local state
          Object.entries(cleanLocalSlots).forEach(([k, v]) => {
            if (v === true && k.startsWith(scopedPrefix)) {
              mergedSlots[k] = true;
            }
          });
        } else {
          // General save: merge remote and local
          Object.entries(remoteSlots).forEach(([k, v]) => {
            if (v === true) mergedSlots[k] = true;
          });
          Object.entries(cleanLocalSlots).forEach(([k, v]) => {
            if (v === true) mergedSlots[k] = true;
          });
        }

        // Remove any slots of deleted tutors
        if (deletedSet.size > 0) {
          Object.keys(mergedSlots).forEach(k => {
            const firstUnderscore = k.indexOf('_');
            if (firstUnderscore !== -1) {
              const tutId = k.slice(0, firstUnderscore);
              if (deletedSet.has(tutId)) {
                delete mergedSlots[k];
              }
            }
          });
        }

        // 3. Appointments merging: union by id
        const appMap = new Map<string, Appointment>();
        remoteAppointments.forEach(a => appMap.set(a.id, a));
        data.appointments.forEach(a => appMap.set(a.id, a));
        const mergedAppointments = Array.from(appMap.values());

        // 4. Managers
        const mgrMap = new Map<string, Manager>();
        remoteManagers.forEach(m => mgrMap.set(m.id, m));
        data.managers.forEach(m => mgrMap.set(m.id, m));
        const mergedManagers = Array.from(mgrMap.values());

        const payload: SchoolSyncData = {
          appointments: mergedAppointments,
          openSlots: mergedSlots,
          tutors: mergedTutors,
          managers: mergedManagers,
          deletedTutorIds: Array.from(deletedSet),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          senderId: CLIENT_INSTANCE_ID
        };

        transaction.set(docRef, payload);
      });

      return true;
    } catch (e: any) {
      console.warn('Transaction sync error, attempting direct merge fallback:', e?.message || e);
      try {
        const docRef = doc(db, 'school_state', STATE_DOC_ID);
        const snap = await getDoc(docRef);
        let remoteTutors: Tutor[] = [];
        let remoteSlots: Record<string, boolean> = {};
        let remoteDeletedIds: string[] = [];
        if (snap.exists()) {
          const raw = snap.data() as Partial<SchoolSyncData>;
          if (Array.isArray(raw.tutors)) remoteTutors = raw.tutors;
          if (raw.openSlots && typeof raw.openSlots === 'object') remoteSlots = raw.openSlots;
          if (Array.isArray(raw.deletedTutorIds)) remoteDeletedIds = raw.deletedTutorIds;
        }

        const deletedSet = new Set<string>(remoteDeletedIds);
        if (options?.deletedTutorId) deletedSet.add(options.deletedTutorId);

        const tutorMap = new Map<string, Tutor>();
        remoteTutors.forEach(t => {
          if (!deletedSet.has(t.id)) tutorMap.set(t.id, t);
        });
        data.tutors.forEach(t => {
          if (!deletedSet.has(t.id)) tutorMap.set(t.id, t);
        });

        const mergedSlots = { ...remoteSlots, ...data.openSlots };

        const fallbackPayload: SchoolSyncData = {
          appointments: data.appointments,
          openSlots: mergedSlots,
          tutors: Array.from(tutorMap.values()),
          managers: data.managers,
          deletedTutorIds: Array.from(deletedSet),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          senderId: CLIENT_INSTANCE_ID
        };

        await setDoc(docRef, fallbackPayload);
        return true;
      } catch (err: any) {
        console.error('Final sync fallback failed:', err?.message || err);
        return false;
      }
    }
  };

  if (immediate) {
    return performSave();
  } else {
    return new Promise((resolve) => {
      saveTimeout = setTimeout(async () => {
        const res = await performSave();
        resolve(res);
      }, 350);
    });
  }
}
