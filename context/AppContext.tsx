
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Student, Payment, Attendance, PaymentStatus, StudentStatus, Fee, FeeConfig, Expense, GuestRegistration, BodyEvaluation, TieredRateHistory, DayOfWeek } from '../types';
import { INITIAL_STUDENTS } from '../constants';

interface AppContextType extends AppState {
  currentView: string;
  focusedStudentId: string | null;
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
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
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
    };
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
        return {
          id: Math.random().toString(36).substr(2, 9),
          studentId: s.id,
          month: month,
          year: year,
          amountOwed: amount
        };
      });
      setState(prev => ({ ...prev, fees: [...prev.fees, ...newFees] }));
    }
  }, [state.simulatedDate, state.students, getRatesForPeriod, state.fees]);

  const setSimulatedDate = (date: string) => {
    setState(prev => ({ ...prev, simulatedDate: date }));
  };

  const setDefaultAmount = (amount: number) => {
    setState(prev => ({ ...prev, defaultAmount: amount }));
  };

  const setHistoricalTieredAmount = (month: number, year: number, rates: { [key: number]: number }) => {
    setState(prev => {
      const filtered = prev.tieredAmountHistory.filter(h => !(h.month === month && h.year === year));
      return { ...prev, tieredAmountHistory: [...filtered, { month, year, rates }] };
    });
  };

  const deleteHistoricalTieredAmount = (month: number, year: number) => {
    setState(prev => ({
      ...prev,
      tieredAmountHistory: prev.tieredAmountHistory.filter(h => !(h.month === month && h.year === year))
    }));
  };

  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment = { ...payment, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
  };

  const deletePayment = (paymentId: string) => {
    setState(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== paymentId) }));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const addGuest = (guest: Omit<GuestRegistration, 'id'>) => {
    const newGuest = { ...guest, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, guests: [...prev.guests, newGuest] }));
  };

  const deleteGuest = (id: string) => {
    setState(prev => ({ ...prev, guests: prev.guests.filter(g => g.id !== id) }));
  };

  const addEvaluation = (studentId: string, evaluation: Omit<BodyEvaluation, 'id'>) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id === studentId) {
          return { ...s, evaluations: [...s.evaluations, { ...evaluation, id: Math.random().toString(36).substr(2, 9) }] };
        }
        return s;
      })
    }));
  };

  const setFeeConfig = (config: FeeConfig) => {
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
        return {
          id: Math.random().toString(36).substr(2, 9),
          studentId: s.id,
          month: month,
          year: year,
          amountOwed: amount
        };
      });
      return { ...prev, fees: [...prev.fees, ...newFees] };
    });
  };

  const toggleAttendance = (studentId: string, date: string, time: string) => {
    setState(prev => {
      const exists = prev.attendance.find(a => a.studentId === studentId && a.date === date && a.time === time);
      if (exists) {
        return { ...prev, attendance: prev.attendance.filter(a => !(a.studentId === studentId && a.date === date && a.time === time)) };
      }
      return { ...prev, attendance: [...prev.attendance, { studentId, date, time, present: true }] };
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
    setState({
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
    });
  };

  const updateStudent = (student: Student) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === student.id ? student : s)
    }));
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
      return {
        ...prev,
        students: prev.students.map(s => s.id === studentId ? { ...s, schedule: newSchedule } : s)
      };
    });
    return success;
  };

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: Math.random().toString(36).substr(2, 9), status: StudentStatus.ACTIVE, evaluations: [], notes: student.notes || '' };
    setState(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  const updateGymInfo = (name: string, logo: string | null) => {
    setState(prev => ({ ...prev, gymName: name, gymLogo: logo }));
  };

  const updateWhatsappTemplates = (agenda: string, debt: string) => {
    setState(prev => ({ ...prev, whatsappTemplateAgenda: agenda, whatsappTemplateDebt: debt }));
  };

  const updateMaxCapacity = (capacity: number) => {
    setState(prev => ({ ...prev, maxCapacityPerShift: capacity }));
  };

  return (
    <AppContext.Provider value={{ 
      ...state, currentView, focusedStudentId, setCurrentView, setFocusedStudentId, navigateToStudent,
      setSimulatedDate, addPayment, deletePayment, registerBulkFees, setFeeConfig, setDefaultAmount,
      setHistoricalTieredAmount, deleteHistoricalTieredAmount, getRatesForPeriod, toggleAttendance, getStudentStatus, getStudentDebt,
      getTotalDelinquentDebt, resetData, updateStudent, addStudent, moveStudentSchedule, addExpense, deleteExpense,
      addGuest, deleteGuest, addEvaluation, updateGymInfo, updateWhatsappTemplates, updateMaxCapacity
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
