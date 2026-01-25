import { supabase } from './supabase';
import { Student, Payment, Fee, Expense, GuestRegistration, Attendance, AppState } from '../types';

export const db = {
  async getAppState(): Promise<Partial<AppState>> {
    if (!supabase) return {};
    try {
      const { data: settings, error: settingsError } = await supabase.from('settings').select('*').eq('id', 'default').maybeSingle();
      if (settingsError) console.error('Settings fetch error:', settingsError);
      
      const { data: students } = await supabase.from('students').select('*');
      const { data: fees } = await supabase.from('fees').select('*');
      const { data: payments } = await supabase.from('payments').select('*');
      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: guests } = await supabase.from('guests').select('*');
      const { data: attendance } = await supabase.from('attendance').select('*');

      return {
        gymName: settings?.gym_name || undefined,
        gymLogo: settings?.gym_logo || undefined,
        whatsappTemplateAgenda: settings?.whatsapp_template_agenda || undefined,
        whatsappTemplateDebt: settings?.whatsapp_template_debt || undefined,
        defaultAmount: settings?.default_amount || undefined,
        maxCapacityPerShift: settings?.max_capacity_per_shift || undefined,
        simulatedDate: settings?.simulated_date || undefined,
        tieredAmountHistory: settings?.tiered_amount_history || undefined,
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
    
    console.log('Upserting settings with:', dbUpdates);
    // Explicitly target 'id' for conflict resolution and use upsert correctly
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 'default', ...dbUpdates }, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Upsert error:', error);
      // Fallback to direct update if upsert fails for any reason
      const { data: updateData, error: updateError } = await supabase
        .from('settings')
        .update(dbUpdates)
        .eq('id', 'default')
        .select();
      return { data: updateData, error: updateError };
    }
    return { data, error };
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
