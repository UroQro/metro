
export const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export const calculateDays = (dateStr) => {
    if (!dateStr) return 0;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getTodayStr = () => (new Date()).toISOString().slice(0, 10);

export const downloadCSV = (data, headers, filename) => {
    const cleanText = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/,/g, ";");
    const csvRows = [headers.join(","), ...data.map(row => row.map(cleanText).join(","))];
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    link.click();
};
