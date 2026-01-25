import { supabase } from './supabase';
import { Student, Payment, Fee, Expense, GuestRegistration, Attendance, AppState } from '../types';

export const db = {
  async getAppState(): Promise<Partial<AppState>> {
    if (!supabase) return {};
    try {
      const { data: settings, error: settingsError } = await supabase.from('settings').select('*').eq('id', 'default').maybeSingle();
      if (settingsError) console.error('Settings fetch error:', settingsError);
      
      const { data: students } = await supabase.from('students').select('*');
      const { data: fees, error: feesError } = await supabase.from('fees').select('*');
      if (feesError) console.error('Fees fetch error:', feesError);
      
      const { data: payments, error: paymentsError } = await supabase.from('payments').select('*');
      if (paymentsError) console.error('Payments fetch error:', paymentsError);

      const { data: expenses } = await supabase.from('expenses').select('*');
      const { data: guests } = await supabase.from('guests').select('*');
      const { data: attendance } = await supabase.from('attendance').select('*');

      const mappedFees: Fee[] = (fees || []).map(f => ({
        id: f.id,
        studentId: f.student_id,
        month: f.month,
        year: f.year,
        amountOwed: f.amount_owed
      }));

      const mappedPayments: Payment[] = (payments || []).map(p => ({
        id: p.id,
        studentId: p.student_id,
        month: p.month,
        year: p.year,
        amount: p.amount,
        date: p.date,
        method: p.method,
        notes: p.notes
      }));

      const mappedExpenses: Expense[] = (expenses || []).map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        date: e.date,
        category: e.category,
        paymentMethod: e.payment_method
      }));

      const mappedGuests: GuestRegistration[] = (guests || []).map(g => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        date: g.date,
        time: g.time,
        paymentMethod: g.payment_method,
        amount: g.amount
      }));

      const mappedAttendance: Attendance[] = (attendance || []).map(a => ({
        studentId: a.student_id,
        date: a.date,
        time: a.time,
        present: a.present
      }));

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
        fees: mappedFees,
        payments: mappedPayments,
        expenses: mappedExpenses,
        guests: mappedGuests,
        attendance: mappedAttendance
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
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 'default', ...dbUpdates }, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Upsert error:', error);
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
    console.log('Upserting student to Supabase:', student);
    // Explicitly map properties to ensure they match table columns if needed
    // However, if the object already matches, we can just pass it
    const dbStudent = {
      id: student.id,
      name: student.name,
      phone: student.phone,
      status: student.status,
      notes: student.notes,
      evaluations: student.evaluations,
      schedule: student.schedule
    };
    const { data, error } = await supabase.from('students').upsert(dbStudent, { onConflict: 'id' }).select();
    if (error) console.error('Error upserting student:', error);
    return { data, error };
  },

  async deleteStudent(id: string) {
    if (!supabase) return;
    return supabase.from('students').delete().eq('id', id);
  },

  async upsertFee(fee: Fee) {
    if (!supabase) return;
    const dbFee = {
      id: fee.id,
      student_id: fee.studentId,
      month: fee.month,
      year: fee.year,
      amount_owed: fee.amountOwed
    };
    console.log('Upserting fee to Supabase:', dbFee);
    return supabase.from('fees').upsert(dbFee, { onConflict: 'id' });
  },

  async upsertPayment(payment: Payment) {
    if (!supabase) return;
    const dbPayment = {
      id: payment.id,
      student_id: payment.studentId,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      notes: payment.notes
    };
    return supabase.from('payments').upsert(dbPayment, { onConflict: 'id' });
  },

  async deletePayment(id: string) {
    if (!supabase) return;
    return supabase.from('payments').delete().eq('id', id);
  },

  async upsertExpense(expense: Expense) {
    if (!supabase) return;
    const dbExpense = {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      payment_method: expense.paymentMethod
    };
    return supabase.from('expenses').upsert(dbExpense, { onConflict: 'id' });
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
    const dbGuest = {
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      date: guest.date,
      time: guest.time,
      payment_method: guest.paymentMethod,
      amount: guest.amount
    };
    return supabase.from('guests').upsert(dbGuest, { onConflict: 'id' });
  },

  async deleteGuest(id: string) {
    if (!supabase) return;
    return supabase.from('guests').delete().eq('id', id);
  },

  async upsertAttendance(record: Attendance) {
    if (!supabase) return;
    const dbAttendance = {
      student_id: record.studentId,
      date: record.date,
      time: record.time,
      present: record.present
    };
    return supabase.from('attendance').upsert(dbAttendance, { onConflict: 'student_id,date,time' });
  },

  async deleteAttendance(studentId: string, date: string, time: string) {
    if (!supabase) return;
    return supabase.from('attendance').delete()
      .eq('student_id', studentId)
      .eq('date', date)
      .eq('time', time);
  }
};
