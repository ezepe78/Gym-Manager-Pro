
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell 
} from 'recharts';
import { MONTH_NAMES } from '../constants';
import { 
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, 
  DollarSign, Calendar, X, Tag, FileText, 
  ChevronDown, BarChart3, PieChart, ArrowRight 
} from 'lucide-react';

export const Finances: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, payments, simulatedDate } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    category: 'Alquiler', 
    amount: 0, 
    description: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const simDate = new Date(simulatedDate);
  const currentMonth = simDate.getMonth();
  const currentYear = simDate.getFullYear();

  // State for year filter in charts
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const totalPaymentsMonth = payments
    .filter(p => p.month === currentMonth && p.year === currentYear)
    .reduce((acc, p) => acc + p.amount, 0);

  const totalExpensesMonth = expenses
    .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, e) => acc + e.amount, 0);

  // Data for yearly evolution chart
  const yearlyData = useMemo(() => {
    return MONTH_NAMES.map((month, index) => {
      const monthlyPayments = payments
        .filter(p => p.year === selectedYear && p.month === index)
        .reduce((acc, p) => acc + p.amount, 0);
      
      const monthlyExpenses = expenses
        .filter(e => {
          const d = new Date(e.date);
          return d.getFullYear() === selectedYear && d.getMonth() === index;
        })
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        name: month.substring(0, 3),
        ingresos: monthlyPayments,
        gastos: monthlyExpenses,
        utilidad: monthlyPayments - monthlyExpenses
      };
    });
  }, [payments, expenses, selectedYear]);

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setForm({ 
      category: 'Alquiler', 
      amount: 0, 
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (expense: any) => {
    setEditingExpenseId(expense.id);
    setForm({
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      date: expense.date
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) return;
    
    if (editingExpenseId) {
      updateExpense(editingExpenseId, form);
    } else {
      addExpense(form);
    }
    
    setShowAddModal(false);
    setForm({ 
      category: 'Alquiler', 
      amount: 0, 
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    });
    setEditingExpenseId(null);
  };

  const yearsOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    payments.forEach(p => years.add(p.year));
    expenses.forEach(e => years.add(new Date(e.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [payments, expenses, currentYear]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-900">{editingExpenseId ? 'Editar Gasto' : 'Registrar Gasto'}</h3>
                 <button 
                   onClick={() => setShowAddModal(false)}
                   className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                 >
                    <X/>
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</label>
                    <div className="relative">
                       <select 
                         value={form.category} 
                         onChange={e => setForm({...form, category: e.target.value})} 
                         className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 font-bold appearance-none cursor-pointer"
                       >
                          <option>Alquiler</option>
                          <option>Servicios (Luz/Agua)</option>
                          <option>Sueldos</option>
                          <option>Insumos</option>
                          <option>Publicidad</option>
                          <option>Otros</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto ($)</label>
                    <input 
                      type="number" 
                      required 
                      autoFocus
                      value={form.amount === 0 ? '' : form.amount} 
                      onChange={e => setForm({...form, amount: Number(e.target.value)})} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 text-3xl font-black text-rose-600" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Fecha</label>
                    <input 
                      type="date" 
                      required 
                      value={form.date} 
                      onChange={e => setForm({...form, date: e.target.value})} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 font-bold" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none h-24 resize-none font-medium" 
                      placeholder="Ej: Pago de luz vencimiento mayo..." 
                    />
                 </div>
                 <button 
                   type="submit" 
                   className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                    {editingExpenseId ? <Edit3 size={20}/> : <Plus size={20}/>}
                    {editingExpenseId ? 'Guardar Cambios' : 'Guardar Gasto'}
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestión Financiera</h1>
          <p className="text-slate-500 font-medium mt-1">Rentabilidad neta, flujo de caja y egresos proyectados.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-rose-600 text-white px-8 py-4 rounded-[1.25rem] flex items-center gap-3 shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={24} />
          <span className="font-black text-sm uppercase tracking-wider">Registrar Gasto</span>
        </button>
      </div>

      {/* Monthly KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
               <TrendingUp size={14}/> Ingresos {MONTH_NAMES[currentMonth]}
            </span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">${totalPaymentsMonth}</span>
         </div>
         <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
               <TrendingDown size={14}/> Gastos {MONTH_NAMES[currentMonth]}
            </span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter relative z-10">${totalExpensesMonth}</span>
         </div>
         <div className={`p-8 rounded-[2rem] shadow-2xl border-2 flex flex-col justify-center relative overflow-hidden group ${totalPaymentsMonth - totalExpensesMonth >= 0 ? 'bg-blue-600 border-blue-400 text-white shadow-blue-200' : 'bg-rose-600 border-rose-400 text-white shadow-rose-200'}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
            <span className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
               <DollarSign size={14}/> Utilidad Neta
            </span>
            <span className="text-5xl font-black tracking-tighter relative z-10">${totalPaymentsMonth - totalExpensesMonth}</span>
         </div>
      </div>

      {/* Yearly Evolution Chart */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-1000">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 size={28}/>
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Evolución Anual</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Comparativa de Ingresos vs Gastos</p>
               </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <Calendar size={18} className="ml-3 text-slate-400" />
               <select 
                 value={selectedYear} 
                 onChange={e => setSelectedYear(Number(e.target.value))}
                 className="bg-transparent pr-8 py-2.5 outline-none font-black text-sm text-slate-700 appearance-none cursor-pointer"
               >
                  {yearsOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
               </select>
               <ChevronDown className="mr-3 text-slate-400 pointer-events-none" size={16} />
            </div>
         </div>

         <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart 
                 data={yearlyData} 
                 margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                 barGap={8}
               >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fontWeight: 700, fill: '#94a3b8'}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc', radius: 10}}
                    contentStyle={{ 
                      borderRadius: '1.5rem', 
                      border: 'none', 
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                      padding: '1.25rem'
                    }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                    labelStyle={{ fontWeight: 900, fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                  <Bar 
                    name="Ingresos"
                    dataKey="ingresos" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24} 
                  />
                  <Bar 
                    name="Gastos"
                    dataKey="gastos" 
                    fill="#f43f5e" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24} 
                  />
               </BarChart>
            </ResponsiveContainer>
         </div>

         <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-8">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ingresos Máximos:</span>
               <span className="text-sm font-black text-slate-700">${Math.max(...yearlyData.map(d => d.ingresos))}</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-rose-500"></div>
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gasto Promedio:</span>
               <span className="text-sm font-black text-slate-700">
                  ${Math.round(yearlyData.reduce((acc, d) => acc + d.gastos, 0) / 12)}
               </span>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-black text-xl flex items-center gap-3">
               <FileText size={24} className="text-slate-400"/> 
               Listado Histórico de Egresos
            </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                     <th className="px-10 py-6">Fecha</th>
                     <th className="px-10 py-6">Categoría</th>
                     <th className="px-10 py-6">Descripción</th>
                     <th className="px-10 py-6 text-right">Monto</th>
                     <th className="px-10 py-6 text-center">Acción</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {expenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-all group">
                       <td className="px-10 py-6 text-sm font-bold text-slate-600">{new Date(e.date).toLocaleDateString('es-AR')}</td>
                       <td className="px-10 py-6">
                          <span className="px-3 py-1 bg-white border border-slate-200 text-[9px] font-black rounded-full uppercase text-slate-500 shadow-sm group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                             {e.category}
                          </span>
                       </td>
                       <td className="px-10 py-6 text-sm text-slate-500 font-medium italic">{e.description || '-'}</td>
                       <td className="px-10 py-6 text-right font-black text-rose-600 text-xl tracking-tighter">${e.amount}</td>
                       <td className="px-10 py-6">
                          <div className="flex items-center justify-center gap-2">
                             <button 
                               onClick={() => handleOpenEdit(e)} 
                               className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center"
                               title="Editar"
                             >
                                <Edit3 size={18} />
                             </button>
                             <button 
                               onClick={() => deleteExpense(e.id)} 
                               className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center"
                               title="Eliminar"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                       <td colSpan={5} className="p-24 text-center">
                          <div className="flex flex-col items-center opacity-20">
                             <Wallet size={64} className="mb-4" />
                             <p className="text-lg font-black uppercase tracking-widest text-slate-500">No hay gastos registrados</p>
                          </div>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
