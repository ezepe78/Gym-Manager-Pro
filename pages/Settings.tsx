
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MONTH_NAMES } from '../constants';
import { 
  Save, 
  CheckCircle, 
  RotateCcw, Layers, Calendar, Trash2, Edit3, History, Info, Eraser, AlertCircle, Camera, Store,
  X, MessageSquare, Users
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    simulatedDate,
    resetData,
    getRatesForPeriod,
    setHistoricalTieredAmount,
    deleteHistoricalTieredAmount,
    tieredAmountHistory,
    gymName,
    gymLogo,
    whatsappTemplateAgenda,
    whatsappTemplateDebt,
    updateGymInfo,
    updateWhatsappTemplates,
    maxCapacityPerShift,
    updateMaxCapacity
  } = useApp();
  
  const simDate = new Date(simulatedDate);
  const [targetMonth, setTargetMonth] = useState(simDate.getMonth());
  const [targetYear, setTargetYear] = useState(simDate.getFullYear());
  
  const [localGymName, setLocalGymName] = useState(gymName);
  const [localGymLogo, setLocalGymLogo] = useState<string | null>(gymLogo);
  const [localMaxCapacity, setLocalMaxCapacity] = useState(maxCapacityPerShift);

  const [localWpAgenda, setLocalWpAgenda] = useState(whatsappTemplateAgenda);
  const [localWpDebt, setLocalWpDebt] = useState(whatsappTemplateDebt);

  const [localTiers, setLocalTiers] = useState<{ [key: number]: number }>(getRatesForPeriod(targetMonth, targetYear));
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<{ month: number; year: number } | null>(null);

  useEffect(() => {
    setLocalTiers(getRatesForPeriod(targetMonth, targetYear));
  }, [targetMonth, targetYear, getRatesForPeriod]);

  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'success' | 'error' }>({ 
    message: '', visible: false, type: 'success' 
  });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleUpdateTier = (tier: number, val: number) => {
    setLocalTiers(prev => ({ ...prev, [tier]: val }));
  };

  const handleSaveTiers = () => {
    setHistoricalTieredAmount(targetMonth, targetYear, localTiers);
    triggerToast(`Tarifas para ${MONTH_NAMES[targetMonth]} ${targetYear} guardadas exitosamente.`);
  };

  const handleSaveGymInfo = () => {
    updateGymInfo(localGymName, localGymLogo);
    updateMaxCapacity(localMaxCapacity);
    triggerToast("Información del gimnasio y aforo actualizados.");
  };

  const handleSaveWpTemplates = () => {
    updateWhatsappTemplates(localWpAgenda, localWpDebt);
    triggerToast("Plantillas de WhatsApp actualizadas.");
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalGymLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    const defaults = { 1: 15000, 2: 18000, 3: 21000, 4: 24000, 5: 27000 };
    setLocalTiers(defaults);
    triggerToast("Editor restablecido a valores por defecto.");
  };

  const handleResetAll = () => {
    resetData();
    triggerToast("Sistema reiniciado a valores de fábrica.");
    setShowResetConfirm(false);
    setLocalGymName("GymPro");
    setLocalGymLogo(null);
    setLocalMaxCapacity(10);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] p-8 max-md w-full max-w-md shadow-2xl border border-rose-100">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><RotateCcw size={28}/></div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Peligro: Reinicio Total</h3>
              <p className="text-slate-500 text-sm mb-8">Esta acción borrará todos los registros de alumnos, pagos y cronogramas. ¿Continuar?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleResetAll} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200">Reiniciar Ahora</button>
                 <button onClick={() => setShowResetConfirm(false)} className="w-full py-4 bg-slate-100 font-bold rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors">Volver</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración del Negocio</h1>
          <p className="text-slate-500 font-medium">Administra el nombre, logo, facturación y tarifas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 overflow-hidden relative">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Store size={24}/>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-none">Identidad y Aforo</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Configuración General</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
               <div className="relative group">
                  <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                    {localGymLogo ? (
                      <img src={localGymLogo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95">
                    <Edit3 size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                  {localGymLogo && (
                    <button 
                      onClick={() => setLocalGymLogo(null)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-lg shadow-md flex items-center justify-center hover:bg-rose-600"
                    >
                      <X size={14} />
                    </button>
                  )}
               </div>

               <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Gimnasio</label>
                    <input 
                      type="text" 
                      value={localGymName} 
                      onChange={e => setLocalGymName(e.target.value)}
                      placeholder="Ej: Power Fit Studio"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                       <Users size={12}/> Capacidad Máxima por Turno
                    </label>
                    <input 
                      type="number" 
                      value={localMaxCapacity} 
                      onChange={e => setLocalMaxCapacity(Number(e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl" 
                    />
                    <p className="text-[9px] text-slate-400 font-bold ml-1">Controla cuántos alumnos pueden agendarse en un mismo bloque horario.</p>
                  </div>

                  <button onClick={handleSaveGymInfo} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    <Save size={18}/> Guardar Cambios
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                  <MessageSquare size={24}/>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-none">WhatsApp</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Configura tus mensajes</p>
                </div>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Confirmación de Turno (Agenda)</label>
                   <textarea 
                     value={localWpAgenda} 
                     onChange={e => setLocalWpAgenda(e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all h-24 resize-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Recordatorio de Deuda (Alertas)</label>
                   <textarea 
                     value={localWpDebt} 
                     onChange={e => setLocalWpDebt(e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all h-24 resize-none"
                   />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Etiquetas disponibles:</p>
                   <div className="flex flex-wrap gap-2">
                      <code className="text-[9px] font-black bg-white px-2 py-1 rounded-md border border-slate-200">{"{studentName}"}</code>
                      <code className="text-[9px] font-black bg-white px-2 py-1 rounded-md border border-slate-200">{"{gymName}"}</code>
                      <code className="text-[9px] font-black bg-white px-2 py-1 rounded-md border border-slate-200">{"{time}"}</code>
                   </div>
                </div>

                <button onClick={handleSaveWpTemplates} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <Save size={18}/> Guardar Plantillas
                </button>
             </div>
          </div>
        </div>

        <div className="space-y-10">
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
               <div className="bg-white rounded-[2rem] p-8 max-md w-full max-w-md shadow-2xl border border-rose-100">
                  <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><AlertCircle size={28}/></div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar Periodo?</h3>
                  <p className="text-slate-500 text-sm mb-8">
                    Vas a eliminar el historial de tarifas de <strong>{periodToDelete ? `${MONTH_NAMES[periodToDelete.month]} ${periodToDelete.year}` : ''}</strong>. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => {
                          if (periodToDelete) {
                            deleteHistoricalTieredAmount(periodToDelete.month, periodToDelete.year);
                            triggerToast("Periodo eliminado correctamente");
                            setShowDeleteConfirm(false);
                            setPeriodToDelete(null);
                          }
                        }} 
                        className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200"
                     >
                        Eliminar Registro
                     </button>
                     <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-slate-100 font-bold rounded-2xl text-slate-600 hover:bg-slate-200 transition-all">Cancelar</button>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                      <Layers size={24}/>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 leading-none">Tarifario</h2>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Definir valores para un periodo</p>
                    </div>
                </div>
                <button 
                  onClick={handleResetToDefault}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 group"
                >
                  <Eraser size={18}/>
                </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><Calendar size={12}/> Mes</label>
                  <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none">
                      {MONTH_NAMES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><Calendar size={12}/> Año</label>
                  <input type="number" value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {[1, 2, 3, 4, 5].map(tier => (
                  <div key={tier} className="space-y-1 group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{tier} {tier === 1 ? 'Vez' : 'Veces'} x Semana</label>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">$</span>
                        <input 
                          type="number" 
                          value={localTiers[tier] || 0} 
                          onChange={e => handleUpdateTier(tier, Number(e.target.value))} 
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xl" 
                        />
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 relative z-10">
              <button onClick={handleSaveTiers} className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                  <Save size={20}/> Guardar Tarifas
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                  <History size={24}/>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-none">Historial de Tarifas</h2>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Registros históricos por periodo</p>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                   <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <th className="px-4 py-2">Periodo</th>
                         {[1, 2, 3, 4, 5].map(t => <th key={t} className="px-2 py-2 text-center">{t}v</th>)}
                         <th className="px-4 py-2 text-right">Acciones</th>
                      </tr>
                   </thead>
                   <tbody>
                      {tieredAmountHistory.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month).map((h, idx) => (
                         <tr key={idx} className="group bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl">
                            <td className="px-4 py-4 rounded-l-2xl">
                               <span className="font-black text-slate-700">{MONTH_NAMES[h.month]} {h.year}</span>
                            </td>
                            {[1, 2, 3, 4, 5].map(t => (
                               <td key={t} className="px-2 py-4 text-center font-bold text-slate-600">
                                  ${h.rates[t]?.toLocaleString() || '0'}
                               </td>
                            ))}
                            <td className="px-4 py-4 text-right rounded-r-2xl">
                               <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setTargetMonth(h.month);
                                      setTargetYear(h.year);
                                      setLocalTiers(h.rates);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                    title="Editar"
                                  >
                                     <Edit3 size={16}/>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setPeriodToDelete({ month: h.month, year: h.year });
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                                    title="Eliminar"
                                  >
                                     <Trash2 size={16}/>
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                <RotateCcw size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-rose-800 leading-none">Zona de Peligro</h2>
                <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mt-1">Mantenimiento</p>
              </div>
            </div>
            <button onClick={() => setShowResetConfirm(true)} className="w-full py-5 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3">
                <Trash2 size={20}/> Reiniciar Sistema
            </button>
          </div>
        </div>
      </div>

      {toast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 border ${toast.type === 'error' ? 'bg-rose-900 border-rose-700 text-white' : 'bg-slate-900 border-slate-700 text-white'}`}>
            <CheckCircle size={18} className={toast.type === 'error' ? 'text-rose-400' : 'text-emerald-500'} />
            <p className="text-sm font-bold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
