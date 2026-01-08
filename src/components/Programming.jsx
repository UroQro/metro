import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { getTodayStr, downloadCSV, calculateAge } from '../utils';
import { Calendar, Trash2, CheckCircle, Clock } from 'lucide-react';
import PatientFormModal from './PatientFormModal';

export default function Programming() {
  const [list, setList] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const today = getTodayStr();

  useEffect(() => {
    const q = query(collection(db, 'patients'), where('scheduledDate', '!=', ''));
    return onSnapshot(q, (s) => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const urgent = list.filter(p => p.isUrgent && !p.surgeryPerformed);
  const scheduled = list.filter(p => !p.isUrgent && p.scheduledDate).sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const markPerformed = async (p) => {
    await updateDoc(doc(db, 'patients', p.id), { surgeryPerformed: true });
    alert("Cirugía marcada como realizada.");
  };

  const Card = ({ p }) => (
    <div className={`p-4 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm mb-3 transition ${p.scheduledDate > today ? 'opacity-75' : 'opacity-100 border-blue-500'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex gap-2 items-center mb-1">
            <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase">{p.scheduledDate || 'URGENCIA'}</span>
            <span className="font-bold text-blue-500 text-xs">{p.bedNumber}</span>
          </div>
          <h3 className="font-black text-lg uppercase tracking-tight">{p.name}</h3>
          <p className="text-xs font-bold text-slate-500">{calculateAge(p.dob)} años</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-2">CX: {p.surgery || p.diagnosis}</p>
        </div>
        <button onClick={()=>markPerformed(p)} className={p.surgeryPerformed ? 'text-green-500' : 'text-slate-300'}><CheckCircle size={28}/></button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-tighter">Programación</h2>
        <button onClick={()=>setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase">+ Agendar</button>
      </div>

      <section className="mb-8">
        <h4 className="text-[10px] font-black text-red-500 mb-3 tracking-widest uppercase flex items-center gap-1"><Clock size={12}/> Urgencias</h4>
        {urgent.map(p => <Card key={p.id} p={p}/>)}
      </section>

      <section>
        <h4 className="text-[10px] font-black text-slate-400 mb-3 tracking-widest uppercase flex items-center gap-1"><Calendar size={12}/> Programados</h4>
        {scheduled.map(p => <Card key={p.id} p={p}/>)}
      </section>

      {showAdd && <PatientFormModal onClose={()=>setShowAdd(false)} status="pre_admission" />}
    </div>
  );
}
