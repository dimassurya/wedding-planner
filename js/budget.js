/* ── Status helper ── */
function bStatus(b) {
  if (b.aktual <= 0) return { key: "belum", label: "Belum Diisi",  color: "#917E8B", bg: "#ECE6E0", text: "#6f5f6a" };
  if (b.dibayar >= b.aktual) return { key: "lunas", label: "Lunas",   color: "#4F8A4C", bg: "#E2EEDD", text: "#356132" };
  if (b.dibayar > 0)  return { key: "dp",    label: "Sebagian",  color: "#B5893B", bg: "#EFE3CC", text: "#856218" };
  return                      { key: "belum", label: "Belum Bayar", color: "#C25B7E", bg: "#F6E4EB", text: "#9c3458" };
}

const bSisa = b => Math.max(b.aktual - b.dibayar, 0);

// ID numerik berikutnya — abaikan id string (mis. 'seserahan_auto') agar Math.max tidak NaN
function nextBudgetId() {
  const nums = budget.map(b => b.id).filter(x => typeof x === "number");
  return nums.length ? Math.max(...nums) + 1 : 1;
}

// Asal-usul tiap item budget (biar user paham dari mana datangnya).
// managed=true → dikelola dari tab lain, tombol hapus dikunci.
function budgetOrigin(b) {
  if (b.vendorId) return { label: "Vendor", cls: "bo-vendor", managed: true, tip: "Otomatis dari vendor yang Dipakai", tipDel: "Ditambahkan dari tab Vendor — untuk menghapus, matikan 'Dipakai' di tab Vendor" };
  if (b.id === "seserahan_auto" || b.item === "Total Seserahan") return { label: "Seserahan", cls: "bo-ser", managed: true, tip: "Otomatis dari tab Seserahan", tipDel: "Ditambahkan dari tab Seserahan — kelola item & nilainya dari tab Seserahan" };
  if (b.id === "mahar_auto" || b.item === "Total Mahar") return { label: "Mahar", cls: "bo-mahar", managed: true, tip: "Otomatis dari tab Mahar", tipDel: "Ditambahkan dari tab Mahar — kelola item & nilainya dari tab Mahar" };
  if (b.template) return { label: "Template", cls: "bo-tpl", managed: false, tip: "Contoh bawaan — boleh diedit atau dihapus" };
  return null; // item buatan sendiri
}

/* ── Filter chips ── */
document.querySelectorAll("#bChips .fchip").forEach(c => c.onclick = () => {
  document.querySelectorAll("#bChips .fchip").forEach(x => x.classList.remove("on"));
  c.classList.add("on");
  bFilter = c.dataset.f;
  renderBudget();
});

/* ✨ Rendering ✨ */
function renderBudget() {
  recalcTotals();
  const vis = budget.filter(b => bFilter === "all" || bStatus(b).key === bFilter);
  const bBody = document.getElementById("budgetBody");

  if (!vis.length) {
    bBody.innerHTML = `<div class="empty">
      <div class="big">Tidak ada item</div>
      <div>${budget.length ? "Tidak ada item pada filter ini." : "Klik Tambah Item untuk mulai."}</div>
    </div>`;
    return;
  }

  bBody.innerHTML = vis.map((b) => {
    const st = bStatus(b);
    const sel = typeof selected !== 'undefined' && selected.has(b.id);
    const o = budgetOrigin(b);
    const badge = o ? `<span class="b-origin ${o.cls}" title="${esc(o.tip)}">${o.label}</span>` : "";
    return `<div class="b-row${st.key === "lunas" ? " paid" : ""}${sel ? " sel" : ""}" data-id="${b.id}">
      <div class="b-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" data-id="${b.id}" ${sel ? "checked" : ""}></div>
      <div class="b-item">
        <input type="text" data-f="item" value="${esc(b.item)}" placeholder="Nama item...">
        ${badge}
      </div>
      <div class="b-status cStat">
        <span class="chip" data-stat style="background:${st.bg};color:${st.text}">
          <span class="cdot" style="background:${st.color}"></span>${st.label}
        </span>
      </div>
      <div class="bm-lbl lE">Estimasi</div>
      <div class="bcell cE"><span class="rp">Rp</span><input type="text" inputmode="numeric" data-f="estimasi" value="${grp(b.estimasi)}" placeholder="0"></div>
      <div class="bm-lbl lA">Aktual</div>
      <div class="bcell cA"><span class="rp">Rp</span><input type="text" inputmode="numeric" data-f="aktual" value="${grp(b.aktual)}" placeholder="0"></div>
      <div class="bm-lbl lD">Dibayar</div>
      <div class="bcell cD"><span class="rp">Rp</span><input type="text" inputmode="numeric" data-f="dibayar" value="${grp(b.dibayar)}" placeholder="0"></div>
      <div class="bm-lbl lS">Kurang</div>
      <div class="b-sisa cS" data-sisa>${fmt(bSisa(b))}</div>
      <div class="bm-lbl lT">Jatuh Tempo</div>
      <div class="cT r" style="font-size:13px;color:${b.jatuhTempo ? 'var(--ink)' : 'var(--muted)'}">${fmtDate(b.jatuhTempo)}</div>
      <div class="b-actions r">
        <button class="act" onclick="openBudget(${b.id})" title="Detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="#46233E" stroke-width="2">
            <circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1" stroke-linecap="round"/>
          </svg>
        </button>
        ${o && o.managed
          ? `<button class="act del locked" disabled title="${esc(o.tipDel)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9B9C2" stroke-width="2">
                <rect x="5" y="10" width="14" height="9" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
              </svg>
            </button>`
          : `<button class="act del" onclick="delBudget(${b.id})" title="Hapus">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C25B7E" stroke-width="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            </button>`}
      </div>
    </div>`;
  }).join("");

  const sa = document.getElementById("selAllBudget");
  if (sa) sa.onchange = handleSelAll;
  bBody.querySelectorAll(".rowcbx").forEach(c => c.onchange = e => toggleSel(parseInt(e.target.dataset.id), e.target.checked));
  if (typeof updateBulkbar === 'function') updateBulkbar();



  bBody.querySelectorAll(".b-row").forEach(row => {
    const id = parseInt(row.dataset.id);
    row.querySelectorAll("input[data-f]").forEach(inp => {
      inp.addEventListener("input", e => {
        const f = e.target.dataset.f;
        const b = budget.find(x => x.id === id);
        if (f === "item") {
          b.item = e.target.value;
        } else {
          const len = e.target.value.length, start = e.target.selectionStart;
          e.target.value = grp(e.target.value);
          b[f] = num(e.target.value);
          const d = e.target.value.length - len;
          try { e.target.setSelectionRange(start + d, start + d); } catch (_) {}
        }
        recalcRow(row, b);
        saveB();
      });
    });
  });
}

function recalcTotals() {
  const tEst = budget.reduce((s, b) => s + b.estimasi, 0);
  const tAkt = budget.reduce((s, b) => s + b.aktual, 0);
  const tDib = budget.reduce((s, b) => s + b.dibayar, 0);
  const tSis = budget.reduce((s, b) => s + bSisa(b), 0);

  document.getElementById("bEst").textContent = fmt(tEst);
  document.getElementById("bAkt").textContent = fmt(tAkt);
  document.getElementById("bPaid").textContent = fmt(tDib);
  document.getElementById("bDue").textContent = fmt(tSis);
  document.getElementById("fEst").textContent = fmt(tEst);
  document.getElementById("fAkt").textContent = fmt(tAkt);
  document.getElementById("fDib").textContent = fmt(tDib);
  document.getElementById("fSis").textContent = fmt(tSis);

  const pct = tAkt ? Math.round(tDib / tAkt * 100) : 0;
  document.getElementById("bPct").textContent = pct + "%";
  document.getElementById("bBar").style.width = Math.min(pct, 100) + "%";
}

function recalcRow(row, b) {
  row.querySelector("[data-sisa]").textContent = fmt(bSisa(b));
  const st = bStatus(b);
  const chip = row.querySelector("[data-stat]");
  chip.style.background = st.bg;
  chip.style.color = st.text;
  chip.innerHTML = `<span class="cdot" style="background:${st.color}"></span>${st.label}`;
  row.classList.toggle("paid", st.key === "lunas");
  recalcTotals();
}

/* ── Add / Delete ── */
document.getElementById("addBudgetBtn").onclick = () => {
  const id = nextBudgetId();
  budget.push({ id, item: "", estimasi: 0, aktual: 0, uangMuka: 0, dibayar: 0, jatuhTempo: "", remarks: "" });
  bFilter = "all";
  document.querySelectorAll("#bChips .fchip").forEach(x => x.classList.toggle("on", x.dataset.f === "all"));
  saveB();
  renderBudget();
  const last = document.querySelector(`.b-row[data-id="${id}"] input[data-f="item"]`);
  if (last) { last.scrollIntoView({ block: "center", behavior: "smooth" }); last.focus(); }
};

window.delBudget = id => {
  const b = budget.find(x => x.id === id);
  if (!b) return;

  // Item agregat dari Seserahan/Mahar — tidak dihapus manual (otomatis muncul lagi dari tabnya)
  if (b.id === "seserahan_auto" || b.item === "Total Seserahan" || b.id === "mahar_auto" || b.item === "Total Mahar") {
    const src = (b.id === "mahar_auto" || b.item === "Total Mahar") ? "Mahar" : "Seserahan";
    toast(`Item ini otomatis dari tab ${src} — kelola dari sana`);
    return;
  }

  // Item dari vendor "Dipakai" — menghapus = batal memakai vendornya (biar tetap sinkron)
  if (b.vendorId) {
    if (!confirm(`"${b.item}" berasal dari vendor yang Dipakai.\n\nMenghapus dari Budget akan menonaktifkan "Dipakai" pada vendor itu. Untuk memunculkannya lagi, aktifkan "Dipakai" di tab Vendor.\n\nLanjutkan?`)) return;
    const v = typeof vendors !== "undefined" ? vendors.find(x => x.id === b.vendorId) : null;
    if (v) { v.jadi = false; if (typeof saveV === "function") saveV(); if (typeof renderVendors === "function") renderVendors(); }
    budget = budget.filter(x => x.id !== id);
    saveB();
    renderBudget();
    toast("Item dihapus & vendor dinonaktifkan");
    return;
  }

  // Template / item manual — hapus biasa
  if (!confirm(`Hapus item "${b.item || "tanpa nama"}"?`)) return;
  budget = budget.filter(x => x.id !== id);
  saveB();
  renderBudget();
  toast("Item dihapus");
};

/* ── Detail Modal ── */
const bOverlay = document.getElementById("bOverlay");

window.openBudget = id => {
  editBudgetId = id;
  const b = budget.find(x => x.id === id);
  document.getElementById("bmTitle").textContent = b.item || "Detail Item";
  document.getElementById("bmItem").value = b.item;
  document.getElementById("bmEst").value = grp(b.estimasi);
  document.getElementById("bmAkt").value = grp(b.aktual);
  document.getElementById("bmDp").value = grp(b.uangMuka);
  document.getElementById("bmDib").value = grp(b.dibayar);
  document.getElementById("bmDue").value = b.jatuhTempo || "";
  document.getElementById("bmRemarks").value = b.remarks || "";
  bmCalc();
  bOverlay.classList.add("show");
};

function bmCalc() {
  const est = num(document.getElementById("bmEst").value);
  const akt = num(document.getElementById("bmAkt").value);
  const dib = num(document.getElementById("bmDib").value);
  document.getElementById("bmSelisih").textContent = fmt(est - akt);
  document.getElementById("bmSisa").textContent = fmt(Math.max(akt - dib, 0));
  const st = bStatus({ aktual: akt, dibayar: dib });
  const el = document.getElementById("bmStat");
  el.textContent = st.label;
  el.style.color = st.color;
}

document.querySelectorAll(".cur").forEach(inp => inp.addEventListener("input", e => {
  const len = e.target.value.length, start = e.target.selectionStart;
  e.target.value = grp(e.target.value);
  const d = e.target.value.length - len;
  try { e.target.setSelectionRange(start + d, start + d); } catch (_) {}
  bmCalc();
}));

document.getElementById("bmCancel").onclick = () => bOverlay.classList.remove("show");
bOverlay.onclick = e => { if (e.target === bOverlay) bOverlay.classList.remove("show"); };

document.getElementById("bmSave").onclick = () => {
  const b = budget.find(x => x.id === editBudgetId);
  if (!b) return;
  b.item = document.getElementById("bmItem").value.trim();
  b.estimasi = num(document.getElementById("bmEst").value);
  b.aktual = num(document.getElementById("bmAkt").value);
  b.uangMuka = num(document.getElementById("bmDp").value);
  b.dibayar = num(document.getElementById("bmDib").value);
  b.jatuhTempo = document.getElementById("bmDue").value;
  b.remarks = document.getElementById("bmRemarks").value.trim();
  saveB();
  bOverlay.classList.remove("show");
  renderBudget();
  toast("Item disimpan");
};

/* ── Export & Reset ── */
document.getElementById("bExportBtn").onclick = () => {
  const head = ["No", "Item", "Status", "Estimasi Budget", "Aktual Budget", "Selisih", "Uang Muka", "Sudah Dibayarkan", "Sisa Pembayaran", "Jatuh Tempo", "Remarks", "Pelunasan"];
  const rows = budget.map((b, i) => {
    const st = bStatus(b);
    return [i + 1, b.item, st.label, b.estimasi, b.aktual, b.estimasi - b.aktual, b.uangMuka, b.dibayar, bSisa(b), b.jatuhTempo, b.remarks, st.key === "lunas" ? "TRUE" : "FALSE"];
  });
  dl("anggaran-pernikahan.csv", toCSV(head, rows));
  toast("CSV anggaran diunduh");
};

/* ── Vendor Integration ── */
function handleVendorDecision(vendor, isJadi) {
  const existingIdx = budget.findIndex(b => b.vendorId === vendor.id);
  
  if (isJadi) {
    const cat = VENDOR_CATEGORIES.find(c => c.id === vendor.category);
    const catLabel = cat ? cat.label : vendor.category;
    
    if (existingIdx > -1) {
      budget[existingIdx].estimasi = vendor.harga;
      budget[existingIdx].aktual = vendor.harga;
      budget[existingIdx].remarks = vendor.deskripsi;
    } else {
      const newId = nextBudgetId();
      budget.push({
        id: newId,
        vendorId: vendor.id,
        item: `${catLabel} - ${vendor.nama}`,
        estimasi: vendor.harga,
        aktual: vendor.harga,
        uangMuka: 0,
        dibayar: 0,
        jatuhTempo: "",
        remarks: vendor.deskripsi
      });
    }
  } else {
    if (existingIdx > -1) {
      budget.splice(existingIdx, 1);
    }
  }
  
  saveB();
  // Attempt to re-render if we are looking at the budget
  const bPanel = document.getElementById("panel-budget");
  if (bPanel && bPanel.classList.contains("active")) {
    renderBudget();
  }
}

// Cleanup empty items on focusout

document.addEventListener("focusout", e => {
  if (e.target.matches("input[data-f='item']")) {
    if (e.target.value.trim() === "") {
      const row = e.target.closest(".b-row");
      if (!row) return;
      const id = parseInt(row.dataset.id);
      if (isNaN(id)) return;
      budget = budget.filter(x => x.id !== id);
      saveB();
      renderBudget();
    }
  }
});
