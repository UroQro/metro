import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import Login from './components/Login';
import Census from './components/Census';
import Programming from './components/Programming';
import Discharges from './components/Discharges';
import { LogOut, ClipboardList, CalendarClock, Archive } from 'lucide-react';
import { getLocalISODate } from './utils';
import packageJson from '../package.json'; // Para leer versión

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('census');
  const [loading, setLoading] = useState(true);

  const dailyReset = async () => {
      const today = getLocalISODate();
      const metaRef = doc(db, 'metadata', 'daily_reset');
      try {
          const snap = await getDoc(metaRef);
          if (!snap.exists() || snap.data().date !== today) {
              const batch = writeBatch(db);
              
              const qCheck = query(collection(db, 'patients'), where('dailyCheck', '==', true));
              const snapCheck = await getDocs(qCheck);
              snapCheck.docs.forEach(d => batch.update(d.ref, { dailyCheck: false }));
              
              const qAmb = query(collection(db, 'patients'), where('bedNumber', '==', 'AMB'), where('surgeryPerformed', '==', true));
              const snapAmb = await getDocs(qAmb);
              snapAmb.docs.forEach(d => batch.update(d.ref, { status: 'discharged', dischargeDate: today }));

              batch.set(metaRef, { date: today });
              await batch.commit();
          }
      } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) { dailyReset(); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold">Cargando UroMETRO...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-3 shadow-lg sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-2">
            <h1 className="text-xl font-black tracking-tighter">Uro<span className="text-blue-500">METRO</span></h1>
            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase opacity-70">{user.displayName}</span>
                <button onClick={()=>signOut(auth)} className="text-red-400 p-1"><LogOut size={16}/></button>
            </div>
        </div>
        <nav className="flex gap-1 max-w-5xl mx-auto">
            <NavBtn active={view==='census'} onClick={()=>setView('census')} label="Censo" icon={<ClipboardList size={18}/>} />
            <NavBtn active={view==='programming'} onClick={()=>setView('programming')} label="Programación" icon={<CalendarClock size={18}/>} />
            <NavBtn active={view==='discharges'} onClick={()=>setView('discharges')} label="Egresos" icon={<Archive size={18}/>} />
        </nav>
      </header>
      <main className="flex-1 p-2 max-w-5xl mx-auto w-full pb-10">
        {view === 'census' && <Census user={user} />}
        {view === 'programming' && <Programming user={user} />}
        {view === 'discharges' && <Discharges />}
      </main>
      <footer className="text-center py-2 text-[10px] text-slate-400 font-mono bg-slate-100">
        v8.0.0
      </footer>
    </div>
  );
}
const NavBtn = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg translate-y-0' : 'text-slate-400 hover:bg-slate-800'}`}>
        {icon} <span className="text-[10px] font-bold uppercase mt-1">{label}</span>
    </button>
);
