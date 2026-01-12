
export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  DELINQUENT = 'DELINQUENT'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export type DayOfWeek = 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie';

export interface ScheduleSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface BodyEvaluation {
  id: string;
  date: string;
  weight: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
  };
}

export interface Fee {
  id: string;
  studentId: string;
  month: number;
  year: number;
  amountOwed: number;
}

export interface FeeConfig {
  month: number;
  year: number;
  amount: number;
}

export interface TieredRateHistory {
  month: number;
  year: number;
  rates: { [key: number]: number };
}

export interface Payment {
  id: string;
  studentId: string;
  month: number; // 0-11
  year: number;
  amount: number;
  date: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface GuestRegistration {
  id: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface Attendance {
  studentId: string;
  date: string; // YYYY-MM-DD
  time: string; // Para distinguir si va dos veces el mismo día
  present: boolean;
}

export interface Address {
  street: string;
  number: string;
  locality: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  schedule: ScheduleSlot[]; 
  joinDate: string;
  status: StudentStatus;
  birthDate: string; // YYYY-MM-DD
  address: Address;
  evaluations: BodyEvaluation[];
  notes: string; // Nueva sección de notas
}

export interface AppState {
  gymName: string;
  gymLogo: string | null;
  whatsappTemplateAgenda: string;
  whatsappTemplateDebt: string;
  students: Student[];
  fees: Fee[];
  payments: Payment[];
  expenses: Expense[];
  guests: GuestRegistration[];
  attendance: Attendance[];
  simulatedDate: string; // ISO String
  feeConfigs: FeeConfig[];
  defaultAmount: number; 
  tieredAmountHistory: TieredRateHistory[]; // Historial de precios por mes/año
  maxCapacityPerShift: number; // Nueva configuración
}
