import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { Undo } from 'lucide-react';

export default function Discharges() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'patients'), where('status', '==', 'discharged'));
    return onSnapshot(q, (s) => setList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const reactivate = async (id) => {
    if(confirm("¿Reingresar al censo?")) await updateDoc(doc(db, 'patients', id), { status: 'active', dischargeDate: null });
  };

  return (
    <div>
      <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Historial de Egresos</h2>
      <div className="grid gap-2">
        {list.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center shadow-sm border dark:border-slate-800">
            <div>
              <p className="font-black uppercase tracking-tight">{p.name}</p>
              <p className="text-[10px] font-bold text-slate-500">Egreso: {p.dischargeDate}</p>
            </div>
            <button onClick={()=>reactivate(p.id)} className="text-blue-500 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Undo size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
