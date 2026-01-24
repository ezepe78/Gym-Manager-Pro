
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, Student, StudentStatus, BodyEvaluation, ScheduleSlot, DayOfWeek } from '../types';
import { MONTH_NAMES, DAYS_SHORT } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Search, Plus, Mail, Phone, 
  DollarSign, CheckCircle, 
  X, Calendar, AlertTriangle, 
  MapPin, TrendingUp, Activity, 
  CreditCard, Edit3, ChevronRight, Save, Users, Clock, ArrowRight, History, Calculator, Home, StickyNote
} from 'lucide-react';

export const Students: React.FC = () => {
  const { 
    students, getStudentStatus, 
    addPayment, simulatedDate, 
    updateStudent, addStudent, 
    getStudentDebt, addEvaluation, attendance,
    fees, payments, focusedStudentId, setFocusedStudentId,
    maxCapacityPerShift
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentStatus>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(focusedStudentId);
  const [activeTab, setActiveTab] = useState<'profile' | 'evaluations' | 'fees'>('profile');
  
  useEffect(() => {
    if (focusedStudentId) {
      setSelectedStudentId(focusedStudentId);
      setFocusedStudentId(null);
    }
  }, [focusedStudentId]);

  const [showAddEval, setShowAddEval] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [newEval, setNewEval] = useState<Omit<BodyEvaluation, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    weight: 70,
    measurements: { chest: 0, waist: 0, hips: 0, arms: 0 }
  });

  const initialFormState: Omit<Student, 'id' | 'status' | 'evaluations' | 'joinDate'> = {
    name: '',
    email: '',
    phone: '',
    schedule: [],
    birthDate: '1990-01-01',
    address: { street: '', number: '', locality: 'Del Carril' },
    notes: ''
  };

  const [studentForm, setStudentForm] = useState(initialFormState);
  const [newSlot, setNewSlot] = useState<Omit<ScheduleSlot, 'id'>>({ day: 'Lun', startTime: '08:00', endTime: '09:00' });
  
  const [localNotes, setLocalNotes] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    amountToPay: 0,
    currentBalance: 0,
    month: new Date(simulatedDate).getMonth(),
    year: new Date(simulatedDate).getFullYear()
  });

  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'success' | 'error' }>({ 
    message: '', visible: false, type: 'success'
  });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (selectedStudent) {
      setLocalNotes(selectedStudent.notes || '');
    }
  }, [selectedStudent]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date(simulatedDate);
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleOpenEdit = () => {
    if (selectedStudent) {
      setStudentForm({
        name: selectedStudent.name,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        schedule: [...selectedStudent.schedule],
        birthDate: selectedStudent.birthDate,
        address: { ...selectedStudent.address },
        notes: selectedStudent.notes || ''
      });
      setShowEditModal(true);
    }
  };

  const addSlotToForm = () => {
    // Validar capacidad del turno
    const currentCount = students.filter(s => 
      s.status === StudentStatus.ACTIVE && 
      s.id !== selectedStudentId && // No contar al alumno actual si estamos editando
      s.schedule.some(slot => slot.day === newSlot.day && slot.startTime === newSlot.startTime)
    ).length;

    // También contar si ya agregó este mismo turno en el formulario local
    const alreadyInForm = studentForm.schedule.some(s => s.day === newSlot.day && s.startTime === newSlot.startTime);

    if (currentCount >= maxCapacityPerShift) {
      triggerToast(`El turno ${newSlot.day} ${newSlot.startTime} está completo (${maxCapacityPerShift}/${maxCapacityPerShift}).`, 'error');
      return;
    }

    if (alreadyInForm) {
      triggerToast("Este turno ya fue agregado al cronograma.", 'error');
      return;
    }

    setStudentForm(prev => ({
      ...prev,
      schedule: [...prev.schedule, { ...newSlot, id: Math.random().toString(36).substr(2, 9) }]
    }));
  };

  const removeSlotFromForm = (id: string) => {
    setStudentForm(prev => ({
      ...prev,
      schedule: prev.schedule.filter(s => s.id !== id)
    }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    addStudent({
        ...studentForm,
        joinDate: new Date().toISOString().split('T')[0]
    } as any);
    setShowAddModal(false);
    setStudentForm(initialFormState);
    triggerToast("Alumno registrado exitosamente.");
  };

  const handleEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
        updateStudent({ 
          ...selectedStudent, 
          ...studentForm 
        } as Student);
        setShowEditModal(false);
        triggerToast("Perfil actualizado.");
    }
  };

  const handleSaveQuickNotes = () => {
    if (selectedStudent) {
      updateStudent({
        ...selectedStudent,
        notes: localNotes
      });
      triggerToast("Notas actualizadas.");
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || paymentForm.amountToPay <= 0) return;
    
    addPayment({
        studentId: selectedStudentId,
        month: paymentForm.month,
        year: paymentForm.year,
        amount: paymentForm.amountToPay,
        date: new Date().toISOString().split('T')[0]
    });
    
    setShowPaymentModal(false);
    const remains = paymentForm.currentBalance - paymentForm.amountToPay;
    if (remains > 0) {
      triggerToast(`Pago parcial de $${paymentForm.amountToPay} registrado. Saldo restante: $${remains}`);
    } else {
      triggerToast(`¡Pago de $${paymentForm.amountToPay} registrado con éxito!`);
    }
  };

  const openPaymentForPeriod = (month: number, year: number, balance: number) => {
    setPaymentForm({
      amountToPay: balance,
      currentBalance: balance,
      month,
      year
    });
    setShowPaymentModal(true);
  };

  const handleAddEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    addEvaluation(selectedStudentId, newEval);
    setShowAddEval(false);
    triggerToast("Evaluación física guardada.");
  };

  const chartData = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedStudent.evaluations
      .map(e => ({ date: e.date, weight: e.weight }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedStudent]);

  const studentAttendance = useMemo(() => {
    if (!selectedStudentId) return [];
    return attendance
        .filter(a => a.studentId === selectedStudentId && a.present)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedStudentId, attendance]);

  const studentFeeHistory = useMemo(() => {
    if (!selectedStudentId) return [];
    return fees
      .filter(f => f.studentId === selectedStudentId)
      .map(fee => {
        const paid = payments
          .filter(p => p.studentId === selectedStudentId && p.month === fee.month && p.year === fee.year)
          .reduce((acc, p) => acc + p.amount, 0);
        return { ...fee, paid, balance: fee.amountOwed - paid };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [selectedStudentId, fees, payments]);

  const debtTotal = useMemo(() => {
    return studentFeeHistory.reduce((acc, f) => acc + (f.balance > 0 ? f.balance : 0), 0);
  }, [studentFeeHistory]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  return (
    <div className="space-y-8 h-full relative pb-24">
      {toast.visible && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4">
           <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${toast.type === 'error' ? 'bg-rose-900 border-rose-700 text-white' : 'bg-slate-900 border-slate-700 text-white'}`}>
              <CheckCircle size={20} className={toast.type === 'error' ? 'text-rose-400' : 'text-emerald-400'} />
              <p className="text-sm font-bold">{toast.message}</p>
           </div>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl overflow-auto max-h-[90vh] scrollbar-hide">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-3xl font-black">{showAddModal ? 'Nuevo Alumno' : 'Editar Alumno'}</h3>
                 <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
              </div>
              
              <form onSubmit={showAddModal ? handleAddStudent : handleEditStudent} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Nombre Completo</label>
                        <input required value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Estado</label>
                        <select 
                            value={showEditModal && selectedStudent ? selectedStudent.status : StudentStatus.ACTIVE} 
                            onChange={e => {
                                if (showEditModal && selectedStudent) {
                                    updateStudent({ ...selectedStudent, status: e.target.value as StudentStatus });
                                    triggerToast(`Estado cambiado a ${e.target.value === StudentStatus.ACTIVE ? 'Activo' : 'Inactivo'}`);
                                }
                            }}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                        >
                            <option value={StudentStatus.ACTIVE}>Activo</option>
                            <option value={StudentStatus.INACTIVE}>Inactivo</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Email</label>
                        <input type="email" required value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Teléfono</label>
                        <input required value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Fecha Nacimiento</label>
                        <input type="date" value={studentForm.birthDate} onChange={e => setStudentForm({...studentForm, birthDate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Home size={18} className="text-emerald-500"/>
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Domicilio</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="md:col-span-1 space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Calle</label>
                          <input required value={studentForm.address.street} onChange={e => setStudentForm({...studentForm, address: {...studentForm.address, street: e.target.value}})} placeholder="Ej: Av. Mitre" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Número</label>
                          <input required value={studentForm.address.number} onChange={e => setStudentForm({...studentForm, address: {...studentForm.address, number: e.target.value}})} placeholder="123" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Localidad</label>
                          <input required value={studentForm.address.locality} onChange={e => setStudentForm({...studentForm, address: {...studentForm.address, locality: e.target.value}})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none" />
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Calendar size={18} className="text-blue-500"/>
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-600">Cronograma de Entrenamiento</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Día</label>
                          <select value={newSlot.day} onChange={e => setNewSlot({...newSlot, day: e.target.value as DayOfWeek})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                             {DAYS_SHORT.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Desde</label>
                          <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Hasta</label>
                          <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" />
                       </div>
                       <button type="button" onClick={addSlotToForm} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center font-bold gap-2">
                          <Plus size={18}/> <span>Añadir</span>
                       </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                       {studentForm.schedule.map(slot => (
                          <div key={slot.id} className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
                             <span className="text-xs font-black text-slate-700">{slot.day} {slot.startTime}-{slot.endTime}</span>
                             <button type="button" onClick={() => removeSlotFromForm(slot.id)} className="text-rose-400 hover:text-rose-600"><X size={14}/></button>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Notas Adicionales / Comentarios del Entrenador</label>
                    <textarea 
                      value={studentForm.notes} 
                      onChange={e => setStudentForm({...studentForm, notes: e.target.value})} 
                      placeholder="Lesiones previas, objetivos específicos, etc."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 resize-none" 
                    />
                 </div>

                 <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                   <Save size={20}/> {showAddModal ? 'Crear Nuevo Alumno' : 'Guardar Cambios de Perfil'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] p-8 max-md w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-2xl font-black">Registrar Cobro</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{MONTH_NAMES[paymentForm.month]} {paymentForm.year}</p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
              </div>
              <form onSubmit={handleAddPayment} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                       <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Deuda Pendiente</span>
                       <span className="text-xl font-black text-slate-700">${paymentForm.currentBalance}</span>
                    </div>
                    <div className={`p-4 rounded-2xl border ${paymentForm.currentBalance - paymentForm.amountToPay > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                       <span className={`text-[10px] font-black uppercase block mb-1 ${paymentForm.currentBalance - paymentForm.amountToPay > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>Nuevo Saldo</span>
                       <span className={`text-xl font-black ${paymentForm.currentBalance - paymentForm.amountToPay > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ${Math.max(0, paymentForm.currentBalance - paymentForm.amountToPay)}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                       <Calculator size={12}/> Importe a Cobrar ($)
                    </label>
                    <input 
                      type="number" 
                      required 
                      autoFocus
                      value={paymentForm.amountToPay} 
                      onChange={e => setPaymentForm({...paymentForm, amountToPay: Number(e.target.value)})} 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none text-3xl font-black text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                    />
                 </div>

                 <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                   <CreditCard size={20}/>
                   Confirmar Registro de Cobro
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Alumnos</h1>
          <p className="text-slate-500">Membresías, cronogramas y saldos corrientes.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center space-x-2 shadow-xl shadow-blue-200 transition-transform active:scale-95">
          <Plus size={22} />
          <span className="font-bold">Nuevo Alumno</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-5">
            <div className="flex p-1 bg-white rounded-2xl border border-slate-200 gap-1">
              <button onClick={() => setStatusFilter('ALL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
              <button onClick={() => setStatusFilter(StudentStatus.ACTIVE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === StudentStatus.ACTIVE ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Activos</button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-slate-50 scrollbar-hide">
            {filteredStudents.map(s => {
              const studentDebt = getStudentDebt(s.id).reduce((sum, d) => sum + (d.owed - d.paid), 0);
              const isDebtor = studentDebt > 0;

              return (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStudentId(s.id)} 
                  className={`w-full text-left p-6 flex items-center space-x-4 transition-all ${selectedStudentId === s.id ? 'bg-blue-50' : 'hover:bg-slate-50/80'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${selectedStudentId === s.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{s.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{s.schedule.length} sesiones/semana</p>
                  </div>
                  {isDebtor && (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title={`Deuda pendiente: $${studentDebt}`}></div>
                  )}
                  <ChevronRight size={16} className={`text-slate-300 transition-transform ${selectedStudentId === s.id ? 'translate-x-1 text-blue-400' : ''}`} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-100">
                          {selectedStudent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
                             <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${debtTotal > 0 ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {debtTotal > 0 ? `Deudor ($${debtTotal})` : 'Al día'}
                             </span>
                          </div>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{selectedStudent.status}</span>
                            <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {calculateAge(selectedStudent.birthDate)} años
                            </span>
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={handleOpenEdit} className="px-5 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">
                          <Edit3 size={16}/> <span>Perfil Completo</span>
                       </button>
                    </div>
                 </div>

                 <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-10 overflow-hidden border border-slate-200">
                    <button onClick={() => setActiveTab('profile')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>General</button>
                    <button onClick={() => setActiveTab('fees')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'fees' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Saldos {debtTotal > 0 && <span className="ml-1 text-[9px] bg-rose-500 text-white px-1.5 rounded-full">{studentFeeHistory.filter(f => f.balance > 0).length}</span>}</button>
                    <button onClick={() => setActiveTab('evaluations')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'evaluations' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Físico</button>
                 </div>

                 {activeTab === 'profile' && (
                   <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="flex items-center space-x-4 text-sm text-slate-600 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                              <Mail size={16} className="text-slate-400"/>
                              <span className="font-bold">{selectedStudent.email}</span>
                           </div>
                           <div className="flex items-center space-x-4 text-sm text-slate-600 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                              <Phone size={16} className="text-slate-400"/>
                              <span className="font-bold">{selectedStudent.phone}</span>
                           </div>
                           <div className="flex items-center space-x-4 text-sm text-slate-600 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                              <MapPin size={16} className="text-slate-400"/>
                              <span className="font-bold truncate">{selectedStudent.address.street} {selectedStudent.address.number}, {selectedStudent.address.locality}</span>
                           </div>
                        </div>
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6 shadow-xl">
                           <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
                             <Clock size={12}/> Cronograma Activo
                           </h4>
                           <div className="grid grid-cols-2 gap-3">
                              {selectedStudent.schedule.map(s => (
                                <div key={s.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                   <p className="text-[9px] font-black uppercase text-blue-300 mb-1">{s.day}</p>
                                   <p className="text-sm font-black">{s.startTime} - {s.endTime}</p>
                                </div>
                              ))}
                              {selectedStudent.schedule.length === 0 && <p className="col-span-2 text-xs text-white/40 italic text-center py-4">Sin horarios definidos.</p>}
                           </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 space-y-4">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                               <StickyNote size={14}/> Notas del Entrenador
                            </h3>
                            <button 
                              onClick={handleSaveQuickNotes}
                              className="text-[10px] font-black uppercase bg-white border border-amber-200 px-4 py-1.5 rounded-full text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                            >
                               Guardar Cambios
                            </button>
                         </div>
                         <textarea 
                           className="w-full bg-transparent border-none outline-none text-sm text-amber-900 font-medium h-32 resize-none placeholder-amber-200"
                           placeholder="Escribe aquí observaciones sobre el entrenamiento, lesiones o progresos cualitativos..."
                           value={localNotes}
                           onChange={e => setLocalNotes(e.target.value)}
                         />
                      </div>
                   </div>
                 )}

                 {activeTab === 'fees' && (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-black flex items-center gap-3"><History size={24} className="text-blue-500"/> Historial de Cobros</h3>
                         <div className="px-5 py-3 bg-slate-900 rounded-2xl text-white shadow-lg">
                            <span className="text-[9px] font-black uppercase text-blue-400 block mb-0.5">Saldo Corriente</span>
                            <span className="text-xl font-black">${debtTotal}</span>
                         </div>
                      </div>

                      <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner">
                         <table className="w-full text-left">
                            <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                               <tr>
                                  <th className="px-6 py-5">Periodo</th>
                                  <th className="px-6 py-5">Cuota Total</th>
                                  <th className="px-6 py-5">Cobrado</th>
                                  <th className="px-6 py-5">Restante</th>
                                  <th className="px-6 py-5 text-center">Estado</th>
                                  <th className="px-6 py-5 text-right">Cobrar</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                               {studentFeeHistory.map(f => (
                                 <tr key={f.id} className="hover:bg-white transition-colors">
                                    <td className="px-6 py-5 font-bold text-slate-700">{MONTH_NAMES[f.month]} {f.year}</td>
                                    <td className="px-6 py-5 font-black text-slate-400">${f.amountOwed}</td>
                                    <td className="px-6 py-5 font-black text-emerald-600">${f.paid}</td>
                                    <td className="px-6 py-5 font-black text-rose-500">
                                       {f.balance > 0 ? `$${f.balance}` : '-'}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                          f.balance <= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          f.paid > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                       }`}>
                                          {f.balance <= 0 ? 'Saldado' : f.paid > 0 ? 'Parcial' : 'Pendiente'}
                                       </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       {f.balance > 0 ? (
                                         <button 
                                           onClick={() => openPaymentForPeriod(f.month, f.year, f.balance)}
                                           className="p-3 bg-white text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                                           title="Registrar cobro parcial o total"
                                         >
                                            <CreditCard size={18}/>
                                         </button>
                                       ) : (
                                         <div className="flex justify-end pr-2">
                                           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                              <CheckCircle size={18} />
                                           </div>
                                         </div>
                                       )}
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}

                 {activeTab === 'evaluations' && (
                   <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3"><TrendingUp size={24} className="text-emerald-500"/> Progreso Antropométrico</h3>
                        <button onClick={() => setShowAddEval(true)} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-slate-800 transition-all shadow-lg">Nueva Medición</button>
                      </div>

                      {chartData.length > 1 ? (
                        <div className="h-80 w-full bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="date" hide />
                              <YAxis domain={['auto', 'auto']} hide />
                              <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                labelStyle={{ fontWeight: 'bold' }}
                              />
                              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={5} dot={{r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff'}} activeDot={{r: 10}} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="p-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-300">
                           <Activity size={64} className="mx-auto mb-6 opacity-10"/>
                           <p className="text-lg font-black uppercase tracking-widest mb-2">Sin Historial de Peso</p>
                           <p className="text-xs italic font-medium">Registra al menos dos mediciones para visualizar la curva de progreso.</p>
                        </div>
                      )}
                   </div>
                 )}
               </div>
            </div>
          ) : (
            <div className="h-[750px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-16 text-slate-300 shadow-sm animate-pulse">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                 <Users size={48} className="opacity-10" />
               </div>
               <p className="text-2xl font-black text-slate-400 mb-2 uppercase tracking-tighter">Seleccioná un alumno</p>
               <p className="text-sm text-center italic font-medium max-w-xs">Gestioná sus cuotas, horarios y seguimiento físico desde este panel centralizado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
