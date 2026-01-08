import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { calculateAge, calculateDays } from '../utils';
import { ArrowLeft, Plus, Copy, Trash2, ExternalLink } from 'lucide-react';

export default function PatientDetail({ patient, onClose }) {
  const [noteType, setNoteType] = useState('visita');
  const [newNote, setNewNote] = useState({});
  const [task, setTask] = useState('');

  const saveNote = async () => {
    const author = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
    const note = { 
      id: Date.now(), 
      type: noteType, 
      author, 
      date: new Date().toISOString(), 
      content: newNote 
    };
    await updateDoc(doc(db, 'patients', patient.id), { notes: arrayUnion(note) });
    setNewNote({});
    alert("Nota guardada");
  };

  const copyToClip = (note) => {
    const text = `EVOLUCIÓN UROLOGÍA - ${patient.name}\nSV: TA ${note.content.ta} FC ${note.content.fc} T ${note.content.temp}\nPLAN: ${note.content.plan}`;
    navigator.clipboard.writeText(text);
    alert("Copiado");
  };

  const addTask = async () => {
    if(!task) return;
    const newList = [...(patient.checklist || []), { text: task, done: false }];
    await updateDoc(doc(db, 'patients', patient.id), { checklist: newList });
    setTask('');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 flex items-center gap-4 border-b dark:border-slate-800 z-50">
        <button onClick={onClose}><ArrowLeft/></button>
        <div>
          <h2 className="font-black uppercase text-lg leading-none">{patient.name}</h2>
          <p className="text-[10px] font-bold text-slate-500">{patient.bedNumber} • {patient.service}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Identificación */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border dark:border-slate-800">
           <h3 className="text-[10px] font-black text-blue-500 uppercase mb-3">Identificación</h3>
           <div className="grid grid-cols-2 gap-4 text-xs">
              <p><b>EDAD:</b> {calculateAge(patient.dob)}a</p>
              <p><b>INGRESO:</b> {patient.admissionDate?.slice(0,10)}</p>
           </div>
           <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
             <p className="text-[10px] font-bold text-slate-400">ANTECEDENTES</p>
             <p className="text-xs">{patient.diagnosis}</p>
           </div>
        </div>

        {/* Pendientes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-3xl border border-yellow-200 dark:border-yellow-900/30">
          <h3 className="text-[10px] font-black text-yellow-600 uppercase mb-3">Pendientes</h3>
          {patient.checklist?.map((t,i) => (
            <div key={i} className="flex gap-2 items-center mb-1 text-sm">
              <input type="checkbox" checked={t.done} onChange={async ()=>{
                const nl = [...patient.checklist]; nl[i].done = !nl[i].done;
                await updateDoc(doc(db,'patients',patient.id), {checklist: nl});
              }}/>
              <span className={t.done ? 'line-through text-slate-400' : ''}>{t.text}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <input className="flex-1 p-2 rounded-lg text-xs dark:bg-slate-800 border-none" placeholder="Nuevo pendiente..." value={task} onChange={e=>setTask(e.target.value)}/>
            <button onClick={addTask} className="bg-yellow-500 p-2 rounded-lg text-white"><Plus size={16}/></button>
          </div>
        </div>

        {/* Creador de Notas */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-xl">
          <select className="w-full mb-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold" value={noteType} onChange={e=>setNoteType(e.target.value)}>
            <option value="visita">VISITA DIARIA</option>
            <option value="labs">LABORATORIOS</option>
            <option value="sonda">COLOCACIÓN SONDA</option>
            <option value="antibiotico">ANTIBIÓTICO</option>
            <option value="imagen">IMAGEN (URL)</option>
            <option value="vpo">VPO</option>
          </select>

          {noteType === 'visita' && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="TA" className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs" onChange={e=>setNewNote({...newNote, ta:e.target.value})}/>
                <input placeholder="FC" className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs" onChange={e=>setNewNote({...newNote, fc:e.target.value})}/>
                <input placeholder="TEMP" className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs" onChange={e=>setNewNote({...newNote, temp:e.target.value})}/>
              </div>
              <textarea placeholder="Subjetivo" className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs" onChange={e=>setNewNote({...newNote, subj:e.target.value})}/>
              <textarea placeholder="Análisis y Plan" className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs" onChange={e=>setNewNote({...newNote, plan:e.target.value})}/>
            </div>
          )}

          {noteType === 'sonda' && (
            <input type="date" className="w-full p-2 bg-slate-50 rounded" onChange={e=>setNewNote({...newNote, date:e.target.value})}/>
          )}

          {noteType === 'imagen' && (
            <input placeholder="URL de imagen" className="w-full p-2 bg-slate-50 rounded" onChange={e=>setNewNote({...newNote, url:e.target.value})}/>
          )}

          <button onClick={saveNote} className="w-full bg-slate-900 text-white p-3 rounded-2xl mt-4 font-bold uppercase text-xs">Guardar Nota</button>
        </div>

        {/* Listado de Notas */}
        <div className="space-y-4">
          {patient.notes?.slice().reverse().map(n => (
            <div key={n.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border dark:border-slate-800">
               <div className="flex justify-between items-center mb-2 border-b dark:border-slate-800 pb-2">
                 <span className="text-[10px] font-black uppercase text-blue-500">{n.type}</span>
                 <div className="flex gap-3">
                   {n.type === 'visita' && <button onClick={()=>copyToClip(n)} className="text-slate-400"><Copy size={14}/></button>}
                   <span className="text-[10px] text-slate-400 font-bold">{n.author}</span>
                 </div>
               </div>
               
               {n.type === 'visita' && (
                 <div className="text-xs space-y-1">
                   <p><b>S:</b> {n.content.subj}</p>
                   <p className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-blue-500 font-mono">TA: {n.content.ta} | FC: {n.content.fc} | T: {n.content.temp}</p>
                   <p><b>P:</b> {n.content.plan}</p>
                 </div>
               )}

               {n.type === 'sonda' && (
                 <p className="text-xs">Sonda colocada el {n.content.date}. <b>Días: {calculateDays(n.content.date)}</b></p>
               )}

               {n.type === 'imagen' && (
                 <a href={n.content.url} target="_blank" className="flex items-center gap-2 bg-blue-600 text-white p-2 rounded text-xs font-bold uppercase justify-center">Ver Imagen <ExternalLink size={14}/></a>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
