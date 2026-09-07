import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';
import {
  Appointment,
  BlockedSlot,
  Client,
  DayAvailabilityConfig,
  NotificationItem,
  SalonSettings,
  Service,
  WeekConfig,
} from '../types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_AVAILABILITY,
  INITIAL_BLOCKED_SLOTS,
  INITIAL_CLIENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_WEEKS,
} from '../data/initialData';

export interface FirebaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  collectionsCount: {
    services: number;
    appointments: number;
    clients: number;
    availability: number;
    blockedSlots: number;
    weeks: number;
    notifications: number;
    settings: number;
  };
  error: string | null;
}

// ----------------------------------------------------
// BOOTSTRAP / SEED INITIAL DATA TO ALL FIRESTORE COLLECTIONS
// ----------------------------------------------------
export async function bootstrapFirestoreCollections(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const batch = writeBatch(db);

    // 1. Settings
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'default');
    batch.set(settingsRef, INITIAL_SETTINGS, { merge: true });

    // 2. Services
    for (const service of INITIAL_SERVICES) {
      const sRef = doc(db, COLLECTIONS.SERVICES, service.id);
      batch.set(sRef, service, { merge: true });
    }

    // 3. Availability
    for (const avail of INITIAL_AVAILABILITY) {
      const aRef = doc(db, COLLECTIONS.AVAILABILITY, `day-${avail.dayOfWeek}`);
      batch.set(aRef, avail, { merge: true });
    }

    // 4. Weeks
    for (const week of INITIAL_WEEKS) {
      const wRef = doc(db, COLLECTIONS.WEEKS, week.id);
      batch.set(wRef, week, { merge: true });
    }

    // 5. Blocked Slots
    for (const block of INITIAL_BLOCKED_SLOTS) {
      const bRef = doc(db, COLLECTIONS.BLOCKED_SLOTS, block.id);
      batch.set(bRef, block, { merge: true });
    }

    // 6. Clients
    for (const client of INITIAL_CLIENTS) {
      const cRef = doc(db, COLLECTIONS.CLIENTS, client.id);
      batch.set(cRef, client, { merge: true });
    }

    // 7. Appointments
    for (const apt of INITIAL_APPOINTMENTS) {
      const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, apt.id);
      batch.set(aptRef, apt, { merge: true });
    }

    // 8. Notifications
    for (const notif of INITIAL_NOTIFICATIONS) {
      const nRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
      batch.set(nRef, notif, { merge: true });
    }

    await batch.commit();
    return {
      success: true,
      message: 'Todas as coleções do Firebase foram inicializadas com sucesso!',
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Falha desconhecida';
    console.warn('[Firebase] Erro ao inicializar coleções:', errMessage);
    return {
      success: false,
      message: `Erro ao inicializar Firebase: ${errMessage}`,
    };
  }
}

// ----------------------------------------------------
// FIRESTORE CRUD OPERATIONS
// ----------------------------------------------------

// Settings
export async function saveSettingsToFirebase(settings: SalonSettings): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'default');
    await setDoc(ref, settings, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar configurações:', error);
  }
}

export async function fetchSettingsFromFirebase(): Promise<SalonSettings | null> {
  try {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'default');
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return snapshot.data() as SalonSettings;
    }
    return null;
  } catch (error) {
    console.warn('[Firebase] Erro ao carregar configurações:', error);
    return null;
  }
}

// Appointments
export async function saveAppointmentToFirebase(appointment: Appointment): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.APPOINTMENTS, appointment.id);
    await setDoc(ref, appointment, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar agendamento:', error);
  }
}

export async function deleteAppointmentFromFirebase(appointmentId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn('[Firebase] Erro ao excluir agendamento:', error);
  }
}

// Services
export async function saveServiceToFirebase(service: Service): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.SERVICES, service.id);
    await setDoc(ref, service, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar serviço:', error);
  }
}

export async function deleteServiceFromFirebase(serviceId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.SERVICES, serviceId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn('[Firebase] Erro ao excluir serviço:', error);
  }
}

// Availability
export async function saveAvailabilityToFirebase(
  dayConfig: DayAvailabilityConfig
): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.AVAILABILITY, `day-${dayConfig.dayOfWeek}`);
    await setDoc(ref, dayConfig, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar disponibilidade:', error);
  }
}

// Weeks
export async function saveWeekToFirebase(week: WeekConfig): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.WEEKS, week.id);
    await setDoc(ref, week, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar semana:', error);
  }
}

// Blocked Slots
export async function saveBlockedSlotToFirebase(block: BlockedSlot): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BLOCKED_SLOTS, block.id);
    await setDoc(ref, block, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar bloqueio:', error);
  }
}

export async function deleteBlockedSlotFromFirebase(blockId: string): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.BLOCKED_SLOTS, blockId);
    await deleteDoc(ref);
  } catch (error) {
    console.warn('[Firebase] Erro ao excluir bloqueio:', error);
  }
}

// Clients
export async function saveClientToFirebase(client: Client): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.CLIENTS, client.id);
    await setDoc(ref, client, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar cliente:', error);
  }
}

// Notifications
export async function saveNotificationToFirebase(
  notification: NotificationItem
): Promise<void> {
  try {
    const ref = doc(db, COLLECTIONS.NOTIFICATIONS, notification.id);
    await setDoc(ref, notification, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar notificação:', error);
  }
}

// ----------------------------------------------------
// REAL-TIME LISTENERS
// ----------------------------------------------------
export function subscribeToFirestoreCollection<T>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const list: T[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      onData(list);
    },
    (err) => {
      console.warn(`[Firebase] Erro ao escutar coleção ${collectionName}:`, err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToSettings(
  onData: (settings: SalonSettings) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = doc(db, COLLECTIONS.SETTINGS, 'default');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SalonSettings);
      }
    },
    (err) => {
      console.warn('[Firebase] Erro ao escutar configurações:', err);
      if (onError) onError(err);
    }
  );
}
