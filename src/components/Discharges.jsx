import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { Undo, Download, Search } from 'lucide-react';
import { downloadCSV } from '../utils';
import PatientDetail from './PatientDetail';

export default function Discharges() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'patients'), where('status', '==', 'discharged'));
    return onSnapshot(q, (s) => setList(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>new Date(b.dischargeDate)-new Date(a.dischargeDate))));
  }, []);

  const undo = async (e, id) => {
      e.stopPropagation();
      if(confirm("¿Reingresar al censo?")) await updateDoc(doc(db, 'patients', id), { status: 'active', dischargeDate: null });
  };

  const exportAll = () => {
      if(list.length===0) return;
      const data = list.map(p => [p.name, p.diagnosis, p.category, p.admissionDate, p.dischargeDate, p.surgery]);
      downloadCSV(data, ["Nombre","Dx","Categoria","Ingreso","Egreso","Cx"], "Historial_Egresos.csv");
  };

  const filtered = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.diagnosis.toLowerCase().includes(search.toLowerCase()));

  if(selected) return <PatientDetail patient={selected} onClose={()=>setSelected(null)}/>;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-black text-xl uppercase">Egresos</h2>
            <button onClick={exportAll} className="bg-green-600 text-white p-2 rounded-lg"><Download size={18}/></button>
        </div>
        
        <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Search size={18} className="text-slate-400 mr-2"/>
            <input className="w-full bg-transparent outline-none text-sm" placeholder="Buscar egreso..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        <div className="space-y-2">
            {filtered.map(p => (
                <div key={p.id} onClick={()=>setSelected(p)} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center opacity-75 hover:opacity-100 transition">
                    <div>
                        <p className="font-bold text-sm uppercase">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.dischargeDate} • {p.diagnosis}</p>
                    </div>
                    <button onClick={(e)=>undo(e,p.id)} className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Undo size={18}/></button>
                </div>
            ))}
        </div>
    </div>
  );
}
