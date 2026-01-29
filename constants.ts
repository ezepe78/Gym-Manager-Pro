
import { Student, DayOfWeek, StudentStatus } from './types';

export const DAYS_SHORT: DayOfWeek[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];

export const INITIAL_STUDENTS: Student[] = [
  { 
    id: 's1', 
    name: 'Juan Pérez', 
    email: 'juan@example.com', 
    phone: '23454678', 
    schedule: [
      { id: 'sc1', day: 'Lun', startTime: '08:00', endTime: '09:00' },
      { id: 'sc2', day: 'Mie', startTime: '08:00', endTime: '09:00' },
      { id: 'sc3', day: 'Vie', startTime: '08:00', endTime: '09:00' }
    ], 
    joinDate: '2024-01-01', 
    status: StudentStatus.ACTIVE,
    birthDate: '1995-05-15',
    address: { street: 'Rivadavia', number: '123', locality: 'Del Carril' },
    evaluations: [],
    notes: 'Objetivo: Descenso de peso. Prefiere entrenar sin música fuerte.'
  },
  { 
    id: 's2', 
    name: 'María García', 
    email: 'maria@example.com', 
    phone: '23458765', 
    schedule: [
      { id: 'sc4', day: 'Lun', startTime: '08:00', endTime: '09:00' },
      { id: 'sc5', day: 'Mie', startTime: '08:00', endTime: '09:00' }
    ], 
    joinDate: '2024-01-15', 
    status: StudentStatus.ACTIVE,
    birthDate: '1998-11-22',
    address: { street: 'Mitre', number: '456', locality: 'Del Carril' },
    evaluations: [],
    notes: 'Atleta de voley. Foco en potencia de salto.'
  },
  { 
    id: 's3', 
    name: 'Carlos López', 
    email: 'carlos@example.com', 
    phone: '23455566', 
    schedule: [
      { id: 'sc6', day: 'Lun', startTime: '18:00', endTime: '19:00' },
      { id: 'sc7', day: 'Mie', startTime: '18:00', endTime: '19:00' },
      { id: 'sc8', day: 'Vie', startTime: '18:00', endTime: '19:00' }
    ], 
    joinDate: '2024-02-10', 
    status: StudentStatus.ACTIVE,
    birthDate: '1990-03-10',
    address: { street: 'Sarmiento', number: '789', locality: 'Del Carril' },
    evaluations: [],
    notes: ''
  },
  { 
    id: 's4', 
    name: 'Ana Martínez', 
    email: 'ana@example.com', 
    phone: '23459998', 
    schedule: [
      { id: 'sc9', day: 'Mar', startTime: '20:00', endTime: '21:00' },
      { id: 'sc10', day: 'Jue', startTime: '20:00', endTime: '21:00' }
    ], 
    joinDate: '2024-03-05', 
    status: StudentStatus.ACTIVE,
    birthDate: '2001-07-30',
    address: { street: 'Belgrano', number: '321', locality: 'Del Carril' },
    evaluations: [],
    notes: 'Recuperación de lesión en menisco izquierdo.'
  }
];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
