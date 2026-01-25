
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Student, Payment, Attendance, PaymentStatus, StudentStatus, Fee, FeeConfig, Expense, GuestRegistration, BodyEvaluation, TieredRateHistory, DayOfWeek } from '../types';
import { INITIAL_STUDENTS } from '../constants';
import { db } from '../lib/db';

interface AppContextType extends AppState {
  currentView: string;
  focusedStudentId: string | null;
  loading: boolean;
  setCurrentView: (view: string) => void;
  setFocusedStudentId: (id: string | null) => void;
  navigateToStudent: (id: string) => void;
  setSimulatedDate: (date: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  deletePayment: (paymentId: string) => void;
  registerBulkFees: (month: number, year: number) => void;
  setFeeConfig: (config: FeeConfig) => void;
  setDefaultAmount: (amount: number) => void;
  setHistoricalTieredAmount: (month: number, year: number, rates: { [key: number]: number }) => void;
  deleteHistoricalTieredAmount: (month: number, year: number) => void;
  getRatesForPeriod: (month: number, year: number) => { [key: number]: number };
  toggleAttendance: (studentId: string, date: string, time: string) => void;
  getStudentStatus: (studentId: string) => PaymentStatus;
  getStudentDebt: (studentId: string) => { month: number; year: number; owed: number; paid: number }[];
  getTotalDelinquentDebt: () => number;
  resetData: () => void;
  updateStudent: (student: Student) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  moveStudentSchedule: (studentId: string, oldDay: DayOfWeek, oldStartTime: string, newDay: DayOfWeek, newStartTime: string) => boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addGuest: (guest: Omit<GuestRegistration, 'id'>) => void;
  deleteGuest: (id: string) => void;
  addEvaluation: (studentId: string, evaluation: Omit<BodyEvaluation, 'id'>) => void;
  updateGymInfo: (name: string, logo: string | null) => void;
  updateWhatsappTemplates: (agenda: string, debt: string) => void;
  updateMaxCapacity: (capacity: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'gym_manager_state_v14'; 

const DEFAULT_RATES = {
  1: 15000,
  2: 18000,
  3: 21000,
  4: 24000,
  5: 27000
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    gymName: 'GymPro',
    gymLogo: null,
    whatsappTemplateAgenda: 'Hola {studentName}, confirmamos tu turno de las {time} para hoy en {gymName}. ¡Te esperamos!',
    whatsappTemplateDebt: 'Hola {studentName}, te contactamos de {gymName} para recordarte que tenés una cuota pendiente. ¡Gracias!',
    students: INITIAL_STUDENTS,
    fees: [],
    payments: [],
    expenses: [],
    guests: [],
    attendance: [],
    simulatedDate: new Date().toISOString(),
    feeConfigs: [],
    defaultAmount: 21000,
    tieredAmountHistory: [
      { month: new Date().getMonth(), year: new Date().getFullYear(), rates: DEFAULT_RATES }
    ],
    maxCapacityPerShift: 10
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const remoteData = await db.getAppState();
        console.log('Remote data loaded from Supabase:', remoteData);
        
        // Check if we need to sync initial students to Supabase
        if (!remoteData.students || remoteData.students.length === 0) {
          console.log('No students found in Supabase, syncing initial data...');
          // Sync initial data
          await Promise.all(INITIAL_STUDENTS.map(student => db.upsertStudent(student)));
          // Re-load state after sync to ensure we have the remote IDs and structure
          const refreshedData = await db.getAppState();
          if (refreshedData.students && refreshedData.students.length > 0) {
            remoteData.students = refreshedData.students;
          } else {
            // Fallback if sync failed but we want to show data anyway
            remoteData.students = INITIAL_STUDENTS;
          }
        }

        setState(prev => {
          const newState = {
            ...prev,
            gymName: remoteData.gymName !== undefined ? remoteData.gymName : prev.gymName,
            gymLogo: remoteData.gymLogo !== undefined ? remoteData.gymLogo : prev.gymLogo,
            whatsappTemplateAgenda: remoteData.whatsappTemplateAgenda !== undefined ? remoteData.whatsappTemplateAgenda : prev.whatsappTemplateAgenda,
            whatsappTemplateDebt: remoteData.whatsappTemplateDebt !== undefined ? remoteData.whatsappTemplateDebt : prev.whatsappTemplateDebt,
            defaultAmount: remoteData.defaultAmount !== undefined ? remoteData.defaultAmount : prev.defaultAmount,
            maxCapacityPerShift: remoteData.maxCapacityPerShift !== undefined ? remoteData.maxCapacityPerShift : prev.maxCapacityPerShift,
            simulatedDate: remoteData.simulatedDate !== undefined ? remoteData.simulatedDate : prev.simulatedDate,
            tieredAmountHistory: remoteData.tieredAmountHistory !== undefined ? remoteData.tieredAmountHistory : prev.tieredAmountHistory,
            students: remoteData.students && remoteData.students.length > 0 ? remoteData.students : INITIAL_STUDENTS,
            fees: remoteData.fees || prev.fees,
            payments: remoteData.payments || prev.payments,
            expenses: remoteData.expenses || prev.expenses,
            guests: remoteData.guests || prev.guests,
            attendance: remoteData.attendance || prev.attendance
          };
          // Persist to localStorage immediately after loading from remote
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
          console.log('Final state after load:', newState);
          return newState;
        });
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setState(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Sync to localStorage as backup
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loading]);

  const navigateToStudent = useCallback((id: string) => {
    setFocusedStudentId(id);
    setCurrentView('students');
  }, []);

  const getRatesForPeriod = useCallback((month: number, year: number) => {
    const exact = state.tieredAmountHistory.find(h => h.month === month && h.year === year);
    if (exact) return exact.rates;
    const sorted = [...state.tieredAmountHistory].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    const closestPast = sorted.find(h => h.year < year || (h.year === year && h.month < month));
    if (closestPast) return closestPast.rates;
    return DEFAULT_RATES;
  }, [state.tieredAmountHistory]);

  useEffect(() => {
    if (loading) return;
    const simDate = new Date(state.simulatedDate);
    const month = simDate.getMonth();
    const year = simDate.getFullYear();
    const studentsMissingFee = state.students.filter(s => {
      if (s.status !== StudentStatus.ACTIVE) return false;
      const alreadyHasFee = state.fees.some(f => f.studentId === s.id && f.month === month && f.year === year);
      return !alreadyHasFee;
    });
    if (studentsMissingFee.length > 0) {
      const activeRates = getRatesForPeriod(month, year);
      const newFees: Fee[] = studentsMissingFee.map(s => {
        const sessionsCount = s.schedule.length;
        const tier = sessionsCount >= 5 ? 5 : (sessionsCount < 1 ? 1 : sessionsCount);
        const amount = activeRates[tier];
        const fee = {
          id: Math.random().toString(36).substr(2, 9),
          studentId: s.id,
          month: month,
          year: year,
          amountOwed: amount
        };
        db.upsertFee(fee);
        return fee;
      });
      setState(prev => ({ ...prev, fees: [...prev.fees, ...newFees] }));
    }
  }, [state.simulatedDate, state.students, getRatesForPeriod, state.fees, loading]);

  const setSimulatedDate = (date: string) => {
    setState(prev => ({ ...prev, simulatedDate: date }));
    db.updateSettings({ simulated_date: date });
  };

  const setDefaultAmount = (amount: number) => {
    setState(prev => ({ ...prev, defaultAmount: amount }));
    db.updateSettings({ default_amount: amount });
  };

  const setHistoricalTieredAmount = (month: number, year: number, rates: { [key: number]: number }) => {
    setState(prev => {
      const filtered = prev.tieredAmountHistory.filter(h => !(h.month === month && h.year === year));
      const newHistory = [...filtered, { month, year, rates }];
      db.updateSettings({ tiered_amount_history: newHistory });
      return { ...prev, tieredAmountHistory: newHistory };
    });
  };

  const deleteHistoricalTieredAmount = (month: number, year: number) => {
    setState(prev => {
      const newHistory = prev.tieredAmountHistory.filter(h => !(h.month === month && h.year === year));
      db.updateSettings({ tiered_amount_history: newHistory });
      return { ...prev, tieredAmountHistory: newHistory };
    });
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      const newState = { ...prev, payments: [...prev.payments, newPayment] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.upsertPayment(newPayment);
  };

  const deletePayment = (paymentId: string) => {
    setState(prev => {
      const newState = { ...prev, payments: prev.payments.filter(p => p.id !== paymentId) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.deletePayment(paymentId);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      const newState = { ...prev, expenses: [...prev.expenses, newExpense] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.upsertExpense(newExpense);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState(prev => {
      const newState = {
        ...prev,
        expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.updateExpense(id, updates);
  };

  const deleteExpense = (id: string) => {
    setState(prev => {
      const newState = { ...prev, expenses: prev.expenses.filter(e => e.id !== id) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.deleteExpense(id);
  };

  const addGuest = (guest: Omit<GuestRegistration, 'id'>) => {
    const newGuest = { ...guest, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => {
      const newState = { ...prev, guests: [...prev.guests, newGuest] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.upsertGuest(newGuest);
  };

  const deleteGuest = (id: string) => {
    setState(prev => {
      const newState = { ...prev, guests: prev.guests.filter(g => g.id !== id) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.deleteGuest(id);
  };

  const addEvaluation = (studentId: string, evaluation: Omit<BodyEvaluation, 'id'>) => {
    setState(prev => {
      const newStudents = prev.students.map(s => {
        if (s.id === studentId) {
          const updated = { ...s, evaluations: [...s.evaluations, { ...evaluation, id: Math.random().toString(36).substr(2, 9) }] };
          db.upsertStudent(updated);
          return updated;
        }
        return s;
      });
      const newState = { ...prev, students: newStudents };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const setFeeConfig = (config: FeeConfig) => {
    // Note: feeConfigs not explicitly mapped to a separate table yet, keeping in local state/storage for now or could be added to settings
    setState(prev => {
      const filtered = prev.feeConfigs.filter(c => !(c.month === config.month && c.year === config.year));
      return { ...prev, feeConfigs: [...filtered, config] };
    });
  };

  const registerBulkFees = (month: number, year: number) => {
    const activeRates = getRatesForPeriod(month, year);
    setState(prev => {
      const activeStudentsWithoutFee = prev.students.filter(s => {
        if (s.status !== StudentStatus.ACTIVE) return false;
        const alreadyHasFee = prev.fees.some(f => f.studentId === s.id && f.month === month && f.year === year);
        return !alreadyHasFee;
      });
      if (activeStudentsWithoutFee.length === 0) return prev;
      const newFees: Fee[] = activeStudentsWithoutFee.map(s => {
        const sessionsCount = s.schedule.length;
        const tier = sessionsCount >= 5 ? 5 : (sessionsCount < 1 ? 1 : sessionsCount);
        const amount = activeRates[tier];
        const fee = {
          id: Math.random().toString(36).substr(2, 9),
          studentId: s.id,
          month: month,
          year: year,
          amountOwed: amount
        };
        // Persist fee to DB immediately
        db.upsertFee(fee);
        return fee;
      });
      const newState = { ...prev, fees: [...prev.fees, ...newFees] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const toggleAttendance = (studentId: string, date: string, time: string) => {
    setState(prev => {
      const exists = prev.attendance.find(a => a.studentId === studentId && a.date === date && a.time === time);
      let newState;
      if (exists) {
        db.deleteAttendance(studentId, date, time);
        newState = { ...prev, attendance: prev.attendance.filter(a => !(a.studentId === studentId && a.date === date && a.time === time)) };
      } else {
        const record = { studentId, date, time, present: true };
        db.upsertAttendance(record);
        newState = { ...prev, attendance: [...prev.attendance, record] };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const getStudentDebt = useCallback((studentId: string) => {
    const studentFees = state.fees.filter(f => f.studentId === studentId);
    return studentFees.map(fee => {
      const paid = state.payments
        .filter(p => p.studentId === studentId && p.month === fee.month && p.year === fee.year)
        .reduce((acc, p) => acc + p.amount, 0);
      return { month: fee.month, year: fee.year, owed: fee.amountOwed, paid: paid };
    }).filter(d => d.paid < d.owed);
  }, [state.fees, state.payments]);

  const getStudentStatus = useCallback((studentId: string): PaymentStatus => {
    const debtList = getStudentDebt(studentId);
    if (debtList.length === 0) return PaymentStatus.PAID;
    const simDate = new Date(state.simulatedDate);
    const currentMonth = simDate.getMonth();
    const currentYear = simDate.getFullYear();
    const currentDay = simDate.getDate();
    const hasPastDebt = debtList.some(d => d.year < currentYear || (d.year === currentYear && d.month < currentMonth));
    if (hasPastDebt) return PaymentStatus.DELINQUENT;
    const currentMonthDebt = debtList.find(d => d.month === currentMonth && d.year === currentYear);
    if (currentMonthDebt) {
      if (currentMonthDebt.paid > 0) return PaymentStatus.DELINQUENT;
      return currentDay <= 10 ? PaymentStatus.PENDING : PaymentStatus.DELINQUENT;
    }
    return PaymentStatus.PAID;
  }, [getStudentDebt, state.simulatedDate]);

  const getTotalDelinquentDebt = useCallback(() => {
    return state.students
      .filter(s => s.status === StudentStatus.ACTIVE && getStudentStatus(s.id) === PaymentStatus.DELINQUENT)
      .reduce((acc, s) => {
        const debtList = getStudentDebt(s.id);
        const studentTotalDebt = debtList.reduce((sum, d) => sum + (d.owed - d.paid), 0);
        return acc + studentTotalDebt;
      }, 0);
  }, [state.students, getStudentStatus, getStudentDebt]);

  const resetData = () => {
    const now = new Date();
    const newState = {
      gymName: 'GymPro',
      gymLogo: null,
      whatsappTemplateAgenda: 'Hola {studentName}, confirmamos tu turno de las {time} para hoy en {gymName}. ¡Te esperamos!',
      whatsappTemplateDebt: 'Hola {studentName}, te contactamos de {gymName} para recordarte que tenés una cuota pendiente. ¡Gracias!',
      students: INITIAL_STUDENTS,
      fees: [],
      payments: [],
      expenses: [],
      guests: [],
      attendance: [],
      simulatedDate: now.toISOString(),
      feeConfigs: [],
      defaultAmount: 21000,
      tieredAmountHistory: [{ month: now.getMonth(), year: now.getFullYear(), rates: DEFAULT_RATES }],
      maxCapacityPerShift: 10
    };
    setState(newState);
    // Note: Bulk delete not implemented in db helper yet, but this is a destructive action
  };

  const updateStudent = (student: Student) => {
    setState(prev => {
      const newState = {
        ...prev,
        students: prev.students.map(s => s.id === student.id ? student : s)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.upsertStudent(student);
  };

  const moveStudentSchedule = (studentId: string, oldDay: DayOfWeek, oldStartTime: string, newDay: DayOfWeek, newStartTime: string) => {
    let success = false;
    setState(prev => {
      const student = prev.students.find(s => s.id === studentId);
      if (!student) return prev;

      const countInTarget = prev.students.filter(s => 
        s.status === StudentStatus.ACTIVE && 
        s.schedule.some(slot => slot.day === newDay && slot.startTime === newStartTime)
      ).length;

      if (countInTarget >= prev.maxCapacityPerShift) return prev;

      const newSchedule = student.schedule.map(slot => {
        if (slot.day === oldDay && slot.startTime === oldStartTime) {
          return { ...slot, day: newDay, startTime: newStartTime, endTime: `${(parseInt(newStartTime.split(':')[0]) + 1).toString().padStart(2, '0')}:00` };
        }
        return slot;
      });

      success = true;
      const updatedStudent = { ...student, schedule: newSchedule };
      db.upsertStudent(updatedStudent);
      const newState = {
        ...prev,
        students: prev.students.map(s => s.id === studentId ? updatedStudent : s)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    return success;
  };

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: Math.random().toString(36).substr(2, 9), status: StudentStatus.ACTIVE, evaluations: [], notes: student.notes || '' };
    setState(prev => {
      const newState = { ...prev, students: [...prev.students, newStudent] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.upsertStudent(newStudent);
  };

  const updateGymInfo = (name: string, logo: string | null) => {
    setState(prev => {
      const newState = { ...prev, gymName: name, gymLogo: logo };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    // Ensure we are sending the correct snake_case keys to the db
    db.updateSettings({ gym_name: name, gym_logo: logo }).then(res => {
      console.log('Update settings result:', res);
      if (res?.error) {
        console.error('Error updating settings in DB:', res.error);
      }
    });
  };

  const updateWhatsappTemplates = (agenda: string, debt: string) => {
    setState(prev => {
      const newState = { ...prev, whatsappTemplateAgenda: agenda, whatsappTemplateDebt: debt };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.updateSettings({ whatsapp_template_agenda: agenda, whatsapp_template_debt: debt }).then(res => {
      console.log('Update whatsapp templates result:', res);
    });
  };

  const updateMaxCapacity = (capacity: number) => {
    setState(prev => {
      const newState = { ...prev, maxCapacityPerShift: capacity };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
    db.updateSettings({ max_capacity_per_shift: capacity }).then(res => {
      console.log('Update max capacity result:', res);
    });
  };

  return (
    <AppContext.Provider value={{ 
      ...state, currentView, focusedStudentId, loading, setCurrentView, setFocusedStudentId, navigateToStudent,
      setSimulatedDate, addPayment, deletePayment, registerBulkFees, setFeeConfig, setDefaultAmount,
      setHistoricalTieredAmount, deleteHistoricalTieredAmount, getRatesForPeriod, toggleAttendance, getStudentStatus, getStudentDebt,
      getTotalDelinquentDebt, resetData, updateStudent, addStudent, moveStudentSchedule, addExpense, updateExpense, deleteExpense,
      addGuest, deleteGuest, addEvaluation, updateGymInfo, updateWhatsappTemplates, updateMaxCapacity
    }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Cargando aplicación...</p>
          </div>
        </div>
      ) : children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
