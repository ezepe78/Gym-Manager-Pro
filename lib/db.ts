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
    const dbUpdates: any = {};
    if (updates.gym_name !== undefined) dbUpdates.gym_name = updates.gym_name;
    if (updates.gym_logo !== undefined) dbUpdates.gym_logo = updates.gym_logo;
    if (updates.whatsapp_template_agenda !== undefined) dbUpdates.whatsapp_template_agenda = updates.whatsapp_template_agenda;
    if (updates.whatsapp_template_debt !== undefined) dbUpdates.whatsapp_template_debt = updates.whatsapp_template_debt;
    if (updates.default_amount !== undefined) dbUpdates.default_amount = updates.default_amount;
    if (updates.max_capacity_per_shift !== undefined) dbUpdates.max_capacity_per_shift = updates.max_capacity_per_shift;
    if (updates.simulated_date !== undefined) dbUpdates.simulated_date = updates.simulated_date;
    if (updates.tiered_amount_history !== undefined) dbUpdates.tiered_amount_history = updates.tiered_amount_history;
    
    return supabase.from('settings').upsert({ id: 'default', ...dbUpdates });
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

  async updateExpense(id: string, updates: Partial<Expense>) {
    if (!supabase) return;
    return supabase.from('expenses').update(updates).eq('id', id);
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
