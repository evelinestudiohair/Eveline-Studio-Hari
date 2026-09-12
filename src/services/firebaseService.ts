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
import { compressBase64Image } from '../utils/imageCompressor';
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

/**
 * Ensures any base64 image inside settings is strictly compressed and safely within
 * the 1 MiB limit of Firestore documents.
 */
export async function sanitizeSettingsForFirestore(
  settings: SalonSettings
): Promise<SalonSettings> {
  const sanitized: SalonSettings = { ...settings };

  try {
    if (sanitized.logoUrl && sanitized.logoUrl.startsWith('data:image')) {
      sanitized.logoUrl = await compressBase64Image(sanitized.logoUrl, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        maxSizeBytes: 100 * 1024,
      });
    }

    if (sanitized.ownerCoverUrl && sanitized.ownerCoverUrl.startsWith('data:image')) {
      sanitized.ownerCoverUrl = await compressBase64Image(sanitized.ownerCoverUrl, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        maxSizeBytes: 150 * 1024,
      });
    }

    // Secondary emergency safety check: if JSON stringify exceeds 850 KB, fallback images to prevent Firestore rejection
    const estimatedSize = JSON.stringify(sanitized).length;
    if (estimatedSize > 850 * 1024) {
      if (sanitized.ownerCoverUrl?.startsWith('data:image')) {
        sanitized.ownerCoverUrl = INITIAL_SETTINGS.ownerCoverUrl;
      }
      if (sanitized.logoUrl?.startsWith('data:image')) {
        sanitized.logoUrl = INITIAL_SETTINGS.logoUrl;
      }
    }
  } catch (err) {
    console.warn('[Firebase] Falha na compressão preventiva de configurações:', err);
  }

  return sanitized;
}

// Settings
export async function saveSettingsToFirebase(settings: SalonSettings): Promise<void> {
  try {
    const payload = await sanitizeSettingsForFirestore(settings);
    const ref = doc(db, COLLECTIONS.SETTINGS, 'default');
    await setDoc(ref, payload, { merge: true });
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
// SYNC LOCAL STATE TO FIREBASE & CONNECTION CHECK
// ----------------------------------------------------
export async function syncAllStateToFirebase(state: {
  services: Service[];
  availability: DayAvailabilityConfig[];
  weeks: WeekConfig[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  clients: Client[];
  notifications: NotificationItem[];
  settings: SalonSettings;
}): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    // Settings (sanitized and compressed)
    const sanitizedSettings = await sanitizeSettingsForFirestore(state.settings);
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'default');
    batch.set(settingsRef, sanitizedSettings, { merge: true });

    // Services
    for (const service of state.services) {
      const sRef = doc(db, COLLECTIONS.SERVICES, service.id);
      batch.set(sRef, service, { merge: true });
    }

    // Availability
    for (const avail of state.availability) {
      const aRef = doc(db, COLLECTIONS.AVAILABILITY, `day-${avail.dayOfWeek}`);
      batch.set(aRef, avail, { merge: true });
    }

    // Weeks
    for (const week of state.weeks) {
      const wRef = doc(db, COLLECTIONS.WEEKS, week.id);
      batch.set(wRef, week, { merge: true });
    }

    // Blocked Slots
    for (const block of state.blockedSlots) {
      const bRef = doc(db, COLLECTIONS.BLOCKED_SLOTS, block.id);
      batch.set(bRef, block, { merge: true });
    }

    // Clients
    for (const client of state.clients) {
      const cRef = doc(db, COLLECTIONS.CLIENTS, client.id);
      batch.set(cRef, client, { merge: true });
    }

    // Appointments
    for (const apt of state.appointments) {
      const aptRef = doc(db, COLLECTIONS.APPOINTMENTS, apt.id);
      batch.set(aptRef, apt, { merge: true });
    }

    // Notifications
    for (const notif of state.notifications) {
      const nRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
      batch.set(nRef, notif, { merge: true });
    }

    await batch.commit();
    return {
      success: true,
      message: 'Todas as coleções e dados foram sincronizados com o Firebase Firestore!',
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Falha na sincronização';
    return {
      success: false,
      message: `Erro ao sincronizar com Firebase: ${err}`,
    };
  }
}

export async function checkFirebaseHealth(): Promise<{
  connected: boolean;
  counts: FirebaseSyncStatus['collectionsCount'];
  error: string | null;
}> {
  try {
    const [
      servicesSnap,
      appointmentsSnap,
      clientsSnap,
      availabilitySnap,
      blockedSnap,
      weeksSnap,
      notificationsSnap,
      settingsSnap,
    ] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.SERVICES)),
      getDocs(collection(db, COLLECTIONS.APPOINTMENTS)),
      getDocs(collection(db, COLLECTIONS.CLIENTS)),
      getDocs(collection(db, COLLECTIONS.AVAILABILITY)),
      getDocs(collection(db, COLLECTIONS.BLOCKED_SLOTS)),
      getDocs(collection(db, COLLECTIONS.WEEKS)),
      getDocs(collection(db, COLLECTIONS.NOTIFICATIONS)),
      getDocs(collection(db, COLLECTIONS.SETTINGS)),
    ]);

    return {
      connected: true,
      counts: {
        services: servicesSnap.size,
        appointments: appointmentsSnap.size,
        clients: clientsSnap.size,
        availability: availabilitySnap.size,
        blockedSlots: blockedSnap.size,
        weeks: weeksSnap.size,
        notifications: notificationsSnap.size,
        settings: settingsSnap.size,
      },
      error: null,
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : 'Erro ao conectar com Firestore';
    return {
      connected: false,
      counts: {
        services: 0,
        appointments: 0,
        clients: 0,
        availability: 0,
        blockedSlots: 0,
        weeks: 0,
        notifications: 0,
        settings: 0,
      },
      error: err,
    };
  }
}

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
