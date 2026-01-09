import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { calculateAge, calculateDays, getLocalISODate } from '../utils';
import { ArrowLeft, Save, Plus, Trash2, Edit, Copy, CheckSquare, Square, LogOut, Syringe } from 'lucide-react';
import PatientFormModal from './PatientFormModal';

export default function PatientDetail({ patient: initialP, onClose }) {
  const [p, setP] = useState(initialP);
  const [showEdit, setShowEdit] = useState(false);
  const [noteType, setNoteType] = useState('visita');
  const [note, setNote] = useState({});
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
     const unsub = onSnapshot(doc(db, "patients", initialP.id), (d) => setP({id:d.id, ...d.data()}));
     return () => unsub();
  }, [initialP.id]);

  const saveNote = async () => {
     if(Object.keys(note).length===0) return;
     const newNote = {
         id: Date.now(), type: noteType, 
         author: auth.currentUser.displayName, 
         date: new Date().toISOString(), 
         content: note
     };
     await updateDoc(doc(db, "patients", p.id), { notes: arrayUnion(newNote) });
     
     // Update last labs/uro fields for quick view in census export
     if(noteType === 'labs') await updateDoc(doc(db, "patients", p.id), { lastLabs: JSON.stringify(note) });
     if(noteType === 'uro') await updateDoc(doc(db, "patients", p.id), { lastUro: note.res === '+' ? `${note.germ} (${note.sens})` : 'Negativo' });
     
     setNote({}); alert("Nota Guardada");
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
      const t = `*EVOLUCIÓN UROLOGÍA*\n*S:* ${n.subj}\n*SV:* TA:${n.ta} FC:${n.fc} T:${n.temp}\n*GU:* ${n.gu}ml | *DREN:* ${n.dren||'-'}\n*LABS:* Hb:${n.hb} Leu:${n.leu} Cr:${n.cr}\n*PLAN:* ${n.plan}`;
      navigator.clipboard.writeText(t); alert("Copiado");
  };

  const stopMeds = async (nId) => {
      // Logic to mark medication stopped could be complex, for now we just append a note
      await updateDoc(doc(db, "patients", p.id), { notes: arrayUnion({
          id: Date.now(), type: 'texto', author: 'SISTEMA', date: new Date().toISOString(), content: {text: `Antibiótico suspendido`}
      })});
  };

  const discharge = async () => {
      if(confirm("¿Confirmar Egreso?")) await updateDoc(doc(db, "patients", p.id), { status: 'discharged', dischargeDate: getLocalISODate() });
  };

  const Input = ({l, k, ph}) => (
      <div><label className="text-[9px] font-bold text-slate-400 uppercase">{l}</label>
      <input className="w-full border rounded p-1.5 text-xs bg-slate-50" placeholder={ph} value={note[k]||''} onChange={e=>setNote({...note, [k]:e.target.value})} /></div>
  );

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
               <button onClick={()=>setShowEdit(true)} className="bg-blue-50 text-blue-500 p-2 rounded-lg border border-blue-100"><Edit size={16}/></button>
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
           <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-100">
               <select className="w-full mb-3 p-2 rounded border bg-slate-50 text-sm font-bold" value={noteType} onChange={e=>{setNoteType(e.target.value); setNote({})}}>
                   <option value="visita">VISITA DIARIA (SOAP)</option>
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
                       <textarea className="w-full p-2 border rounded text-xs" rows="2" placeholder="Subjetivo..." onChange={e=>setNote({...note, subj:e.target.value})}/>
                       <div className="grid grid-cols-4 gap-2">
                           <Input l="TA" k="ta"/> <Input l="FC" k="fc"/> <Input l="Temp" k="temp"/> <Input l="Gasto" k="gu"/>
                       </div>
                       <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded">
                           <Input l="Hb" k="hb"/> <Input l="Leu" k="leu"/> <Input l="Cr" k="cr"/>
                       </div>
                       <textarea className="w-full p-2 border rounded text-xs" rows="3" placeholder="Análisis y Plan..." onChange={e=>setNote({...note, plan:e.target.value})}/>
                   </>}

                   {noteType === 'check_qx' && <div className="space-y-1">
                       {['No Derechohabiencia','VPO','Labs','Cultivos','TAC','Pruebas Cruzadas','Hojas Consentimiento'].map(item=>(
                           <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e=>setNote({...note, [item]:e.target.checked})}/> {item}</label>
                       ))}
                   </div>}
                   
                   {noteType === 'check_egreso' && <div className="space-y-1">
                       {['Receta','Hojas de Egreso','Nota de Alta','Cita Abierta'].map(item=>(
                           <label key={item} className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e=>setNote({...note, [item]:e.target.checked})}/> {item}</label>
                       ))}
                   </div>}

                   {noteType === 'labs' && <div className="grid grid-cols-4 gap-2">
                       {['Hb','Htc','Leu','Plq','Glu','Urea','BUN','Cr','Na','K','Cl','TP','TTP','INR'].map(k=><Input key={k} l={k} k={k}/>)}
                   </div>}

                   {(noteType === 'sonda' || noteType === 'abx') && <div className="space-y-2">
                       <label className="text-xs font-bold block">Fecha Inicio / Colocación</label>
                       <input type="date" className="w-full p-2 border rounded" onChange={e=>setNote({...note, date:e.target.value})}/>
                       {noteType === 'abx' && <Input l="Medicamento" k="med" />}
                   </div>}

                   {noteType === 'uro' && <div className="space-y-2">
                       <select className="w-full p-2 border rounded" onChange={e=>setNote({...note, res:e.target.value})}><option>Resultado...</option><option value="+">Positivo (+)</option><option value="-">Negativo (-)</option></select>
                       {note.res==='+' && <><Input l="Germen" k="germ"/><Input l="Sensibilidad" k="sens"/></>}
                   </div>}

                   {(noteType === 'texto' || noteType === 'proc' || noteType === 'img' || noteType === 'vpo') && 
                       <textarea className="w-full p-2 border rounded text-xs" rows="3" placeholder="Detalles..." onChange={e=>setNote({...note, text:e.target.value})}/>
                   }
               </div>
               <button onClick={saveNote} className="w-full bg-slate-900 text-white p-3 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2"><Save size={16}/> Guardar Nota</button>
           </div>

           {/* HISTORIAL NOTAS */}
           <div className="space-y-3">
               {p.notes?.slice().reverse().map(n => (
                   <div key={n.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                       <div className="flex justify-between items-center mb-2 border-b pb-1">
                           <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-500">{n.type}</span>
                           <span className="text-[10px] text-slate-400">{n.date.slice(0,10)} • {n.author}</span>
                       </div>
                       <div className="text-sm text-slate-700">
                           {n.type === 'visita' && <div>
                               <p className="mb-1"><span className="font-bold">S:</span> {n.content.subj}</p>
                               <div className="bg-slate-50 p-2 rounded font-mono text-xs text-blue-800 mb-1">TA:{n.content.ta} FC:{n.content.fc} T:{n.content.temp} | GU:{n.content.gu}</div>
                               <p><span className="font-bold">P:</span> {n.content.plan}</p>
                               <button onClick={()=>copyVisita(n.content)} className="mt-2 text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded font-bold border border-green-100">COPIAR NOTA</button>
                           </div>}
                           
                           {(n.type === 'sonda' || n.type === 'abx') && <div>
                               <p className="font-bold text-lg">{n.content.med || 'Sonda/Catéter'}</p>
                               <p>Inicio: {n.content.date} <span className="bg-slate-900 text-white px-2 rounded-full text-xs">Día {calculateDays(n.content.date)}</span></p>
                               {n.type === 'abx' && <button onClick={()=>stopMeds(n.id)} className="mt-2 text-xs text-red-500 underline">Suspender</button>}
                           </div>}

                           {n.type === 'img' && <a href={n.content.text} target="_blank" className="block text-center bg-blue-600 text-white p-2 rounded font-bold mt-2">VER IMAGEN</a>}
                           
                           {n.type.includes('check') && <div className="grid grid-cols-2 gap-1">
                               {Object.entries(n.content).map(([k,v])=>(v && <span key={k} className="flex items-center gap-1 text-xs"><CheckSquare size={12}/> {k}</span>))}
                           </div>}

                           {!['visita','sonda','abx','img'].includes(n.type) && <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(n.content,null,2).replace(/[{}"]/g,'')}</pre>}
                       </div>
                   </div>
               ))}
           </div>
       </div>
       {showEdit && <PatientFormModal initialData={p} onClose={()=>setShowEdit(false)} mode="edit"/>}
    </div>
  );
}
