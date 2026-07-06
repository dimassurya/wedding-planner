// js/home.js — dashboard ringkasan dari semua tab (SVG, tanpa library)

const homeBody = document.getElementById("homeBody");

const MONTHS_FULL = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function daysUntilWedding() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const w = new Date(WEDDING_DATE + "T00:00:00");
  return Math.round((w - today) / 86400000);
}

function weddingDateLong() {
  const [y, m, d] = WEDDING_DATE.split("-");
  return `${parseInt(d)} ${MONTHS_FULL[parseInt(m) - 1]} ${y}`;
}

// Donut chart: segments [{value, color}], teks di tengah
function donut(segments, top, bottom) {
  const cx = 80, cy = 80, r = 58, sw = 20, C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let off = 0, arcs = "";
  if (total > 0) {
    segments.forEach(s => {
      if (s.value <= 0) return;
      const len = s.value / total * C;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}"
        stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
        transform="rotate(-90 ${cx} ${cy})"/>`;
      off += len;
    });
  }
  return `<svg viewBox="0 0 160 160" class="hm-donut">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1E9E4" stroke-width="${sw}"/>
    ${arcs}
    <text x="${cx}" y="${cy - 1}" text-anchor="middle" class="hm-donut-num">${top}</text>
    <text x="${cx}" y="${cy + 17}" text-anchor="middle" class="hm-donut-lbl">${bottom}</text>
  </svg>`;
}

function legend(items) {
  return `<div class="hm-legend">` + items.map(i =>
    `<div class="hm-leg"><span class="hm-leg-dot" style="background:${i.color}"></span>${i.label}<b>${i.value}</b></div>`
  ).join("") + `</div>`;
}

function progBar(label, done, total, color) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return `<div class="hm-bar">
    <div class="hm-bar-top"><span>${label}</span><span class="hm-bar-val">${done}/${total} · ${pct}%</span></div>
    <div class="hm-track"><span style="width:${pct}%;background:${color}"></span></div>
  </div>`;
}

function renderHome() {
  if (!homeBody) return;

  // ── Hitung statistik tiap area (tamu: yang dikonfirmasi saja) ──
  const confirmedGuests = guests.filter(g => g.konfirmasi !== false);
  const totalUndangan = confirmedGuests.length;
  const totalOrang = confirmedGuests.reduce((s, g) => s + g.jumlah, 0);
  let pria = 0, wanita = 0;
  confirmedGuests.forEach(g => {
    const m = META[g.status] || META.lainnya;
    if (m.side === "pria") pria += g.jumlah;
    else if (m.side === "wanita") wanita += g.jumlah;
  });
  const lainnyaOrang = Math.max(totalOrang - pria - wanita, 0);

  const tEst = budget.reduce((s, b) => s + b.estimasi, 0);
  const tAkt = budget.reduce((s, b) => s + b.aktual, 0);
  const tDib = budget.reduce((s, b) => s + b.dibayar, 0);
  const tSis = budget.reduce((s, b) => s + (typeof bSisa === "function" ? bSisa(b) : Math.max(b.aktual - b.dibayar, 0)), 0);
  const pctPaid = tAkt ? Math.round(tDib / tAkt * 100) : 0;

  const vTotal = vendors.length, vJadi = vendors.filter(v => v.jadi).length;
  const sTotal = seserahan.length, sDone = seserahan.filter(s => s.status).length;
  const mTotal = mahar.length, mDone = mahar.filter(m => m.status).length;
  let aTotal = 0, aDone = 0;
  admin.forEach(g => g.items.forEach(it => { aTotal++; if (it.status) aDone++; }));
  let ckTotal = 0, ckDone = 0;
  checklist.forEach(g => g.items.forEach(it => { ckTotal++; if (it.status) ckDone++; }));
  const tlTotal = timeline.length, tlDone = timeline.filter(t => t.status === "selesai").length;

  // Progres persiapan keseluruhan (gabungan checklist, admin, seserahan, mahar, timeline)
  const prepDone = ckDone + aDone + sDone + mDone + tlDone;
  const prepTotal = ckTotal + aTotal + sTotal + mTotal + tlTotal;
  const prepPct = prepTotal ? Math.round(prepDone / prepTotal * 100) : 0;

  const days = daysUntilWedding();

  // ── Deadline terdekat (timeline + jatuh tempo budget) ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = [];
  timeline.forEach(t => {
    if (t.deadline && t.status !== "selesai") upcoming.push({ date: t.deadline, label: t.tugas || "Tugas", src: "Timeline" });
  });
  budget.forEach(b => {
    const lunas = typeof bStatus === "function" && bStatus(b).key === "lunas";
    if (b.jatuhTempo && !lunas) upcoming.push({ date: b.jatuhTempo, label: "Bayar: " + (b.item || "—"), src: "Budget" });
  });
  upcoming.sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));
  const nextitems = upcoming.slice(0, 5);

  // ── Render ──
  homeBody.innerHTML = `
    <div class="hm-hero">
      <div class="hm-hero-left">
        <div class="hm-hero-eyebrow">Hari Bahagia</div>
        <div class="hm-hero-date">${weddingDateLong()}</div>
        <div class="hm-hero-sub">${days > 0 ? "Tetap semangat persiapannya 💛" : (days === 0 ? "Hari ini harinya! 🎉" : "Selamat menempuh hidup baru 🎊")}</div>
      </div>
      <div class="hm-hero-count">
        <div class="hm-hero-num">${days > 0 ? days : (days === 0 ? "0" : Math.abs(days))}</div>
        <div class="hm-hero-unit">${days > 0 ? "hari lagi" : (days === 0 ? "hari ini" : "hari lalu")}</div>
      </div>
    </div>

    <div class="hm-metrics">
      <div class="hm-metric"><div class="hm-m-num">${totalOrang.toLocaleString("id-ID")}</div><div class="hm-m-lbl">Total Tamu (orang)</div><div class="hm-m-sub">${totalUndangan} undangan dikonfirmasi</div></div>
      <div class="hm-metric"><div class="hm-m-num">${fmt(tAkt)}</div><div class="hm-m-lbl">Anggaran Aktual</div><div class="hm-m-sub">est. ${fmt(tEst)}</div></div>
      <div class="hm-metric"><div class="hm-m-num">${pctPaid}%</div><div class="hm-m-lbl">Sudah Dibayar</div><div class="hm-m-sub">sisa ${fmt(tSis)}</div></div>
      <div class="hm-metric"><div class="hm-m-num">${prepPct}%</div><div class="hm-m-lbl">Progres Persiapan</div><div class="hm-m-sub">${prepDone}/${prepTotal} selesai</div></div>
    </div>

    <div class="hm-charts">
      <div class="card hm-chart">
        <div class="hm-chart-title">Komposisi Tamu</div>
        ${donut([
          { value: pria, color: "#2F6B66" },
          { value: wanita, color: "#C25B7E" },
          { value: lainnyaOrang, color: "#B5893B" },
        ], totalOrang.toLocaleString("id-ID"), "orang")}
        ${legend([
          { label: "Pihak Pria", value: pria, color: "#2F6B66" },
          { label: "Pihak Wanita", value: wanita, color: "#C25B7E" },
          { label: "Lainnya", value: lainnyaOrang, color: "#B5893B" },
        ])}
      </div>

      <div class="card hm-chart">
        <div class="hm-chart-title">Anggaran</div>
        ${donut([
          { value: tDib, color: "#4F8A4C" },
          { value: tSis, color: "#C25B7E" },
        ], pctPaid + "%", "terbayar")}
        ${legend([
          { label: "Terbayar", value: fmt(tDib), color: "#4F8A4C" },
          { label: "Sisa Tagihan", value: fmt(tSis), color: "#C25B7E" },
        ])}
      </div>
    </div>

    <div class="card hm-section">
      <div class="hm-chart-title">Progres Persiapan per Bagian</div>
      <div class="hm-bars">
        ${progBar("Checklist Persiapan", ckDone, ckTotal, "#B5893B")}
        ${progBar("Administrasi (berkas)", aDone, aTotal, "#2F6B66")}
        ${progBar("Seserahan", sDone, sTotal, "#C25B7E")}
        ${progBar("Mahar", mDone, mTotal, "#46233E")}
        ${progBar("Timeline (tugas)", tlDone, tlTotal, "#4F8A4C")}
        ${progBar("Vendor dipilih", vJadi, vTotal, "#5E2A50")}
      </div>
    </div>

    <div class="card hm-section">
      <div class="hm-chart-title">Deadline Terdekat</div>
      ${nextitems.length ? `<div class="hm-deadlines">` + nextitems.map(it => {
        const d = new Date(it.date + "T00:00:00");
        const left = Math.round((d - today) / 86400000);
        const tag = left < 0 ? `<span class="hm-dl-late">lewat ${Math.abs(left)} hari</span>`
          : left === 0 ? `<span class="hm-dl-soon">hari ini</span>`
          : `<span class="hm-dl-days">${left} hari lagi</span>`;
        return `<div class="hm-dl">
          <div class="hm-dl-date">${fmtDate(it.date)}</div>
          <div class="hm-dl-main"><span class="hm-dl-src hm-src-${it.src.toLowerCase()}">${it.src}</span>${esc(it.label)}</div>
          <div class="hm-dl-left">${tag}</div>
        </div>`;
      }).join("") + `</div>`
        : `<div class="hm-empty">Belum ada deadline. Isi jatuh tempo di Budget atau tugas di Timeline.</div>`}
    </div>
  `;
}
