import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { calculateAge, calculateDays, downloadCSV } from '../utils';
import { Plus, Search, AlertCircle, Download, UserPlus } from 'lucide-react';
import PatientDetail from './PatientDetail';
import PatientFormModal from './PatientFormModal';

export default function Census() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'patients'), where('status', '==', 'active'));
    return onSnapshot(q, (s) => setPatients(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const getStyle = (p) => {
    if (p.preDischarge) return "bg-purple-100 dark:bg-purple-900/30 border-purple-500";
    const isUro = p.service === 'URO';
    if (p.dailyCheck) return isUro ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" : "bg-green-50 dark:bg-green-900/20 border-green-500";
    return isUro ? "bg-red-50 dark:bg-red-900/20 border-red-500" : "bg-orange-50 dark:bg-orange-900/20 border-orange-500";
  };

  const handleExport = () => {
    const data = patients.map(p => [
      p.bedNumber, p.service, p.name, p.isReentry ? 'SI' : 'NO', 
      calculateDays(p.admissionDate), p.diagnosis, p.surgery || '', 
      p.antecedents?.other || '', p.meds || ''
    ]);
    downloadCSV(data, ["Cama", "Servicio", "Nombre", "Reingreso", "Dias", "Diagnostico", "Cirugia", "Antecedentes", "Medicamentos"], "Censo_UroMETRO.csv");
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.bedNumber.includes(search));

  if (selected) return <PatientDetail patient={selected} onClose={()=>setSelected(null)} />;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl flex items-center px-3 border border-slate-200 dark:border-slate-700">
          <Search size={18} className="text-slate-400 mr-2"/>
          <input className="w-full bg-transparent py-3 text-sm outline-none" placeholder="Buscar cama o nombre..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button onClick={handleExport} className="bg-emerald-600 text-white p-3 rounded-xl"><Download size={20}/></button>
      </div>

      <div className="grid gap-3">
        {filtered.map(p => (
          <div key={p.id} onClick={()=>setSelected(p)} className={`p-4 rounded-2xl border-l-[8px] shadow-sm relative transition active:scale-95 ${getStyle(p)}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.bedNumber==='AMB' ? 'bg-yellow-500 text-black' : 'bg-slate-900 text-white'}`}>{p.bedNumber}</span>
                  <span className="font-black text-slate-500 text-xs">{p.service}</span>
                  {p.isReentry && <div className="w-3 h-3 bg-black rounded-sm" title="Reingreso"></div>}
                </div>
                <h3 className="font-bold text-lg leading-tight uppercase tracking-tighter">{p.name}</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{calculateAge(p.dob)} años • {p.diagnosis}</p>
                <p className="text-[10px] mt-2 font-bold text-slate-500 uppercase">{calculateDays(p.admissionDate)} días de estancia</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <input type="checkbox" checked={p.dailyCheck} onClick={e=>e.stopPropagation()} onChange={async ()=>await updateDoc(doc(db,'patients',p.id), {dailyCheck: !p.dailyCheck})} className="w-6 h-6 rounded-lg"/>
                {p.checklist?.some(t=>!t.done) && <AlertCircle size={20} className="text-yellow-500 fill-yellow-500/20"/>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={()=>setShowAdd(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-50"><Plus size={32}/></button>
      {showAdd && <PatientFormModal onClose={()=>setShowAdd(false)} status="active" />}
    </div>
  );
}
