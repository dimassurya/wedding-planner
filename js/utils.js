const fmt = n => "Rp" + (Math.round(n || 0)).toLocaleString("id-ID");
const grp = s => { s = String(s).replace(/\D/g, ""); return s ? parseInt(s).toLocaleString("id-ID") : ""; };
const num = s => parseInt(String(s).replace(/\D/g, "")) || 0;
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2100);
}

function fmtDate(s) {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

const withInfo = (text) => {
  if (!text) return '-';
  const escaped = esc(text);
  const showIcon = text.length > 20;
  return `
    <div class="info-wrap">
      <div class="info-text" title="${!showIcon ? escaped : ''}">${escaped}</div>
      ${showIcon ? `
      <div class="info-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <div class="tooltip">${escaped}</div>
      </div>` : ''}
    </div>
  `;
};

// Buka link eksternal dengan aman — tambahkan https:// kalau protokol belum ada
function openLink(url) {
  if (!url) return;
  url = String(url).trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  window.open(url, "_blank", "noopener");
}

function dl(name, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
}

/* ── Helper parsing / olah data reusable ── */

// Jumlahkan sebuah field dari array data. sumBy(arr, "harga") atau sumBy(arr, x => x.a + x.b)
function sumBy(arr, pick) {
  const fn = typeof pick === "function" ? pick : (x => x[pick]);
  return (arr || []).reduce((s, x) => s + (Number(fn(x)) || 0), 0);
}

// Bungkus satu nilai untuk sel CSV (escape tanda kutip).
const csvCell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

// Rakit CSV lengkap: header + baris data. rows = array of array.
// Menyertakan BOM (﻿) agar Excel membaca UTF-8 dengan benar.
function toCSV(headers, rows) {
  const lines = [headers.map(csvCell).join(",")];
  rows.forEach(r => lines.push(r.map(csvCell).join(",")));
  return "﻿" + lines.join("\n");
}
