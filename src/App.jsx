import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import Login from './components/Login';
import Census from './components/Census';
import Programming from './components/Programming';
import Discharges from './components/Discharges';
import { LogOut, ClipboardList, CalendarClock, Archive } from 'lucide-react';
import { getTodayStr } from './utils';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('census');
  const [loading, setLoading] = useState(true);

  const checkDailyReset = async () => {
      const today = getTodayStr();
      const metaRef = doc(db, 'metadata', 'reset');
      const snap = await getDoc(metaRef);
      if (!snap.exists() || snap.data().date !== today) {
          const batch = writeBatch(db);
          const activeDocs = await getDocs(query(collection(db, 'patients'), where('dailyCheck', '==', true)));
          activeDocs.docs.forEach(d => batch.update(d.ref, { dailyCheck: false }));
          
          // Limpiar cirugías ambulatorias realizadas ayer
          const doneAmb = await getDocs(query(collection(db, 'patients'), where('surgeryPerformed', '==', true), where('bedNumber', '==', 'AMB')));
          doneAmb.docs.forEach(d => batch.update(d.ref, { status: 'discharged', dischargeDate: today }));

          batch.set(metaRef, { date: today });
          await batch.commit();
      }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) checkDailyReset();
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-screen grid place-items-center bg-slate-900 text-white">Iniciando UroMETRO...</div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tighter">Uro<span className="text-blue-500">METRO</span></h1>
          <button onClick={() => signOut(auth)} className="bg-slate-800 p-2 rounded-full text-red-400"><LogOut size={20}/></button>
        </div>
        <nav className="max-w-4xl mx-auto flex gap-2">
          <NavBtn active={view==='census'} onClick={()=>setView('census')} label="Censo" icon={<ClipboardList/>} />
          <NavBtn active={view==='programming'} onClick={()=>setView('programming')} label="Prog" icon={<CalendarClock/>} />
          <NavBtn active={view==='discharges'} onClick={()=>setView('discharges')} label="Egresos" icon={<Archive/>} />
        </nav>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full pb-20">
        {view === 'census' && <Census user={user}/>}
        {view === 'programming' && <Programming user={user}/>}
        {view === 'discharges' && <Discharges />}
      </main>
    </div>
  );
}
const NavBtn = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 bg-slate-800/50'}`}>
    {React.cloneElement(icon, { size: 18 })}
    <span className="text-[10px] font-bold uppercase mt-1">{label}</span>
  </button>
);
