import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { calculateAge, calculateDays, downloadCSV } from '../utils';
import { Search, Plus, Download, AlertCircle, CheckSquare, Square, LogOut, CalendarClock, Briefcase } from 'lucide-react';
import PatientFormModal from './PatientFormModal';
import PatientDetail from './PatientDetail';

export default function Census() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "patients"), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
        setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const getCardStyle = (p) => {
      if (p.preDischarge) return "bg-purple-100 border-l-4 border-purple-600";
      const isUro = p.service === 'URO';
      if (p.dailyCheck) return isUro ? "bg-blue-50 border-l-4 border-blue-600" : "bg-green-50 border-l-4 border-green-600";
      return isUro ? "bg-red-50 border-l-4 border-red-500" : "bg-orange-50 border-l-4 border-orange-500";
  };

  const handleExport = () => {
      const data = patients.map(p => [
          getLocalISODate(), p.bedNumber, p.service, p.name, p.reentry?'SI':'NO', 
          calculateDays(p.admissionDate), p.diagnosis, p.surgery||'N/A', 
          p.antecedents?.other||'', p.meds||'', p.lastLabs||'', p.lastUro||''
      ]);
      downloadCSV(data, ["Fecha","Cama","Servicio","Nombre","Reingreso","Dias","Dx","Cx","Ant","Meds","Labs","Uro"], "Censo.csv");
  };

  const quickAction = async (e, id, field, value) => {
      e.stopPropagation();
      await updateDoc(doc(db, "patients", id), { [field]: value });
  };

  const sendToProg = async (e, p) => {
      e.stopPropagation();
      const date = prompt("Fecha de Cirugía (YYYY-MM-DD) o dejar vacío para Urgencia:", getLocalISODate());
      if (date !== null) {
         await updateDoc(doc(db, "patients", p.id), { scheduledDate: date, isUrgent: date === '' });
      }
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.bedNumber.includes(search));

  if (selectedPatient) return <PatientDetail patient={selectedPatient} onClose={()=>setSelectedPatient(null)} />;

  return (
    <div className="pb-24">
      <div className="bg-white p-3 rounded-xl shadow-sm border mb-4 flex gap-2 sticky top-0 z-10">
          <div className="flex-1 flex items-center bg-slate-100 rounded-lg px-3">
              <Search size={18} className="text-slate-400"/>
              <input className="w-full bg-transparent p-2 outline-none text-sm" placeholder="Buscar paciente..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button onClick={handleExport} className="bg-emerald-600 text-white p-2.5 rounded-lg"><Download size={20}/></button>
      </div>

      <div className="space-y-3">
          {filtered.map(p => (
              <div key={p.id} onClick={()=>setSelectedPatient(p)} className={`p-4 rounded-xl shadow-sm relative transition active:scale-[0.98] ${getCardStyle(p)}`}>
                  <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm ${p.bedNumber==='AMB'?'bg-yellow-400 text-black':'bg-slate-800 text-white'}`}>{p.bedNumber}</span>
                             <span className="text-[10px] font-bold text-slate-500">{p.service}</span>
                             {p.reentry && <div className="bg-black text-white text-[9px] font-bold px-1 rounded">REINGRESO</div>}
                          </div>
                          <h3 className="font-black text-lg leading-tight uppercase text-slate-800 flex items-center gap-2">
                              {p.name}
                              {p.checklist?.some(t=>!t.done) && <AlertCircle size={16} className="text-yellow-600 fill-yellow-100"/>}
                          </h3>
                          <div className="text-xs font-medium text-slate-600 mt-1 space-y-0.5">
                              <p>{calculateAge(p.dob)} años • {p.diagnosis}</p>
                              {p.surgery && <p className="text-blue-600 font-bold">Cx: {p.surgery}</p>}
                              <p className="opacity-70">Estancia: {calculateDays(p.admissionDate)} días</p>
                          </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 pl-2 border-l border-slate-300/30">
                          <button onClick={(e)=>quickAction(e, p.id, 'dailyCheck', !p.dailyCheck)}>
                              {p.dailyCheck ? <CheckSquare size={26} className="text-blue-600"/> : <Square size={26} className="text-slate-300 hover:text-red-400"/>}
                          </button>
                          <div className="flex flex-col gap-2">
                              <button onClick={(e)=>sendToProg(e,p)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded-full"><CalendarClock size={16}/></button>
                              <button onClick={(e)=>quickAction(e,p.id,'preDischarge',!p.preDischarge)} className={`p-1.5 rounded-full ${p.preDischarge?'bg-purple-600 text-white':'bg-purple-100 text-purple-700'}`}><Briefcase size={16}/></button>
                              <button onClick={(e)=>{e.stopPropagation();if(confirm("¿Egresar paciente?")) quickAction(e,p.id,'status','discharged')}} className="p-1.5 bg-slate-200 text-slate-600 rounded-full"><LogOut size={16}/></button>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      <button onClick={()=>setShowModal(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-50"><Plus size={28}/></button>
      {showModal && <PatientFormModal onClose={()=>setShowModal(false)} mode="create" />}
    </div>
  );
}
