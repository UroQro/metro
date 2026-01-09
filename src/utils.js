
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
  const clean = (t) => String(t || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/,/g, " ");
  const csv = [
      headers.join(","),
      ...data.map(row => row.map(clean).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const SERVICES = ["URO", "MI", "CG", "TYO", "GYO", "PEDIA", "MAXILO", "GERIA", "PALIA", "UCIQX", "UCIA", "OTROS"];
