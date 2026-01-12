
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, StudentStatus, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  TrendingUp, CheckCircle2, DollarSign, MessageSquare, 
  CheckCircle, Wallet, Skull, 
  Calendar, X, Zap, 
  ArrowRight, Search, CreditCard, Calculator, Check, AlertCircle, User,
  FileText, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';

type PeriodType = 'CURRENT' | 'PREVIOUS' | 'NONE' | 'CUSTOM';

interface PendingFee {
  month: number;
  year: number;
  owed: number;
  paid: number;
  balance: number;
}

export const Dashboard: React.FC = () => {
  const { 
    students, getStudentStatus, getStudentDebt, 
    getTotalDelinquentDebt, payments, fees, 
    simulatedDate, registerBulkFees,
    expenses, getRatesForPeriod, addPayment, gymName,
    whatsappTemplateDebt, navigateToStudent
  } = useApp();

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDelinquentModal, setShowDelinquentModal] = useState(false);
  const [showCollectedModal, setShowCollectedModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  
  // Cobro Express States
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [searchExpress, setSearchExpress] = useState('');
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<(Student & { pendingMonths: PendingFee[] }) | null>(null);
  const [selectedFeeKeys, setSelectedFeeKeys] = useState<string[]>([]);
  const [expressAmount, setExpressAmount] = useState(0);

  // Filtros de periodo
  const [period, setPeriod] = useState<PeriodType>('CURRENT');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const currentMonthSim = new Date(simulatedDate).getMonth();
  const currentYearSim = new Date(simulatedDate).getFullYear();

  const [targetMonth, setTargetMonth] = useState(currentMonthSim);
  const [targetYear, setTargetYear] = useState(currentYearSim);

  useEffect(() => {
    if (showConfirm) {
      setTargetMonth(currentMonthSim);
      setTargetYear(currentYearSim);
    }
  }, [showConfirm, currentMonthSim, currentYearSim]);

  // Cálculo de rango de fechas según el filtro
  const dateRange = useMemo(() => {
    const simDate = new Date(simulatedDate);
    let start: Date | null = null;
    let end: Date | null = null;

    if (period === 'CURRENT') {
      start = new Date(simDate.getFullYear(), simDate.getMonth(), 1);
      end = new Date(simDate.getFullYear(), simDate.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'PREVIOUS') {
      start = new Date(simDate.getFullYear(), simDate.getMonth() - 1, 1);
      end = new Date(simDate.getFullYear(), simDate.getMonth(), 0, 23, 59, 59);
    } else if (period === 'CUSTOM') {
      start = new Date(customRange.start + 'T00:00:00');
      end = new Date(customRange.end + 'T23:59:59');
    }

    return { start, end };
  }, [period, customRange, simulatedDate]);

  const isInRange = (dateStr: string) => {
    if (period === 'NONE' || !dateRange.start || !dateRange.end) return true;
    const d = new Date(dateStr);
    return d >= dateRange.start && d <= dateRange.end;
  };

  const activeRates = getRatesForPeriod(currentMonthSim, currentYearSim);

  const triggerToast = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleBulkFees = () => {
    registerBulkFees(targetMonth, targetYear);
    triggerToast(`¡Cuotas de ${MONTH_NAMES[targetMonth]} ${targetYear} generadas según frecuencia!`);
    setShowConfirm(false);
  };

  // Lógica de Modales Detallados
  const collectedDetails = useMemo(() => {
    const rangePayments = payments.filter(p => isInRange(p.date));
    const studentAggregation: { [key: string]: { name: string, total: number, count: number } } = {};

    rangePayments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      const name = student ? student.name : 'Alumno Eliminado';
      if (!studentAggregation[p.studentId]) {
        studentAggregation[p.studentId] = { name, total: 0, count: 0 };
      }
      studentAggregation[p.studentId].total += p.amount;
      studentAggregation[p.studentId].count += 1;
    });

    return Object.entries(studentAggregation)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [payments, students, period, customRange, simulatedDate]);

  const expensesDetails = useMemo(() => {
    return expenses
      .filter(e => isInRange(e.date))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, period, customRange, simulatedDate]);

  const delinquentList = useMemo(() => {
    return students
      .filter(s => s.status === StudentStatus.ACTIVE && getStudentStatus(s.id) === PaymentStatus.DELINQUENT)
      .map(s => {
        const studentDebt = getStudentDebt(s.id).reduce((sum, d) => sum + (d.owed - d.paid), 0);
        return { ...s, totalDebt: studentDebt };
      })
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [students, getStudentStatus, getStudentDebt]);

  const totalDelinquentDebt = getTotalDelinquentDebt();

  const filteredPayments = payments.filter(p => isInRange(p.date));
  const totalCollectedInPeriod = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  const filteredExpenses = expenses.filter(e => isInRange(e.date));
  const totalExpensesInPeriod = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const netProfit = totalCollectedInPeriod - totalExpensesInPeriod;

  const chartData = [
    { name: 'Ingresos', value: totalCollectedInPeriod, color: '#10b981' },
    { name: 'Gastos', value: totalExpensesInPeriod, color: '#f43f5e' },
  ];

  const handleContact = (name: string, phone: string) => {
    let msg = whatsappTemplateDebt
      .replace(/{studentName}/g, name)
      .replace(/{gymName}/g, gymName);
      
    const message = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Lógica de búsqueda de Cobro Express
  const searchResults = useMemo(() => {
    if (!searchExpress) return [];
    return students
      .filter(s => s.name.toLowerCase().includes(searchExpress.toLowerCase()))
      .map(s => {
        const debt = getStudentDebt(s.id).map(d => ({ ...d, balance: d.owed - d.paid }));
        const totalDebt = debt.reduce((acc, d) => acc + d.balance, 0);
        return { ...s, totalDebt, pendingMonths: debt };
      })
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [searchExpress, students, getStudentDebt]);

  const selectStudentForExpressPayment = (student: any) => {
    if (student.pendingMonths.length > 0) {
      setSelectedStudentForPayment(student);
      const oldestKey = `${student.pendingMonths[0].month}-${student.pendingMonths[0].year}`;
      setSelectedFeeKeys([oldestKey]);
      setExpressAmount(student.pendingMonths[0].balance);
      setSearchExpress('');
    } else {
      triggerToast(`${student.name} no tiene cuotas pendientes.`);
    }
  };

  const toggleFeeSelection = (month: number, year: number, balance: number) => {
    const key = `${month}-${year}`;
    setSelectedFeeKeys(prev => {
      const isSelected = prev.includes(key);
      const newKeys = isSelected ? prev.filter(k => k !== key) : [...prev, key];
      const newTotal = selectedStudentForPayment?.pendingMonths
        .filter(m => newKeys.includes(`${m.month}-${m.year}`))
        .reduce((acc, m) => acc + m.balance, 0) || 0;
      setExpressAmount(newTotal);
      return newKeys;
    });
  };

  const selectAllFees = () => {
    if (!selectedStudentForPayment) return;
    const allKeys = selectedStudentForPayment.pendingMonths.map(m => `${m.month}-${m.year}`);
    setSelectedFeeKeys(allKeys);
    setExpressAmount(selectedStudentForPayment.totalDebt);
  };

  const handleExpressPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment || selectedFeeKeys.length === 0 || expressAmount <= 0) return;
    let remainingPayment = expressAmount;
    const selectedFeesToPay = selectedStudentForPayment.pendingMonths.filter(m => 
      selectedFeeKeys.includes(`${m.month}-${m.year}`)
    );
    selectedFeesToPay.forEach(fee => {
      if (remainingPayment <= 0) return;
      const paymentForThisFee = Math.min(remainingPayment, fee.balance);
      addPayment({
        studentId: selectedStudentForPayment.id,
        month: fee.month,
        year: fee.year,
        amount: paymentForThisFee,
        date: new Date().toISOString().split('T')[0]
      });
      remainingPayment -= paymentForThisFee;
    });
    triggerToast(`Cobro de $${expressAmount} a ${selectedStudentForPayment.name} registrado con éxito.`);
    setShowExpressModal(false);
    setSelectedStudentForPayment(null);
    setSelectedFeeKeys([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Modal Detalle Recaudación */}
      {showCollectedModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                       <ArrowUpRight size={24}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">Detalle de Ingresos</h3>
                       <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1">Ordenados por Mayor Importe</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCollectedModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600"><X/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                 <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total en el Periodo</span>
                    <span className="text-2xl font-black text-emerald-600">${totalCollectedInPeriod}</span>
                 </div>

                 {collectedDetails.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-emerald-200 hover:shadow-md transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">{item.name.charAt(0)}</div>
                          <div>
                             <p className="text-base font-black text-slate-800 tracking-tight">{item.name}</p>
                             <p className="text-[9px] font-black uppercase text-slate-400">{item.count} pago(s) registrado(s)</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-[9px] font-black uppercase text-emerald-400 tracking-tighter">Total Abonado</p>
                             <p className="text-xl font-black text-emerald-600">${item.total}</p>
                          </div>
                          <button onClick={() => { setShowCollectedModal(false); navigateToStudent(item.id); }} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                             <User size={18}/>
                          </button>
                       </div>
                    </div>
                 ))}

                 {collectedDetails.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                       <DollarSign className="mx-auto mb-4 text-slate-300" size={64}/>
                       <p className="text-lg font-black uppercase tracking-widest text-slate-500">Sin ingresos en este rango</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal Detalle Gastos */}
      {showExpensesModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-rose-50 bg-rose-50/30 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                       <ArrowDownRight size={24}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">Detalle de Egresos</h3>
                       <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mt-1">Ordenados por Mayor Gasto</p>
                    </div>
                 </div>
                 <button onClick={() => setShowExpensesModal(false)} className="p-2 hover:bg-rose-100 rounded-full transition-colors text-rose-600"><X/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                 <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Gastado</span>
                    <span className="text-2xl font-black text-rose-600">${totalExpensesInPeriod}</span>
                 </div>

                 {expensesDetails.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-rose-200 hover:shadow-md transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                             <FileText size={20}/>
                          </div>
                          <div>
                             <p className="text-base font-black text-slate-800 tracking-tight">{expense.description || expense.category}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{expense.category}</span>
                                <span className="text-[9px] font-black uppercase text-slate-400">{new Date(expense.date).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-rose-400 tracking-tighter">Importe</p>
                          <p className="text-xl font-black text-rose-600">${expense.amount}</p>
                       </div>
                    </div>
                 ))}

                 {expensesDetails.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                       <Wallet className="mx-auto mb-4 text-slate-300" size={64}/>
                       <p className="text-lg font-black uppercase tracking-widest text-slate-500">Sin gastos registrados</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal Detalle Morosidad */}
      {showDelinquentModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-rose-50 bg-rose-50/30 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                       <AlertCircle size={24}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">Alumnos en Mora</h3>
                       <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mt-1">Ordenados por Deuda Mayor</p>
                    </div>
                 </div>
                 <button onClick={() => setShowDelinquentModal(false)} className="p-2 hover:bg-rose-100 rounded-full transition-colors text-rose-600"><X/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                 <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <span className="text-[10px] font-black uppercase text-slate-400">Resumen de Morosidad</span>
                    <span className="text-lg font-black text-rose-600">${totalDelinquentDebt} acumulados</span>
                 </div>

                 {delinquentList.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-rose-200 hover:shadow-md transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">{s.name.charAt(0)}</div>
                          <div>
                             <p className="text-base font-black text-slate-800 tracking-tight">{s.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{s.phone}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <p className="text-[9px] font-black uppercase text-rose-400 tracking-tighter">Deuda Total</p>
                             <p className="text-xl font-black text-rose-600">${s.totalDebt}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button onClick={() => handleContact(s.name, s.phone)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm" title="Contactar por WhatsApp">
                                <MessageSquare size={18}/>
                             </button>
                             <button onClick={() => { setShowDelinquentModal(false); navigateToStudent(s.id); }} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Ver Perfil">
                                <User size={18}/>
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}

                 {delinquentList.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                       <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={64}/>
                       <p className="text-lg font-black uppercase tracking-widest text-slate-500">No hay morosos</p>
                    </div>
                 )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-[10px] font-bold text-slate-400">Los alumnos en estado MOROSO son aquellos con deuda de meses anteriores o vencidos después del día 10 del mes corriente.</p>
              </div>
           </div>
        </div>
      )}

      {/* Modal Cobro Express */}
      {showExpressModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                       <CreditCard size={24}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">Cobro Express</h3>
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Gestión Rápida de Caja</p>
                    </div>
                 </div>
                 <button onClick={() => { setShowExpressModal(false); setSelectedStudentForPayment(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
              </div>

              <div className="p-8">
                 {!selectedStudentForPayment ? (
                   <div className="space-y-6">
                      <div className="relative group">
                         <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
                         <input 
                           autoFocus
                           placeholder="Buscar alumno por nombre..." 
                           className="w-full pl-14 pr-6 py-5 bg-slate-100 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-3xl outline-none text-xl font-bold transition-all"
                           value={searchExpress}
                           onChange={(e) => setSearchExpress(e.target.value)}
                         />
                      </div>

                      <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                         {searchResults.map(s => (
                           <button 
                             key={s.id} 
                             onClick={() => selectStudentForExpressPayment(s)}
                             className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-black group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">{s.name.charAt(0)}</div>
                                 <div className="text-left">
                                    <p className="text-base font-black text-slate-800">{s.name}</p>
                                    <p className="text-[10px] font-black uppercase text-slate-400">Alumno {s.status === StudentStatus.ACTIVE ? 'Activo' : 'Inactivo'}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 {s.totalDebt > 0 ? (
                                   <div className="text-right">
                                      <p className="text-[9px] font-black uppercase text-rose-500">Deuda Total</p>
                                      <p className="text-lg font-black text-rose-600">${s.totalDebt}</p>
                                   </div>
                                 ) : (
                                   <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Al Día</span>
                                 )}
                                 <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
                              </div>
                           </button>
                         ))}
                      </div>
                   </div>
                 ) : (
                   <form onSubmit={handleExpressPaymentSubmit} className="space-y-8 animate-in slide-in-from-right-4">
                      <div className="flex items-center gap-5 p-5 bg-slate-900 text-white rounded-[2rem]">
                         <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-black">
                            {selectedStudentForPayment.name.charAt(0)}
                         </div>
                         <div className="flex-1">
                            <h4 className="text-xl font-black truncate">{selectedStudentForPayment.name}</h4>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Seleccioná los meses a cobrar</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuotas Pendientes</span>
                            <button 
                              type="button" 
                              onClick={selectAllFees}
                              className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                            >
                               Seleccionar Todo
                            </button>
                         </div>
                         
                         <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                            {selectedStudentForPayment.pendingMonths.map(m => {
                               const key = `${m.month}-${m.year}`;
                               const isSelected = selectedFeeKeys.includes(key);
                               return (
                                 <button
                                   key={key}
                                   type="button"
                                   onClick={() => toggleFeeSelection(m.month, m.year, m.balance)}
                                   className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                      isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                   }`}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                                       }`}>
                                          {isSelected && <Check size={14} />}
                                       </div>
                                       <div className="text-left">
                                          <p className={`text-sm font-black ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{MONTH_NAMES[m.month]} {m.year}</p>
                                       </div>
                                    </div>
                                    <span className={`text-sm font-black ${isSelected ? 'text-blue-800' : 'text-slate-500'}`}>${m.balance}</span>
                                 </button>
                               );
                            })}
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                            <Calculator size={14} className="text-emerald-500"/> Monto a Ingresar ($)
                         </label>
                         <input 
                           type="number" 
                           autoFocus
                           className="w-full p-6 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-[1.5rem] outline-none text-4xl font-black text-emerald-600 text-center transition-all"
                           value={expressAmount}
                           onChange={(e) => setExpressAmount(Number(e.target.value))}
                         />
                      </div>

                      <div className="flex gap-4">
                         <button 
                           type="button"
                           onClick={() => setSelectedStudentForPayment(null)}
                           className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[1.5rem] hover:bg-slate-200 transition-all"
                         >
                            Cancelar
                         </button>
                         <button 
                           type="submit"
                           disabled={selectedFeeKeys.length === 0 || expressAmount <= 0}
                           className="flex-[2] py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                         >
                            <CheckCircle size={24}/>
                            Confirmar Cobro
                         </button>
                      </div>
                   </form>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal Cuotas Manuales */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-md w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Zap size={28}/></div>
              <button onClick={() => setShowConfirm(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Generar Cuotas</h3>
            <p className="text-sm text-slate-500 mb-6">Se calcularán automáticamente los importes según la frecuencia de cada alumno y el historial de tarifas del periodo seleccionado.</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mes</label>
                 <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                   {MONTH_NAMES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Año</label>
                 <input type="number" value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
               </div>
            </div>
            <button onClick={handleBulkFees} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Confirmar y Generar</button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 font-medium mt-1">Gestión por frecuencia con historial tarifario activo.</p>
          
          {period !== 'NONE' && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 w-fit px-4 py-2 rounded-full border border-slate-200 mt-6 shadow-sm">
               <Calendar size={12} className="text-slate-400"/>
               <span>Mostrando datos desde</span>
               <span className="text-slate-900">{dateRange.start?.toLocaleDateString()}</span>
               <ArrowRight size={10} className="text-slate-300"/>
               <span className="text-slate-900">{dateRange.end?.toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto mt-1">
          <button 
            onClick={() => setShowConfirm(true)} 
            className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center space-x-3 shadow-xl shadow-blue-200/50 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <Zap size={18} className="text-blue-100" />
            <span className="font-bold whitespace-nowrap text-sm">Generar Cuotas</span>
          </button>

          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            <button onClick={() => setPeriod('CURRENT')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${period === 'CURRENT' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Mes Actual</button>
            <button onClick={() => setPeriod('PREVIOUS')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${period === 'PREVIOUS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Mes Anterior</button>
            <button onClick={() => setPeriod('NONE')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${period === 'NONE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Sin Tope</button>
          </div>

          <button 
            onClick={() => setShowExpressModal(true)} 
            className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl flex items-center space-x-3 shadow-xl shadow-emerald-200/50 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <CreditCard size={18} className="text-emerald-100" />
            <span className="font-bold whitespace-nowrap text-sm">Cobro Rápido</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => setShowCollectedModal(true)}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all text-left hover:scale-[1.02]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform"><DollarSign size={24}/></div>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase">Ingresos</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Recaudado</p>
            <p className="text-4xl font-black text-slate-900 mt-1">${totalCollectedInPeriod}</p>
          </div>
        </button>

        <button 
          onClick={() => setShowExpensesModal(true)}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-rose-200 transition-all text-left hover:scale-[1.02]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform"><Wallet size={24}/></div>
            <span className="text-[10px] font-black bg-rose-50 text-rose-500 px-3 py-1 rounded-full uppercase">Egresos</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gastos del Rango</p>
            <p className="text-4xl font-black text-slate-900 mt-1">${totalExpensesInPeriod}</p>
          </div>
        </button>

        <button 
          onClick={() => setShowDelinquentModal(true)}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-rose-300 transition-all text-left hover:scale-[1.02]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Skull size={24}/></div>
            <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase">Actual</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Morosidad Crítica</p>
            <p className="text-4xl font-black text-rose-600 mt-1">${totalDelinquentDebt}</p>
          </div>
        </button>

        <div className="bg-blue-600 p-6 rounded-3xl shadow-2xl flex flex-col justify-between text-white hover:bg-blue-700 transition-colors">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4"><TrendingUp size={24}/></div>
            <span className="text-[10px] font-black bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest">Balance</span>
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Utilidad en Rango</p>
            <p className="text-4xl font-black mt-1">${netProfit}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[2.5rem] border border-blue-50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-6 mb-8 relative z-10">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                    <Zap size={32} className="animate-pulse"/>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900">Tarifas Vigentes</h3>
                    <p className="text-sm text-slate-500 mt-1">Valores para <span className="text-blue-600 font-bold">{MONTH_NAMES[currentMonthSim]} {currentYearSim}</span>.</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                 {[1, 2, 3, 4, 5].map(tier => (
                   <div key={tier} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-blue-50 hover:border-blue-100 transition-all cursor-default">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{tier} {tier === 1 ? 'Vez' : 'Veces'}</p>
                      <p className="text-lg font-black text-blue-600">${activeRates[tier]}</p>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-8 flex items-center space-x-2"><TrendingUp size={20} className="text-blue-500"/><span>Desempeño</span></h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-lg font-black text-slate-800">Alertas de Cobro</h2>
             <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase border border-rose-100 tracking-tighter">{delinquentList.length} críticos</span>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
            {delinquentList.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">{s.name.charAt(0)}</div>
                  <div className="max-w-[140px]">
                    <p className="text-base font-black truncate text-slate-800 tracking-tight">{s.name}</p>
                    <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-0.5">Deuda Crítica</p>
                  </div>
                </div>
                <button onClick={() => handleContact(s.name, s.phone)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"><MessageSquare size={18}/></button>
              </div>
            ))}
            {delinquentList.length === 0 && (
              <div className="text-center py-24 opacity-30">
                 <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={56}/>
                 <p className="text-xs font-black uppercase tracking-widest text-slate-500">Todo en orden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 border border-slate-700">
            <CheckCircle className="text-emerald-400" size={20} />
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
