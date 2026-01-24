import { supabase } from './supabase';
import { Student, Payment, Fee, Expense, GuestRegistration, Attendance, AppState } from '../types';

export const db = {
  async getAppState(): Promise<Partial<AppState>> {
    if (!supabase) return {};
    try {
      const { data: settings } = await supabase.from('settings').select('*').eq('id', 'default').single();
      const { data: students } = await supabase.from('students').select('*');
      const { data: fees } = await supabase.from('fees').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: guests } = await supabase.from('guests').select('*');
      const { data: attendance } = await supabase.from('attendance').select('*');

      return {
        gymName: settings?.gym_name,
        gymLogo: settings?.gym_logo,
        whatsappTemplateAgenda: settings?.whatsapp_template_agenda,
        whatsappTemplateDebt: settings?.whatsapp_template_debt,
        defaultAmount: settings?.default_amount,
        maxCapacityPerShift: settings?.max_capacity_per_shift,
        simulatedDate: settings?.simulated_date,
        tieredAmountHistory: settings?.tiered_amount_history,
        students: students || [],
        fees: fees || [],
        payments: payments || [],
        expenses: expenses || [],
        guests: guests || [],
        attendance: attendance || []
      };
    } catch (e) {
      console.error('DB fetch error:', e);
      return {};
    }
  },

  async updateSettings(updates: any) {
    if (!supabase) return;
    return supabase.from('settings').update(updates).eq('id', 'default');
  },

  async upsertStudent(student: Student) {
    if (!supabase) return;
    return supabase.from('students').upsert(student);
  },

  async deleteStudent(id: string) {
    if (!supabase) return;
    return supabase.from('students').delete().eq('id', id);
  },

  async upsertFee(fee: Fee) {
    if (!supabase) return;
    return supabase.from('fees').upsert(fee);
  },

  async upsertPayment(payment: Payment) {
    if (!supabase) return;
    return supabase.from('payments').upsert(payment);
  },

  async deletePayment(id: string) {
    if (!supabase) return;
    return supabase.from('payments').delete().eq('id', id);
  },

  async upsertExpense(expense: Expense) {
    if (!supabase) return;
    return supabase.from('expenses').upsert(expense);
  },

  async deleteExpense(id: string) {
    if (!supabase) return;
    return supabase.from('expenses').delete().eq('id', id);
  },

  async upsertGuest(guest: GuestRegistration) {
    if (!supabase) return;
    return supabase.from('guests').upsert(guest);
  },

  async deleteGuest(id: string) {
    if (!supabase) return;
    return supabase.from('guests').delete().eq('id', id);
  },

  async upsertAttendance(record: Attendance) {
    if (!supabase) return;
    return supabase.from('attendance').insert(record);
  },

  async deleteAttendance(studentId: string, date: string, time: string) {
    if (!supabase) return;
    return supabase.from('attendance').delete()
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('time', time);
  }
};
