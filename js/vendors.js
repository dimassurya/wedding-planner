/* ── Vendor Category Chips ── */
function setupVendorChips() {
  const container = document.getElementById("vChips");
  if (!container) return;
  container.innerHTML = VENDOR_CATEGORIES.map(c => 
    `<button class="fchip ${c.id === vFilter ? 'on' : ''}" data-v="${c.id}">${c.label}</button>`
  ).join('');

  container.querySelectorAll(".fchip").forEach(c => c.onclick = () => {
    container.querySelectorAll(".fchip").forEach(x => x.classList.remove("on"));
    c.classList.add("on");
    vFilter = c.dataset.v;
    renderVendors();
  });
}

// Pengali pax memakai data tamu yang DIKONFIRMASI saja
const vConfOrang = () => guests.filter(g => g.konfirmasi !== false).reduce((s, g) => s + g.jumlah, 0);
const vConfUndangan = () => guests.filter(g => g.konfirmasi !== false).length;

// Ringkasan biaya vendor (ditampilkan di atas tab Vendor)
function renderVendorStats() {
  const dipakai = vendors.filter(v => v.jadi);
  const biaya = dipakai.reduce((s, v) => s + (v.harga || 0), 0);
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set("vsTotal", vendors.length);
  set("vsDipakai", dipakai.length);
  set("vsBiaya", fmt(biaya));
  set("vsBelum", vendors.length - dipakai.length);

  // Daftar vendor yang dipakai (lintas kategori) — biar terlihat sekilas tanpa pindah filter
  const box = document.getElementById("vDipakaiList");
  if (box) {
    if (!dipakai.length) {
      box.innerHTML = "";
    } else {
      const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id; };
      const items = dipakai.map(v => `
        <button class="vd-item" data-go="${v.category}" title="Buka kategori ${esc(catLabel(v.category))}">
          <span class="vd-cat">${esc(catLabel(v.category))}</span>
          <span class="vd-name">${esc(v.nama)}</span>
          <span class="vd-price">Rp ${grp(v.harga)}</span>
        </button>`).join("");
      box.innerHTML = `<div class="card vd-card">
        <div class="vd-head">✓ Vendor yang Dipakai <span class="vd-count">${dipakai.length}</span></div>
        <div class="vd-list">${items}</div>
      </div>`;
      box.querySelectorAll(".vd-item").forEach(b => b.onclick = () => {
        const cat = b.dataset.go;
        const chip = document.querySelector(`#vChips .fchip[data-v="${cat}"]`);
        if (chip) chip.click();
      });
    }
  }
}

/* ── Rendering ── */
function renderVendors() {
  renderVendorStats();
  const body = document.getElementById("vendorBody");
  if (!body) return;
  const rows = vendors.filter(v => v.category === vFilter);

  if (!rows.length) {
    body.innerHTML = `<div class="empty">
      <div class="big">Tidak ada vendor</div>
      <div>Belum ada data vendor untuk kategori ini.</div>
    </div>`;
    return;
  }

  const tOrang = vConfOrang();
  const tUndang = vConfUndangan();

  body.innerHTML = rows.map(v => {
    let paxInfo = '';
    const sel = selected.has(v.id);
    if (v.tipeHarga === 'pax') {
       let multText = v.paxManualVal;
       if (v.paxPengali === 'orang') multText = `${tOrang} org`;
       else if (v.paxPengali === 'undangan') multText = `${tUndang} undgn`;
       paxInfo = `<div style="font-size: 11.5px; color: var(--muted); margin-top: 4px; font-weight: normal; letter-spacing: 0;">@ Rp ${grp(v.hargaPax || 0)} &times; ${multText}</div>`;
    }

    return `
    <div class="v-row ${sel ? "sel" : ""}" data-id="${v.id}">
      <div class="v-cell v-cbx"><input type="checkbox" class="cbx rowcbx" data-id="${v.id}" ${sel ? "checked" : ""}></div>
      <div class="v-cell v-nama has-info-icon">${withInfo(v.nama)}</div>
      <div class="v-cell v-alamat has-info-icon">${withInfo(v.alamat)}</div>
      <div class="v-cell v-hp">${esc(v.hp)}</div>
      <div class="v-cell v-harga cE" style="line-height: 1.2;">
        <div>Rp ${grp(v.harga)}</div>
        ${paxInfo}
      </div>
      <div class="v-cell v-desc has-info-icon">${withInfo(v.deskripsi)}</div>
      <div class="v-decide">
        ${WPUI.switchToggle({ title: "Aktifkan jika vendor ini dipakai (otomatis masuk Budget)", inputHTML: `<input type="checkbox" class="v-jadi" ${v.jadi ? "checked" : ""}>` })}
        <span class="v-lbl ${v.jadi ? 'on' : ''}">${v.jadi ? 'Dipakai' : 'Belum'}</span>
      </div>
      <div class="v-actions r" style="display: flex; gap: 4px; justify-content: flex-end;">
        <button class="icon-btn edit-v-btn" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
        <button class="icon-btn del-v-btn" title="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>
  `}).join('');

  const sa = document.getElementById("selAllVendor");
  if (sa) sa.onchange = handleSelAll;
  body.querySelectorAll(".rowcbx").forEach(c => c.onchange = e => toggleSel(parseInt(e.target.dataset.id), e.target.checked));

  // Event Listeners
  document.querySelectorAll(".edit-v-btn").forEach(b => b.onclick = (e) => {
    const id = parseInt(e.target.closest(".v-row").dataset.id);
    openVendorModal(id);
  });

  document.querySelectorAll(".del-v-btn").forEach(b => b.onclick = (e) => {
    const id = parseInt(e.target.closest(".v-row").dataset.id);
    if (confirm("Hapus vendor ini?")) {
      const idx = vendors.findIndex(x => x.id === id);
      if (idx > -1) {
        if (vendors[idx].jadi) handleVendorDecision(vendors[idx], false); // Remove from budget
        vendors.splice(idx, 1);
        saveV();
        renderVendors();
      }
    }
  });

  document.querySelectorAll(".v-jadi").forEach(cb => cb.onchange = (e) => {
    const id = parseInt(e.target.closest(".v-row").dataset.id);
    const v = vendors.find(x => x.id === id);
    if (v) {
      v.jadi = e.target.checked;
      handleVendorDecision(v, v.jadi);
      saveV();
      renderVendors(); // re-render to update label
    }
  });
}

/* ── Modal & Form ── */
function togglePaxFields() {
  const vTipe = document.getElementById("vTipeHarga");
  if (!vTipe) return;
  const isPax = vTipe.value === "pax";
  const paxGroup = document.getElementById("vPaxGroup");
  if (paxGroup) paxGroup.style.display = isPax ? "flex" : "none";
  
  const vHargaLbl = document.getElementById("vHargaLbl");
  if (vHargaLbl) vHargaLbl.textContent = isPax ? "Total Akhir (Bisa diedit)" : "Total Harga Paket";
  
  const vHargaHint = document.getElementById("vHargaHint");
  if (vHargaHint) vHargaHint.style.display = isPax ? "block" : "none";
  
  const pengali = document.getElementById("vPaxPengali");
  const isMan = pengali && pengali.value === "manual";
  const manGroup = document.getElementById("vPaxManualGroup");
  if (manGroup) manGroup.style.display = isMan ? "block" : "none";
  
  if (isPax) calculatePaxTotal(false);
}

function calculatePaxTotal(force = true) {
  const vTipe = document.getElementById("vTipeHarga");
  if (!vTipe || vTipe.value !== "pax") return;
  
  const hpax = num(document.getElementById("vHargaPax").value);
  const pengali = document.getElementById("vPaxPengali").value;
  let mult = 1;
  
  if (pengali === "orang") mult = vConfOrang();
  else if (pengali === "undangan") mult = vConfUndangan();
  else if (pengali === "manual") mult = parseInt(document.getElementById("vPaxManualVal").value) || 1;
  
  const vHarga = document.getElementById("vHarga");
  if (force || num(vHarga.value) === 0) {
    vHarga.value = grp(hpax * mult);
  }
}

function openVendorModal(id = null) {
  editVendorId = id;
  const mod = document.getElementById("vendorModal");
  const frm = document.getElementById("vendorForm");
  frm.reset();

  const tOrang = vConfOrang();
  const tUndang = vConfUndangan();
  const optOrang = document.getElementById("optOrang");
  const optUndang = document.getElementById("optUndangan");
  if(optOrang) optOrang.textContent = `Tamu dikonfirmasi — ${tOrang} orang`;
  if(optUndang) optUndang.textContent = `Undangan dikonfirmasi — ${tUndang}`;

  // Populate category options
  const catSel = document.getElementById("vCatSel");
  if (catSel) {
    catSel.innerHTML = VENDOR_CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  }

  const vTipe = document.getElementById("vTipeHarga");
  const vHpax = document.getElementById("vHargaPax");
  const vPpengali = document.getElementById("vPaxPengali");
  const vPman = document.getElementById("vPaxManualVal");

  if (id) {
    const v = vendors.find(x => x.id === id);
    if (v) {
      if(catSel) catSel.value = v.category;
      document.getElementById("vNama").value = v.nama;
      document.getElementById("vAlamat").value = v.alamat;
      document.getElementById("vHp").value = v.hp;
      document.getElementById("vHarga").value = grp(v.harga) || 0;
      document.getElementById("vDesc").value = v.deskripsi;
      if(vTipe) vTipe.value = v.tipeHarga || "paket";
      if(vHpax) vHpax.value = grp(v.hargaPax || 0);
      if(vPpengali) vPpengali.value = v.paxPengali || "orang";
      if(vPman) vPman.value = v.paxManualVal || 1;
      document.getElementById("vModalTitle").textContent = "Edit Vendor";
    }
  } else {
    if(catSel) catSel.value = vFilter; // default to current tab
    document.getElementById("vHarga").value = "0";
    if(vTipe) vTipe.value = "paket";
    if(vHpax) vHpax.value = "";
    if(vPpengali) vPpengali.value = "orang";
    if(vPman) vPman.value = 1;
    document.getElementById("vModalTitle").textContent = "Tambah Vendor";
  }

  togglePaxFields();

  mod.classList.add("show");
  document.getElementById("vNama").focus();
}

function bindVendorEvents() {
  document.getElementById("addVendorBtn")?.addEventListener("click", () => openVendorModal());
  document.getElementById("vCancelBtn")?.addEventListener("click", () => document.getElementById("vendorModal").classList.remove("show"));

  document.getElementById("vTipeHarga")?.addEventListener("change", togglePaxFields);
  document.getElementById("vPaxPengali")?.addEventListener("change", () => { togglePaxFields(); calculatePaxTotal(true); });
  document.getElementById("vHargaPax")?.addEventListener("input", function() {
    this.value = grp(num(this.value));
    calculatePaxTotal(true);
  });
  document.getElementById("vPaxManualVal")?.addEventListener("input", () => calculatePaxTotal(true));

  document.getElementById("vendorForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const catSel = document.getElementById("vCatSel");
    const vData = {
      category: catSel ? catSel.value : vFilter,
      nama: document.getElementById("vNama").value.trim(),
      alamat: document.getElementById("vAlamat").value.trim(),
      hp: document.getElementById("vHp").value.trim(),
      harga: num(document.getElementById("vHarga").value),
      deskripsi: document.getElementById("vDesc").value.trim(),
      tipeHarga: document.getElementById("vTipeHarga")?.value || "paket",
      hargaPax: num(document.getElementById("vHargaPax")?.value || 0),
      paxPengali: document.getElementById("vPaxPengali")?.value || "orang",
      paxManualVal: parseInt(document.getElementById("vPaxManualVal")?.value) || 1
    };

    if (!vData.nama) return;

    if (editVendorId) {
      const idx = vendors.findIndex(x => x.id === editVendorId);
      if (idx > -1) {
        const oldV = vendors[idx];
        vData.id = oldV.id;
        vData.jadi = oldV.jadi;
        vendors[idx] = vData;
        if (vData.jadi) handleVendorDecision(vData, true); // Update budget amounts
      }
    } else {
      vData.id = vendors.length ? Math.max(...vendors.map(x => x.id)) + 1 : 1;
      vData.jadi = false;
      vendors.push(vData);
    }

    saveV();
    document.getElementById("vendorModal").classList.remove("show");
    if (vFilter !== vData.category && !editVendorId) {
      // Switch to new category if added
      vFilter = vData.category;
      setupVendorChips();
    }
    renderVendors();
  });

  // Format currency in input
  const vHargaInput = document.getElementById("vHarga");
  if (vHargaInput) {
    vHargaInput.addEventListener("input", function() {
      let val = num(this.value);
      if (!val) val = 0;
      this.value = grp(val);
    });
  }
}

// Populate the bulk-edit category dropdown from VENDOR_CATEGORIES
function setupVendorBulkSelect() {
  const sel = document.getElementById("bulkVKat");
  if (!sel) return;
  sel.innerHTML = `<option value="">-- Biarkan (Tidak Diubah) --</option>` +
    VENDOR_CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

// Will be called from app.js init or tab switch
window.initVendors = function() {
  setupVendorChips();
  setupVendorBulkSelect();
  bindVendorEvents();
}
