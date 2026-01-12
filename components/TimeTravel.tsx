
import React from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, FastForward, Rewind, Info } from 'lucide-react';

export const TimeTravel: React.FC = () => {
  const { simulatedDate, setSimulatedDate, resetData } = useApp();
  const date = new Date(simulatedDate);

  const adjustDate = (days: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setDate(newDate.getDate() + days);
    setSimulatedDate(newDate.toISOString());
  };

  const setSpecificDay = (day: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setDate(day);
    setSimulatedDate(newDate.toISOString());
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <div className="flex flex-col items-end space-y-2">
        {/* Tooltip */}
        <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity mb-2">
          Simular Fecha (Modo Debug)
        </div>
        
        <div className="glass shadow-2xl rounded-2xl p-4 flex flex-col space-y-3 border-blue-500/30">
          <div className="flex items-center justify-between space-x-4">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hoy es (Simulado)</span>
                <span className="text-sm font-semibold text-blue-600">
                  {date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
             </div>
             <button onClick={resetData} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors" title="Reiniciar Aplicación">
               <RotateCcw size={18} />
             </button>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => adjustDate(-1)} className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-all">
              <Rewind size={16} className="mr-1" /> <span className="text-xs font-medium">-1 día</span>
            </button>
            <button onClick={() => adjustDate(1)} className="flex-1 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-all">
               <span className="text-xs font-medium">+1 día</span> <FastForward size={16} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSpecificDay(5)} className="text-[10px] py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded font-bold transition-all">
              Día 5 (En Término)
            </button>
            <button onClick={() => setSpecificDay(12)} className="text-[10px] py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-bold transition-all">
              Día 12 (Moroso)
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
            <Info size={12} />
            <span>Los estados financieros cambian según el día.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
