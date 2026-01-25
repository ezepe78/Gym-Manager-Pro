import { Student, Payment, Fee, Expense, GuestRegistration, Attendance, AppState } from '../types';

export const db = {
  async getAppState(): Promise<Partial<AppState>> {
    return {};
  },

  async updateSettings(updates: any) {
    return { data: null, error: null };
  },

  async upsertStudent(student: Student) {
    return { data: null, error: null };
  },

  async deleteStudent(id: string) {
    return { data: null, error: null };
  },

  async upsertFee(fee: Fee) {
    return { data: null, error: null };
  },

  async upsertPayment(payment: Payment) {
    return { data: null, error: null };
  },

  async deletePayment(id: string) {
    return { data: null, error: null };
  },

  async upsertExpense(expense: Expense) {
    return { data: null, error: null };
  },

  async updateExpense(id: string, updates: Partial<Expense>) {
    return { data: null, error: null };
  },

  async deleteExpense(id: string) {
    return { data: null, error: null };
  },

  async upsertGuest(guest: GuestRegistration) {
    return { data: null, error: null };
  },

  async deleteGuest(id: string) {
    return { data: null, error: null };
  },

  async upsertAttendance(record: Attendance) {
    return { data: null, error: null };
  },

  async deleteAttendance(studentId: string, date: string, time: string) {
    return { data: null, error: null };
  }
};
