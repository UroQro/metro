import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [isReg, setIsReg] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault(); setErr('');
    try {
        if (isReg) {
            if (key !== "urotec123") throw new Error("Clave maestra incorrecta");
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(res.user, { displayName: name });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch (e) { setErr(e.message); }
  };

  const inputClass = "w-full p-3 mb-3 bg-slate-800 border border-slate-700 rounded text-white outline-none focus:border-blue-500";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-black text-white text-center mb-1 tracking-tighter">Uro<span className="text-blue-500">METRO</span></h1>
        <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Hospital Metropolitano</p>
        
        {err && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-xs font-bold border border-red-800">{err}</div>}
        
        <form onSubmit={handleAuth}>
            {isReg && (
                <>
                    <input className={inputClass} placeholder="Nombre Completo" value={name} onChange={e=>setName(e.target.value)} required />
                    <input className={inputClass} type="password" placeholder="Clave Maestra" value={key} onChange={e=>setKey(e.target.value)} required />
                </>
            )}
            <input className={inputClass} type="email" placeholder="Correo Electrónico" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input className={inputClass} type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} required />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg mt-2 uppercase transition transform active:scale-95">
                {isReg ? 'Registrar Usuario' : 'Iniciar Sesión'}
            </button>
        </form>
        <button onClick={()=>setIsReg(!isReg)} className="w-full mt-6 text-slate-500 text-xs font-bold uppercase hover:text-white">
            {isReg ? '¿Ya tienes cuenta? Ingresa' : 'Crear nueva cuenta'}
        </button>
      </div>
    </div>
  );
}
