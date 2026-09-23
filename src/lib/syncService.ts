import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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

// Subscribe to real-time changes from cloud
export function subscribeToSchoolState(
  onData: (data: SchoolSyncData) => void,
  onError?: (error: any) => void
) {
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
      console.warn('Realtime cloud sync listener notice:', err);
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

  saveTimeout = setTimeout(async () => {
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
    } catch (e) {
      console.warn('Unable to push cloud sync update:', e);
    }
  }, 1000); // 1-second debounce to avoid spamming writes on rapid clicks
}
