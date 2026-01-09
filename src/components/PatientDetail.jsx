import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { calculateAge, calculateDays, getLocalISODate, SERVICES } from '../utils';
import { ArrowLeft, Save, Plus, Trash2, Edit, Copy, CheckSquare, Square, LogOut, Syringe } from 'lucide-react';
import PatientFormModal from './PatientFormModal';

// COMPONENTE EXTERNO PARA EVITAR PERDIDA DE FOCO
const NoteInput = ({ label, k, form, setForm, ph = "..." }) => (
  <div className="flex flex-col">
    <label className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">{label}</label>
    <input 
        className="w-full border rounded p-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none transition" 
        placeholder={ph} 
        value={form[k] || ''} 
        onChange={e => setForm({...form, [k]: e.target.value})} 
    />
  </div>
);

export default function PatientDetail({ patient: initialP, onClose }) {
  const [p, setP] = useState(initialP);
  const [showEdit, setShowEdit] = useState(false);
  
  // NOTE STATE
  const [noteType, setNoteType] = useState('visita');
  const [note, setNote] = useState({});
  const [editingNoteId, setEditingNoteId] = useState(null); 
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
     const unsub = onSnapshot(doc(db, "patients", initialP.id), (d) => {
         if(d.exists()) setP({id:d.id, ...d.data()});
     });
     return () => unsub();
  }, [initialP.id]);

  useEffect(() => {
      if(!editingNoteId) setNote({});
  }, [noteType]);

  const saveNote = async () => {
     if(Object.keys(note).length === 0) return alert("La nota está vacía");
     
     if (editingNoteId) {
         // ACTUALIZAR NOTA
         const updatedNotes = p.notes.map(n => 
            n.id === editingNoteId ? { ...n, content: note, type: noteType } : n
         );
         await updateDoc(doc(db, "patients", p.id), { notes: updatedNotes });
         setEditingNoteId(null);
         alert("Nota Actualizada");
     } else {
         // NUEVA NOTA
         const newNote = {
             id: Date.now(), type: noteType, 
             author: auth.currentUser.displayName, 
             date: new Date().toISOString(), 
             content: note
         };
         await updateDoc(doc(db, "patients", p.id), { notes: arrayUnion(newNote) });
     }

     // Helpers para CSV y Exportación
     if(noteType === 'labs') await updateDoc(doc(db, "patients", p.id), { lastLabs: JSON.stringify(note) });
     if(noteType === 'uro') await updateDoc(doc(db, "patients", p.id), { lastUro: note.res === '+' ? `${note.germ} (${note.sens})` : 'Negativo' });
     if(noteType === 'visita' && !editingNoteId) {
         const miniLabs = { hb: note.hb, leu: note.leu, cr: note.cr };
         await updateDoc(doc(db, "patients", p.id), { lastLabs: JSON.stringify(miniLabs) });
     }
     
     setNote({});
  };

  const startEditNote = (n) => {
      setNoteType(n.type);
      setNote(n.content);
      setEditingNoteId(n.id);
      document.getElementById('note-creator').scrollIntoView({ behavior: 'smooth' });
  };

  const toggleCheck = async (idx) => {
      const nl = [...(p.checklist||[])]; nl[idx].done = !nl[idx].done;
      await updateDoc(doc(db, "patients", p.id), { checklist: nl });
  };
  
  const addTask = async () => {
      if(!newTask) return;
      await updateDoc(doc(db, "patients", p.id), { checklist: arrayUnion({text:newTask, done:false}) });
      setNewTask('');
  };

  const copyVisita = (n) => {
      const t = `*EVOLUCIÓN UROLOGÍA*\n*S:* ${n.subj||'-'}\n*SV:* TA:${n.ta} FC:${n.fc} T:${n.temp}\n*GU:* ${n.gu}ml | *DREN:* ${n.dren||'-'}\n*LABS:* Hb:${n.hb} Leu:${n.leu} Plt:${n.plt} Glu:${n.glu} Cr:${n.cr}\n*PLAN:* ${n.plan}`;
      navigator.clipboard.writeText(t); alert("Copiado");
  };

  const discharge = async () => {
      if(confirm("¿Confirmar Egreso?")) await updateDoc(doc(db, "patients", p.id), { status: 'discharged', dischargeDate: getLocalISODate() });
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-20">
       <div className="bg-white p-3 sticky top-0 z-30 shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3">
               <button onClick={onClose}><ArrowLeft className="text-slate-500"/></button>
               <div>
                   <h2 className="font-black text-lg leading-none uppercase">{p.name}</h2>
                   <p className="text-xs text-slate-500">{p.bedNumber} • {calculateAge(p.dob)}a • {p.service}</p>
               </div>
           </div>
           <div className="flex gap-2">
               <button onClick={discharge} className="bg-red-50 text-red-500 p-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-100"><LogOut size={14}/> EGRESAR</button>
               <button onClick={()=>setShowEdit(true)} className="bg-blue-50 text-blue-500 p-2 rounded-lg border border-blue-100 flex items-center gap-1"><Edit size={16}/> EDITAR DATOS</button>
           </div>
       </div>

       <div className="p-3 space-y-4">
           {/* FICHA CLINICA */}
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
               <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                   <div><span className="font-bold text-slate-400 block text-[10px]">DIAGNÓSTICO</span>{p.diagnosis}</div>
                   <div><span className="font-bold text-slate-400 block text-[10px]">CIRUGÍA</span>{p.surgery}</div>
                   <div><span className="font-bold text-slate-400 block text-[10px]">ANTECEDENTES</span>
                       <div className="flex flex-wrap gap-1 mt-1">
                           {p.antecedents?.dm && <span className="px-1 bg-red-100 text-red-800 rounded font-bold">DM</span>}
                           {p.antecedents?.has && <span className="px-1 bg-orange-100 text-orange-800 rounded font-bold">HAS</span>}
                           {p.antecedents?.hipo && <span className="px-1 bg-blue-100 text-blue-800 rounded font-bold">HIPO</span>}
                           {p.antecedents?.onco && <span className="px-1 bg-purple-100 text-purple-800 rounded font-bold">ONCO</span>}
                       </div>
                       <p className="mt-1">{p.antecedents?.other}</p>
                   </div>
                   <div><span className="font-bold text-slate-400 block text-[10px]">ALERGIAS</span><span className="text-red-600 font-bold">{p.allergies}</span></div>
                   <div className="col-span-2"><span className="font-bold text-slate-400 block text-[10px]">MEDICAMENTOS HABITUALES</span>{p.meds}</div>
               </div>
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                   <h3 className="text-[10px] font-black text-yellow-600 uppercase mb-2">Checklist Pendientes</h3>
                   {p.checklist?.map((t,i)=>(
                       <div key={i} className="flex gap-2 items-center mb-1"><input type="checkbox" checked={t.done} onChange={()=>toggleCheck(i)}/><span className={`text-sm ${t.done?'line-through text-slate-400':''}`}>{t.text}</span></div>
                   ))}
                   <div className="flex gap-2 mt-2"><input className="flex-1 text-xs p-1.5 rounded border" placeholder="Nuevo pendiente..." value={newTask} onChange={e=>setNewTask(e.target.value)}/><button onClick={addTask} className="bg-yellow-500 text-white p-1.5 rounded"><Plus size={16}/></button></div>
               </div>
           </div>

           {/* CREADOR DE NOTAS */}
           <div id="note-creator" className={`bg-white p-4 rounded-xl shadow-lg border-2 transition ${editingNoteId ? 'border-orange-400 ring-2 ring-orange-100' : 'border-blue-100'}`}>
               <div className="flex justify-between items-center mb-3">
                   <h3 className={`text-xs font-black uppercase ${editingNoteId ? 'text-orange-500' : 'text-blue-500'}`}>
                       {editingNoteId ? 'EDITANDO NOTA...' : 'NUEVA NOTA'}
                   </h3>
                   {editingNoteId && <button onClick={()=>{setEditingNoteId(null); setNote({});}} className="text-xs text-slate-400 underline">Cancelar Edición</button>}
               </div>

               <select className="w-full mb-3 p-2 rounded border bg-slate-50 text-sm font-bold" value={noteType} onChange={e=>{setNoteType(e.target.value); setNote({})}}>
                   <option value="visita">VISITA DIARIA (SOAP)</option>
                   <option value="inter">REPORTE INTERCONSULTA</option>
                   <option value="check_qx">CHECKLIST PRE-QX</option>
                   <option value="check_egreso">CHECKLIST EGRESO</option>
                   <option value="labs">LABORATORIOS</option>
                   <option value="sonda">SONDA / CATETER</option>
                   <option value="uro">UROCULTIVO</option>
                   <option value="abx">ANTIBIÓTICO</option>
                   <option value="vpo">VPO</option>
                   <option value="img">IMAGEN (URL)</option>
                   <option value="proc">PROCEDIMIENTO</option>
                   <option value="texto">NOTA LIBRE</option>
               </select>

               <div className="space-y-2 mb-3">
                   {noteType === 'visita' && <>
                       <textarea className="w-full p-2 border rounded text-xs" rows="2" placeholder="Subjetivo..." value={note.subj||''} onChange={e=>setNote({...note, subj:e.target.value})}/>
                       <div className="grid grid-cols-3 gap-2">
                           <NoteInput label="TA" k="ta" form={note} setForm={setNote}/> 
                           <NoteInput label="FC" k="fc" form={note} setForm={setNote}/> 
                           <NoteInput label="Temp" k="temp" form={note} setForm={setNote}/> 
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                           <NoteInput label="Gasto U (ml)" k="gu" form={note} setForm={setNote}/>
                           <NoteInput label="Drenaje (ml/tipo)" k="dren" form={note} setForm={setNote}/>
                       </div>
                       <div className="bg-slate-50 p-2 rounded border">
                           <p className="text-[9px] font-black text-slate-400 mb-1">LABORATORIOS COMPLETOS</p>
                           <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                               <NoteInput label="Hb" k="hb" form={note} setForm={setNote}/> 
                               <NoteInput label="Htc" k="htc" form={note} setForm={setNote}/> 
                               <NoteInput label="Leu" k="leu" form={note} setForm={setNote}/>
                               <NoteInput label="Plt" k="plt" form={note} setForm={setNote}/>
                               <NoteInput label="Glu" k="glu" form={note} setForm={setNote}/>
                           </div>
                           <div className="grid grid-cols-5 gap-1.5">
                               <NoteInput label="BUN" k="bun" form={note} setForm={setNote}/> 
                               <NoteInput label="Cr" k="cr" form={note} setForm={setNote}/>
                               <NoteInput label="Na" k="na" form={note} setForm={setNote}/> 
                               <NoteInput label="K" k="k" form={note} setForm={setNote}/> 
                               <NoteInput label="Cl" k="cl" form={note} setForm={setNote}/> 
                           </div>
                       </div>
                       <textarea className="w-full p-2 border rounded text-xs" rows="3" placeholder="Análisis y Plan..." value={note.plan||''} onChange={e=>setNote({...note, plan:e.target.value})}/>
                   </>}

                   {noteType === 'inter' && <div className="space-y-2">
                       <label className="text-xs font-bold block">Servicio Consultante</label>
                       <select className="w-full p-2 border rounded" value={note.service||''} onChange={e=>setNote({...note, service:e.target.value})}>
                           <option value="">Seleccionar...</option>
                           {SERVICES.map(s=><option key={s}>{s}</option>)}
                       </select>
                       <textarea className="w-full p-2 border rounded text-xs" rows="4" placeholder="Resumen de interconsulta..." value={note.text||''} onChange={e=>setNote({...note, text:e.target.value})}/>
                   </div>}

                   {noteType === 'check_qx' && <div className="space-y-1">
                       {['No Derechohabiencia','VPO','Labs','Cultivos','TAC','Pruebas Cruzadas','Hojas Consentimiento'].map(item=>(
                           <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={note[item]||false} onChange={e=>setNote({...note, [item]:e.target.checked})}/> {item}</label>
                       ))}
                   </div>}
                   
                   {noteType === 'check_egreso' && <div className="space-y-1">
                       {['Receta','Hojas de Egreso','Nota de Alta','Cita Abierta'].map(item=>(
                           <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={note[item]||false} onChange={e=>setNote({...note, [item]:e.target.checked})}/> {item}</label>
                       ))}
                   </div>}

                   {noteType === 'labs' && <div className="grid grid-cols-4 gap-2">
                       {['Hb','Htc','Leu','Plt','Glu','Urea','BUN','Cr','Na','K','Cl','TP','TTP','INR'].map(k=><NoteInput key={k} label={k} k={k} form={note} setForm={setNote}/>)}
                   </div>}

                   {(noteType === 'sonda' || noteType === 'abx') && <div className="space-y-2">
                       <label className="text-xs font-bold block">Fecha Inicio / Colocación</label>
                       <input type="date" className="w-full p-2 border rounded" value={note.date||''} onChange={e=>setNote({...note, date:e.target.value})}/>
                       {noteType === 'abx' && <NoteInput label="Medicamento" k="med" form={note} setForm={setNote} />}
                   </div>}

                   {noteType === 'uro' && <div className="space-y-2">
                       <select className="w-full p-2 border rounded" value={note.res||''} onChange={e=>setNote({...note, res:e.target.value})}><option>Resultado...</option><option value="+">Positivo (+)</option><option value="-">Negativo (-)</option></select>
                       {note.res==='+' && <><NoteInput label="Germen" k="germ" form={note} setForm={setNote}/><NoteInput label="Sensibilidad" k="sens" form={note} setForm={setNote}/></>}
                   </div>}

                   {(noteType === 'texto' || noteType === 'proc' || noteType === 'img' || noteType === 'vpo') && 
                       <textarea className="w-full p-2 border rounded text-xs" rows="3" placeholder="Detalles..." value={note.text||''} onChange={e=>setNote({...note, text:e.target.value})}/>
                   }
               </div>
               <button onClick={saveNote} className={`w-full text-white p-3 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2 ${editingNoteId ? 'bg-orange-500' : 'bg-slate-900'}`}>
                   <Save size={16}/> {editingNoteId ? 'ACTUALIZAR NOTA' : 'GUARDAR NOTA'}
               </button>
           </div>

           {/* HISTORIAL NOTAS */}
           <div className="space-y-3">
               {p.notes?.slice().reverse().map(n => (
                   <div key={n.id} className={`bg-white p-3 rounded-xl shadow-sm border ${editingNoteId === n.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                       <div className="flex justify-between items-center mb-2 border-b pb-1">
                           <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-500">{n.type}</span>
                           <div className="flex items-center gap-3">
                               <span className="text-[10px] text-slate-400">{n.date.slice(0,10)} • {n.author}</span>
                               <button onClick={()=>startEditNote(n)} className="text-blue-400 hover:text-blue-600 p-1 bg-blue-50 rounded"><Edit size={14}/></button>
                           </div>
                       </div>
                       <div className="text-sm text-slate-700">
                           {n.type === 'visita' && <div>
                               <p className="mb-1"><span className="font-bold">S:</span> {n.content.subj}</p>
                               <div className="bg-slate-50 p-2 rounded font-mono text-xs text-blue-800 mb-1">
                                   TA:{n.content.ta} FC:{n.content.fc} T:{n.content.temp} | GU:{n.content.gu} | D:{n.content.dren}
                               </div>
                               <div className="mb-1 text-[10px] text-slate-500">
                                   Labs: Hb:{n.content.hb} Leu:{n.content.leu} Plt:{n.content.plt} Cr:{n.content.cr} K:{n.content.k}
                               </div>
                               <p><span className="font-bold">P:</span> {n.content.plan}</p>
                               <button onClick={()=>copyVisita(n.content)} className="mt-2 text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-bold border border-green-100">COPIAR NOTA</button>
                           </div>}

                           {n.type === 'inter' && <div>
                               <p className="font-black text-blue-800 uppercase mb-1">IC: {n.content.service}</p>
                               <p>{n.content.text}</p>
                           </div>}
                           
                           {(n.type === 'sonda' || n.type === 'abx') && <div>
                               <p className="font-bold text-lg">{n.content.med || 'Sonda/Catéter'}</p>
                               <p>Inicio: {n.content.date} <span className="bg-slate-900 text-white px-2 rounded-full text-xs">Día {calculateDays(n.content.date)}</span></p>
                           </div>}

                           {n.type === 'img' && <a href={n.content.text} target="_blank" className="block text-center bg-blue-600 text-white p-2 rounded font-bold mt-2">VER IMAGEN</a>}
                           
                           {n.type.includes('check') && <div className="grid grid-cols-2 gap-1">
                               {Object.entries(n.content).map(([k,v])=>(v && <span key={k} className="flex items-center gap-1 text-xs"><CheckSquare size={12}/> {k}</span>))}
                           </div>}

                           {!['visita','sonda','abx','img','inter'].includes(n.type) && <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(n.content,null,2).replace(/[{}"]/g,'')}</pre>}
                       </div>
                   </div>
               ))}
           </div>
       </div>
       {showEdit && <PatientFormModal initialData={p} onClose={()=>setShowEdit(false)} mode="edit"/>}
    </div>
  );
}
