import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { SERVICES } from '../constants';
import { X } from 'lucide-react';

export default function PatientFormModal({ onClose, initialData, status = "active" }) {
  const [form, setForm] = useState(initialData || {
    name: '', dob: '', bedNumber: '', service: 'URO', diagnosis: '', surgery: '',
    status: status, admissionDate: new Date().toISOString(), isReentry: false,
    antecedents: { dm: false, has: false, hipo: false, onco: false, other: '' },
    meds: '', sxPrev: '', allergies: '', checklist: [], notes: []
  });

  const save = async (e) => {
    e.preventDefault();
    if (initialData) await updateDoc(doc(db, 'patients', initialData.id), form);
    else await addDoc(collection(db, 'patients'), form);
    onClose();
  };

  const inputClass = "w-full p-2.5 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mb-3";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400"><X/></button>
        <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Paciente</h2>
        <form onSubmit={save}>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
          <input required className={inputClass} value={form.name} onChange={e=>setForm({...form, name:e.target.value.toUpperCase()})} />
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nacimiento</label>
              <input type="date" required className={inputClass} value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cama / AMB</label>
              <input required className={inputClass} value={form.bedNumber} onChange={e=>setForm({...form, bedNumber:e.target.value.toUpperCase()})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Servicio</label>
              <select className={inputClass} value={form.service} onChange={e=>setForm({...form, service:e.target.value})}>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" checked={form.isReentry} onChange={e=>setForm({...form, isReentry:e.target.checked})}/>
              <span className="text-xs font-bold uppercase">¿Es Reingreso?</span>
            </div>
          </div>

          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Diagnóstico</label>
          <textarea required className={inputClass} value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} />

          <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl mt-4 uppercase">Guardar Paciente</button>
        </form>
      </div>
    </div>
  );
}
