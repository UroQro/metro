import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { SERVICES, getLocalISODate } from '../utils';
import { X } from 'lucide-react';

export default function PatientFormModal({ onClose, mode, initialData, context }) {
  const [form, setForm] = useState(initialData || {
      name: '', dob: '', phone: '', bedNumber: '', service: 'URO', 
      diagnosis: '', surgery: '', meds: '', allergies: '',
      reentry: false, status: context === 'prog' ? 'pre_admission' : 'active',
      admissionDate: getLocalISODate(), scheduledDate: '', isUrgent: false,
      antecedents: { dm: false, has: false, hipo: false, onco: false, other: '' },
      checklist: []
  });

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          if (mode === 'create') await addDoc(collection(db, "patients"), form);
          else await updateDoc(doc(db, "patients", form.id), form);
          onClose();
      } catch (err) { alert(err.message); }
  };

  const toggleAnt = (k) => setForm({...form, antecedents: {...form.antecedents, [k]: !form.antecedents[k]}});
  const inputClass = "w-full border rounded p-2 text-sm bg-white focus:ring-2 ring-blue-500 outline-none";
  const labelClass = "text-[10px] font-black uppercase text-slate-400 ml-1";

  return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-5 shadow-2xl relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X/></button>
              <h2 className="text-xl font-black mb-4 uppercase">{mode==='create'?'Nuevo Paciente':'Editar Paciente'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                      <div><label className={labelClass}>Nombre Completo</label><input required className={inputClass} value={form.name} onChange={e=>setForm({...form, name:e.target.value.toUpperCase()})}/></div>
                      <div><label className={labelClass}>Cama</label><input required className={inputClass} value={form.bedNumber} placeholder="304/AMB" onChange={e=>setForm({...form, bedNumber:e.target.value.toUpperCase()})}/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <div><label className={labelClass}>Fecha Nacimiento</label><input type="date" required className={inputClass} value={form.dob} onChange={e=>setForm({...form, dob:e.target.value})}/></div>
                      <div><label className={labelClass}>Teléfono</label><input type="tel" className={inputClass} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <div>
                          <label className={labelClass}>Servicio Tratante</label>
                          <select className={inputClass} value={form.service} onChange={e=>setForm({...form, service:e.target.value})}>
                              {SERVICES.map(s=><option key={s}>{s}</option>)}
                          </select>
                      </div>
                      <div className="flex items-center gap-2 pt-5 px-2">
                          <input type="checkbox" className="w-5 h-5" checked={form.reentry} onChange={e=>setForm({...form, reentry:e.target.checked})}/>
                          <span className="font-bold text-xs">ES REINGRESO</span>
                      </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                      <label className={labelClass}>Antecedentes</label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                          {['dm','has','hipo','onco'].map(k => (
                              <label key={k} className="flex items-center gap-1 text-xs font-bold uppercase"><input type="checkbox" checked={form.antecedents?.[k]||false} onChange={()=>toggleAnt(k)}/> {k}</label>
                          ))}
                      </div>
                      <input className={`${inputClass} mb-2 text-xs`} placeholder="Otros antecedentes..." value={form.antecedents?.other||''} onChange={e=>setForm({...form, antecedents:{...form.antecedents, other:e.target.value}})} />
                      <input className={`${inputClass} text-xs border-red-200 bg-red-50`} placeholder="ALERGIAS" value={form.allergies} onChange={e=>setForm({...form, allergies:e.target.value})} />
                  </div>

                  <div><label className={labelClass}>Diagnóstico</label><textarea rows="2" className={inputClass} value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} /></div>
                  <div><label className={labelClass}>Cirugía Realizada / A Realizar</label><input className={inputClass} value={form.surgery} onChange={e=>setForm({...form, surgery:e.target.value})} /></div>
                  <div><label className={labelClass}>Medicamentos Habituales</label><input className={inputClass} value={form.meds} onChange={e=>setForm({...form, meds:e.target.value})} /></div>

                  {context === 'prog' && (
                      <div><label className={labelClass}>Fecha Programada (Vacío = Urgencia)</label><input type="date" className={inputClass} value={form.scheduledDate} onChange={e=>setForm({...form, scheduledDate:e.target.value})} /></div>
                  )}

                  <button className="w-full bg-blue-600 text-white font-black py-3 rounded-lg shadow-lg uppercase mt-4">Guardar</button>
              </form>
          </div>
      </div>
  );
}
