
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DAYS_SHORT, MONTH_NAMES } from '../constants';
import { PaymentStatus, StudentStatus, Student, DayOfWeek } from '../types';
import { 
  CheckCircle, Clock, X, UserCheck, 
  Star, MessageSquare, User, Maximize2, Minimize2, 
  Eye, EyeOff, LayoutGrid, Info, List, GripVertical, CreditCard, StickyNote, Activity, Mail, Phone, MapPin,
  Users, Filter
} from 'lucide-react';

export const Agenda: React.FC = () => {
  const { 
    students, getStudentStatus, toggleAttendance, 
    attendance, simulatedDate, updateStudent, addPayment, getStudentDebt,
    gymName, whatsappTemplateAgenda, maxCapacityPerShift, moveStudentSchedule
  } = useApp();

  // UI States
  const [isCompact, setIsCompact] = useState(false);
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
  const [capacityFilter, setCapacityFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL'>('ALL');
  const [focusedDay, setFocusedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'TIMELINE'>('GRID');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<{ studentId: string, fromDay: DayOfWeek, fromTime: string } | null>(null);

  const simDate = new Date(simulatedDate);
  const todayStr = simDate.toISOString().split('T')[0];
  const currentHour = simDate.getHours();
  const currentMinute = simDate.getMinutes();

  const timeIndicatorPos = useMemo(() => {
    if (currentHour < 5 || currentHour > 20) return null;
    const totalMinutesSinceStart = (currentHour - 5) * 60 + currentMinute;
    return (totalMinutesSinceStart / (16 * 60)) * 100;
  }, [currentHour, currentMinute]);

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return { label: 'Al Día', color: 'emerald', sortRank: 3 };
      case PaymentStatus.PENDING: return { label: 'Pendiente', color: 'amber', sortRank: 2 };
      case PaymentStatus.DELINQUENT: return { label: 'Moroso', color: 'rose', sortRank: 1 };
    }
  };

  const allTimeSlots = useMemo(() => {
    const hours = [];
    for (let i = 5; i <= 20; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }, []);

  const filteredTimeSlots = useMemo(() => {
    return allTimeSlots.filter(time => {
      const hour = parseInt(time.split(':')[0]);
      if (shiftFilter === 'MORNING') return hour < 12;
      if (shiftFilter === 'AFTERNOON') return hour >= 12 && hour < 18;
      if (shiftFilter === 'NIGHT') return hour >= 18;
      return true;
    });
  }, [allTimeSlots, shiftFilter]);

  const finalSlots = useMemo(() => {
    if (!isCompact) return filteredTimeSlots;
    return filteredTimeSlots.filter(time => {
      return DAYS_SHORT.some(day => {
        return students.some(s => 
          s.status === StudentStatus.ACTIVE && 
          s.schedule.some(slot => slot.day === day && slot.startTime === time)
        );
      });
    });
  }, [filteredTimeSlots, isCompact, students]);

  const isNewStudent = (joinDate: string) => {
    const join = new Date(joinDate).getTime();
    const now = simDate.getTime();
    return (now - join) < 7 * 24 * 60 * 60 * 1000;
  };

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId), 
    [students, selectedStudentId]
  );

  const debtTotal = useMemo(() => {
    if (!selectedStudentId) return 0;
    return getStudentDebt(selectedStudentId).reduce((acc, d) => acc + (d.owed - d.paid), 0);
  }, [selectedStudentId, getStudentDebt]);

  const handleDragStart = (e: React.DragEvent, studentId: string, day: DayOfWeek, time: string) => {
    setDraggedItem({ studentId, fromDay: day, fromTime: time });
    e.dataTransfer.setData('application/json', JSON.stringify({ studentId, fromDay: day, fromTime: time }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, toDay: DayOfWeek, toTime: string) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { studentId, fromDay, fromTime } = JSON.parse(data);
    
    if (fromDay === toDay && fromTime === toTime) return;

    const success = moveStudentSchedule(studentId, fromDay, fromTime, toDay, toTime);
    if (!success) {
      alert(`No se pudo mover el alumno. El cupo máximo de ${maxCapacityPerShift} alumnos está completo.`);
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative pb-20">
      
      {/* Student Profile Side Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStudentId(null)}></div>
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{selectedStudent.name}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedStudent.email}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedStudentId(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                  <X />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-6 rounded-3xl border ${debtTotal > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Saldo Total</span>
                    <span className={`text-2xl font-black ${debtTotal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ${debtTotal}
                    </span>
                 </div>
                 <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Status</span>
                    <span className="text-lg font-black text-slate-700 uppercase">{selectedStudent.status}</span>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <Phone size={18} className="text-slate-400" />
                   <span className="text-sm font-bold">{selectedStudent.phone}</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <MapPin size={18} className="text-slate-400" />
                   <span className="text-sm font-bold truncate">{selectedStudent.address.street} {selectedStudent.address.number}</span>
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <StickyNote size={16} className="text-amber-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observaciones</h4>
                 </div>
                 <textarea 
                   className="w-full p-6 bg-amber-50 rounded-3xl border border-amber-100 text-sm font-medium h-32 resize-none text-amber-900"
                   value={selectedStudent.notes}
                   onChange={(e) => updateStudent({ ...selectedStudent, notes: e.target.value })}
                   placeholder="Añadir notas privadas sobre el alumno..."
                 />
              </div>

              <div className="space-y-3">
                 <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asistencia Reciente</h4>
                 </div>
                 <div className="space-y-2">
                    {attendance.filter(a => a.studentId === selectedStudent.id && a.present).slice(-3).reverse().map((a, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 bg-white border border-slate-100 rounded-xl">
                        <span className="text-xs font-bold text-slate-600">{new Date(a.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{a.time}</span>
                      </div>
                    ))}
                    {attendance.filter(a => a.studentId === selectedStudent.id && a.present).length === 0 && (
                      <p className="text-xs text-slate-400 italic">Sin registros previos.</p>
                    )}
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white">
               <button 
                 onClick={() => {
                   const debtList = getStudentDebt(selectedStudent.id);
                   if (debtList.length > 0) {
                     addPayment({
                       studentId: selectedStudent.id,
                       month: debtList[0].month,
                       year: debtList[0].year,
                       amount: debtList[0].owed - debtList[0].paid,
                       date: new Date().toISOString().split('T')[0]
                     });
                     alert("Pago registrado con éxito.");
                   } else {
                     alert("El alumno no tiene deudas pendientes.");
                   }
                 }}
                 className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
               >
                  <CreditCard size={20} />
                  Saldar Deuda Actual
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Agenda Boutique</h1>
          <p className="text-slate-500 font-medium mt-1">Control de aforo, morosidad y reprogramaciones rápidas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            {[
              { id: 'GRID', label: 'Grilla', icon: <LayoutGrid size={14}/> },
              { id: 'TIMELINE', label: 'Timeline', icon: <List size={14}/> }
            ].map(mode => (
              <button 
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl flex items-center gap-2 transition-all ${viewMode === mode.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            {['MORNING', 'AFTERNOON', 'NIGHT', 'ALL'].map(id => (
              <button 
                key={id}
                onClick={() => setShiftFilter(id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${shiftFilter === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {id === 'ALL' ? 'Todo' : id === 'MORNING' ? 'Mañana' : id === 'AFTERNOON' ? 'Tarde' : 'Noche'}
              </button>
            ))}
          </div>

          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'AVAILABLE', label: 'Disponibles' },
              { id: 'FULL', label: 'Completos' }
            ].map(cap => (
              <button 
                key={cap.id}
                onClick={() => setCapacityFilter(cap.id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${capacityFilter === cap.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {cap.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsCompact(!isCompact)}
            className={`p-3 rounded-2xl border flex items-center gap-2 transition-all ${isCompact ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {isCompact ? <EyeOff size={20}/> : <Eye size={20}/>}
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Compacto</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${viewMode === 'TIMELINE' ? 'max-w-3xl mx-auto space-y-12' : `grid gap-6 ${focusedDay ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'}`}`}>
        {(viewMode === 'TIMELINE' ? [DAYS_SHORT.find(d => d === 'Lun')] : DAYS_SHORT).filter(d => !focusedDay || d === focusedDay).map(day => {
          if (!day) return null;
          return (
            <div key={day} className="flex flex-col space-y-4 animate-in slide-in-from-bottom-4">
              {/* Header Día */}
              {viewMode === 'GRID' && (
                <div className="glass p-5 rounded-[2rem] shadow-sm flex items-center justify-between group overflow-hidden relative">
                  <div className="relative z-10">
                    <h2 className="text-xl font-black text-slate-900">{day}</h2>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{MONTH_NAMES[simDate.getMonth()]}</p>
                  </div>
                  <button 
                    onClick={() => setFocusedDay(day === focusedDay ? null : day)}
                    className="relative z-10 p-3 bg-white/50 hover:bg-white rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-white"
                  >
                    {focusedDay ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                  </button>
                </div>
              )}

              {/* Lista de Turnos */}
              <div className="space-y-8 min-h-[500px] relative">
                {!focusedDay && viewMode === 'GRID' && timeIndicatorPos !== null && (
                  <div className="absolute left-0 right-0 z-50 pointer-events-none flex items-center gap-2" style={{ top: `${timeIndicatorPos}%` }}>
                    <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
                  </div>
                )}

                {finalSlots.map(time => {
                  const scheduledStudents = students.filter(s => 
                    s.status === StudentStatus.ACTIVE && 
                    s.schedule.some(slot => slot.day === day && slot.startTime === time)
                  );
                  
                  const isFull = scheduledStudents.length >= maxCapacityPerShift;
                  const isVisibleByCapacity = capacityFilter === 'ALL' || (capacityFilter === 'FULL' ? isFull : !isFull);

                  if (!isVisibleByCapacity) return null;

                  const sortedStudents = [...scheduledStudents].sort((a, b) => {
                    const statusA = getStatusConfig(getStudentStatus(a.id)).sortRank;
                    const statusB = getStatusConfig(getStudentStatus(b.id)).sortRank;
                    return statusA - statusB;
                  });

                  return (
                    <div 
                      key={`${day}-${time}`} 
                      className="space-y-4 group animate-in fade-in zoom-in-95 duration-300"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day as DayOfWeek, time)}
                    >
                      {/* Header del bloque horario con indicador de aforo */}
                      <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black tracking-tighter ${parseInt(time.split(':')[0]) === currentHour ? 'text-blue-700' : 'text-slate-600'}`}>
                            {time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           {isFull ? (
                             <span className="text-[8px] font-black uppercase bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-200">Completo</span>
                           ) : (
                             <span className="text-[8px] font-black uppercase text-slate-400">{scheduledStudents.length} / {maxCapacityPerShift}</span>
                           )}
                           <Users size={12} className={isFull ? "text-rose-500" : "text-slate-300"} />
                        </div>
                      </div>

                      {/* Grilla de Tarjetas */}
                      <div className="space-y-3 px-1">
                        {sortedStudents.map(student => {
                          const status = getStudentStatus(student.id);
                          const isPresent = attendance.some(a => a.studentId === student.id && a.date === todayStr && a.time === time);
                          const config = getStatusConfig(status);
                          const isNew = isNewStudent(student.joinDate);
                          const isBeingDragged = draggedItem?.studentId === student.id;

                          return (
                            <div 
                              key={`${day}-${time}-${student.id}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, student.id, day as DayOfWeek, time)}
                              onClick={() => setSelectedStudentId(student.id)}
                              className={`group/card relative p-4 rounded-[1.5rem] border-2 transition-all cursor-grab active:cursor-grabbing ${
                                isBeingDragged ? 'opacity-30 scale-95 border-dashed' :
                                isPresent ? 'bg-slate-900 border-slate-900 text-white' : 
                                status === PaymentStatus.DELINQUENT ? 'bg-rose-50/50 border-rose-100 shadow-rose-100/50 shadow-lg' : 'bg-white border-slate-50 shadow-sm hover:border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-3 min-w-0">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isPresent ? 'bg-white/10' : 'bg-slate-100 text-slate-400'}`}>
                                      <GripVertical size={14} className="opacity-0 group-hover/card:opacity-100 transition-opacity absolute -left-1" />
                                      {student.name.charAt(0)}
                                   </div>
                                   <div className="truncate">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-black truncate tracking-tight">{student.name}</p>
                                        {isNew && <Star size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isPresent ? 'bg-white/10 text-white/50' : `bg-${config.color}-50 text-${config.color}-600 border border-${config.color}-100`}`}>
                                          {config.label}
                                        </span>
                                      </div>
                                   </div>
                                </div>
                                
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleAttendance(student.id, todayStr, time); }}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                    isPresent ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300 hover:text-blue-500'
                                  }`}
                                >
                                  {isPresent ? <UserCheck size={18} /> : <CheckCircle size={18} />}
                                </button>
                              </div>

                              {status === PaymentStatus.DELINQUENT && !isPresent && (
                                <div className="absolute top-2 right-2 flex gap-1">
                                   <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {sortedStudents.length === 0 && !isCompact && (
                          <div className="border-2 border-dashed border-slate-100 rounded-2xl py-6 flex flex-col items-center justify-center opacity-40">
                             <span className="text-[10px] font-black uppercase text-slate-300">Disponible</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Overlay */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 glass rounded-full shadow-xl flex items-center gap-6 z-40 border border-white/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="text-[9px] font-black uppercase text-slate-500">Acción Requerida (Moroso)</span>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
          <Info size={12} className="text-blue-500" />
          <span className="text-[9px] font-black uppercase text-slate-500">Arrastra para re-programar</span>
        </div>
      </div>
    </div>
  );
};
