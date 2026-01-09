import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { getLocalISODate, calculateAge } from '../utils';
import { CheckCircle, Clock, Calendar, Plus, Search, Edit2 } from 'lucide-react';
import PatientDetail from './PatientDetail';
import PatientFormModal from './PatientFormModal';

export default function Programming() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingProg, setEditingProg] = useState(null);
  const today = getLocalISODate();

  useEffect(() => {
    const q = query(collection(db, 'patients'), where('scheduledDate', '!=', null));
    return onSnapshot(q, (s) => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const toggleSx = async (e, p) => {
      e.stopPropagation();
      await updateDoc(doc(db, 'patients', p.id), { surgeryPerformed: !p.surgeryPerformed });
  };

  const handlePato = async (e, p) => {
      e.stopPropagation();
      const piece = prompt("Pieza Enviada a Patología:");
      if(!piece) return;
      await addDoc(collection(db, 'pathology'), {
          patientId: p.id,
          name: p.name,
          fileNumber: p.fileNumber || '000000',
          date: p.scheduledDate || today,
          diagnosis: p.diagnosis,
          specimen: piece
      });
      alert("Agregado a Base Pato");
  };

  const handleJJ = async (e, p) => {
      e.stopPropagation();
      const side = prompt("Lado del Catéter (Izq/Der/Bil):");
      if(!side) return;
      await addDoc(collection(db, 'jjs'), {
          patientId: p.id,
          name: p.name,
          fileNumber: p.fileNumber || '000000',
          date: p.scheduledDate || today,
          diagnosis: p.diagnosis,
          side: side
      });
      alert("Agregado a Base JJs");
  };

  const Card = ({ p, urgent }) => (
    <div onClick={()=>setSelected(p)} className={`p-3 rounded-lg border bg-white shadow-sm mb-2 flex flex-col gap-2 ${p.scheduledDate > today && !urgent ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-xs bg-slate-100 px-1 rounded">{p.bedNumber}</span>
                   <span className="text-[10px] font-bold text-slate-400">{urgent ? 'URGENCIA' : `${p.scheduledDate} ${p.surgeryTime||'00:00'}`}</span>
                </div>
                <p className="font-black uppercase text-sm">{p.surgery || p.diagnosis}</p>
                <p className="text-xs">{p.name} ({calculateAge(p.dob)}a)</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
                <button onClick={(e)=>toggleSx(e,p)} className={`p-2 rounded-full ${p.surgeryPerformed ? 'text-green-500 bg-green-50' : 'text-slate-300 bg-slate-50'}`}><CheckCircle/></button>
                <button onClick={(e)=>{e.stopPropagation(); setEditingProg(p);}} className="text-blue-400 p-1"><Edit2 size={16}/></button>
            </div>
        </div>
        <div className="flex gap-2 border-t pt-2">
            <button onClick={(e)=>handlePato(e,p)} className="flex-1 bg-pink-50 text-pink-600 text-[10px] font-bold py-1 rounded border border-pink-100">PATO</button>
            <button onClick={(e)=>handleJJ(e,p)} className="flex-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold py-1 rounded border border-indigo-100">JJ</button>
        </div>
    </div>
  );

  const filtered = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.surgery.toLowerCase().includes(search.toLowerCase()));
  const urgencies = filtered.filter(p => p.isUrgent && !p.surgeryPerformed);
  const scheduled = filtered.filter(p => !p.isUrgent && p.scheduledDate).sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate) || (a.surgeryTime||'00:00').localeCompare(b.surgeryTime||'00:00'));

  if(selected) return <PatientDetail patient={selected} onClose={()=>setSelected(null)}/>;

  return (
    <div className="pb-24">
       <div className="flex justify-between items-center mb-4 gap-2">
           <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-1.5 shadow-sm border">
               <Search size={16} className="text-slate-400 mr-2"/>
               <input className="w-full bg-transparent outline-none text-xs" placeholder="Buscar cirugía..." value={search} onChange={e=>setSearch(e.target.value)}/>
           </div>
           <button onClick={()=>setShowAdd(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1"><Plus size={14}/> Agendar</button>
       </div>

       <div className="mb-6">
           <h3 className="text-xs font-black text-red-500 uppercase mb-2 flex items-center gap-1"><Clock size={14}/> Urgencias Pendientes</h3>
           {urgencies.map(p => <Card key={p.id} p={p} urgent />)}
       </div>

       <div>
           <h3 className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1"><Calendar size={14}/> Programación</h3>
           {scheduled.map(p => <Card key={p.id} p={p} />)}
       </div>
       
       {showAdd && <PatientFormModal onClose={()=>setShowAdd(false)} mode="create" context="prog" />}
       {editingProg && <PatientFormModal onClose={()=>setEditingProg(null)} mode="edit" initialData={editingProg} context="prog" />}
    </div>
  );
}
