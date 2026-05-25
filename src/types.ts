export interface BloodPressureReading {
  id: string;
  systolic: number; // e.g., 120
  diastolic: number; // e.g., 80
  pulse: number; // e.g., 72 bpm
  notes: string;
  tags: string[]; // e.g., 'Braço Esquerdo', 'Sentado', 'Antes do Remédio'
  measuredAt: string; // ISO String
}

export interface GlucoseReading {
  id: string;
  value: number; // e.g., 98 mg/dL
  mealState: 'jejum' | 'pre_prandial' | 'pos_prandial' | 'antes_de_dormir' | 'outro';
  notes: string;
  tags: string[]; // e.g., 'Jejum', 'Antes do almoço'
  measuredAt: string; // ISO String
}

export interface WeightReading {
  id: string;
  weight: number; // in kg, e.g. 70.5
  notes: string;
  measuredAt: string; // ISO String
}


export interface HabitAlert {
  id: string;
  time: string; // "HH:MM"
  label: string; // e.g., "Medir glicose pós-café"
  type: 'pressure' | 'glucose' | 'both';
  active: boolean;
  days: string[]; // ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  sound?: 'beep' | 'chime' | 'ding'; // New field for alert sound
}

export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  isConfigured: boolean;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage: string | null;
}

export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  additionalInfo: string;
  height: number; // in cm, e.g., 175
  weight: number; // in kg, e.g., 70
  targetWeight?: number; // in kg, optional goal weight
}

export interface SavedAccount {
  email: string;
  name: string;
  isAdmin?: boolean;
}

export type ActivityType = 'academia' | 'bicicleta' | 'corrida' | 'caminhada' | 'lutas' | 'outro';

export interface WorkoutDataPoint {
  timestamp: string;
  heartRate: number;
  latitude?: number;
  longitude?: number;
  speed?: number; // m/s
  altitude?: number;
}

export interface WorkoutSession {
  id: string;
  type: ActivityType;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  duration: number; // in seconds
  distance: number; // in meters
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  minSpeed: number; // km/h
  kcalEstimate: number;
  points: WorkoutDataPoint[];
  peakHeartRateLocation?: { lat: number, lng: number };
  locationName?: string;
  pathPreviewData?: string;
}


