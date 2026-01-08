import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { MASTER_KEY } from '../constants';

export default function Login() {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ email:'', pass:'', name:'', key:'' });
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (isReg) {
        if (form.key !== MASTER_KEY) throw new Error("Clave maestra incorrecta");
        const res = await createUserWithEmailAndPassword(auth, form.email, form.pass);
        await updateProfile(res.user, { displayName: form.name });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.pass);
      }
    } catch (e) { setErr(e.message); }
  };

  const inputClass = "w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white mb-3 outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <h2 className="text-3xl font-black text-white text-center mb-2">Uro<span className="text-blue-500">METRO</span></h2>
        <p className="text-slate-500 text-center mb-8 text-sm uppercase tracking-widest font-bold">Hospital Metropolitano</p>
        
        {err && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-xs font-bold mb-4 border border-red-500/50">{err}</div>}
        
        <form onSubmit={handleSubmit}>
          {isReg && <><input className={inputClass} placeholder="Nombre" onChange={e=>setForm({...form, name:e.target.value})} /><input className={inputClass} type="password" placeholder="Clave Urotec" onChange={e=>setForm({...form, key:e.target.value})} /></>}
          <input className={inputClass} type="email" placeholder="Correo" onChange={e=>setForm({...form, email:e.target.value})} />
          <input className={inputClass} type="password" placeholder="Contraseña" onChange={e=>setForm({...form, pass:e.target.value})} />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition transform active:scale-95 uppercase tracking-tighter">
            {isReg ? 'Registrar' : 'Entrar'}
          </button>
        </form>
        <button onClick={()=>setIsReg(!isReg)} className="w-full text-slate-500 text-xs font-bold mt-6 hover:text-white uppercase tracking-widest">
          {isReg ? '¿Ya tienes cuenta? Ingresa' : 'Generar usuario nuevo'}
        </button>
      </div>
    </div>
  );
}
