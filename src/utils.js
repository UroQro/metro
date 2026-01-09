
export const calculateAge = (dob) => {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export const calculateDays = (dateStr) => {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getLocalISODate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return (new Date(d - offset)).toISOString().slice(0, 10);
};

export const downloadCSV = (data, headers, filename) => {
  try {
    const clean = (t) => String(t || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/,/g, " ").replace(/\n/g, " ");
    const csvContent = [
        headers.join(","),
        ...data.map(row => row.map(cell => `"${clean(cell)}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Error exportando CSV", e);
    alert("Error al generar CSV: " + e.message);
  }
};

export const SERVICES = ["URO", "CARDIO", "MI", "CG", "TYO", "GYO", "PEDIA", "MAXILO", "GERIA", "PALIA", "UCIQX", "UCIA", "OTROS"];
