// js/mahar.js

const mBody = document.getElementById("maharBody");
const mTotItems = document.getElementById("mTotalItems");
const mTotSudah = document.getElementById("mTotalSudah");
const mTotHrg = document.getElementById("mTotalHarga");
const addMBtn = document.getElementById("addMaharBtn");

function renderMahar() {
  if (!mBody) return;
  if (!mahar.length) {
    mBody.innerHTML = `<div class="empty">
      <div class="big">Belum ada item mahar</div>
      <div>Klik Tambah Item untuk mulai mendata mahar Anda.</div>
    </div>`;
    updateMStats();
    return;
  }

  mBody.innerHTML = mahar.map((m, i) => {
    const sel = typeof selected !== 'undefined' && selected.has(m.id);
    return `<div class="m-row${sel ? " sel" : ""}" data-id="${m.id}">
      <div class="m-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" data-id="${m.id}" ${sel ? "checked" : ""}></div>
      <div class="m-item">
        <input type="text" data-mf="item" value="${esc(m.item)}" placeholder="Nama item...">
      </div>
      <div class="m-stat cStat">
        <label class="switch" title="Sudah Disiapkan?">
          <input type="checkbox" data-m-stat ${m.status ? "checked" : ""}>
          <span class="slider"></span>
        </label>
        <span class="v-lbl">${m.status ? 'Sudah' : 'Belum'}</span>
      </div>
      <div class="m-cell cA m-hrg">
        <span class="rp">Rp</span>
        <input type="text" inputmode="numeric" data-mf="harga" value="${grp(m.harga)}" placeholder="0">
      </div>
      <div class="m-actions r">
        <button class="icon-btn del-m-btn" title="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>`;
  }).join("");

  const sa = document.getElementById("selAllMahar");
  if (sa) sa.onchange = handleSelAll;
  mBody.querySelectorAll(".rowcbx").forEach(c => c.onchange = e => toggleSel(parseInt(e.target.dataset.id), e.target.checked));
  if (typeof updateBulkbar === 'function') updateBulkbar();

  updateMStats();
}

function updateMStats() {
  const tot = mahar.length;
  const sudah = mahar.filter(m => m.status).length;
  const tHrg = mahar.reduce((sum, m) => sum + (parseInt(m.harga) || 0), 0);
  
  if (mTotItems) mTotItems.textContent = tot;
  if (mTotSudah) mTotSudah.textContent = sudah;
  if (mTotHrg) mTotHrg.textContent = fmt(tHrg);
}

// Events
if (addMBtn) {
  addMBtn.addEventListener("click", () => {
    const itemName = prompt("Masukkan nama item mahar baru:");
    if (!itemName || !itemName.trim()) {
      toast("Nama item harus diisi");
      return;
    }
    mahar.push({
      id: Date.now(),
      item: itemName.trim(),
      status: false,
      harga: 0
    });
    saveM();
    renderMahar();
    const rows = mBody.querySelectorAll(".m-row");
    if(rows.length) rows[rows.length - 1].scrollIntoView({ behavior: "smooth" });
  });
}

if (mBody) {
  mBody.addEventListener("input", e => {
    const el = e.target;
    if (el.matches("input[inputmode='numeric']")) {
      const v = num(el.value);
      el.value = grp(v);
    }
  });

  mBody.addEventListener("change", e => {
    const el = e.target;
    const row = el.closest(".m-row");
    if (!row) return;
    const id = parseInt(row.dataset.id);
    const m = mahar.find(x => x.id === id);
    if (!m) return;

    if (el.matches("[data-m-stat]")) {
      m.status = el.checked;
      saveM();
      renderMahar();
    } else if (el.matches("[data-mf]")) {
      const field = el.dataset.mf;
      if (field === "harga") {
        m[field] = num(el.value);
      } else {
        m[field] = el.value.trim();
      }
      saveM();
      updateMStats();
    }
  });

  mBody.addEventListener("click", e => {
    const delBtn = e.target.closest(".del-m-btn");
    if (delBtn) {
      const row = delBtn.closest(".m-row");
      const id = parseInt(row.dataset.id);
      if (confirm("Hapus item mahar ini?")) {
        mahar = mahar.filter(x => x.id !== id);
        saveM();
        renderMahar();
      }
    }
  });

  mBody.addEventListener("focusout", e => {
    const el = e.target;
    if (el.matches("input[data-mf='item']")) {
      if (el.value.trim() === "") {
        const row = el.closest(".m-row");
        if (!row) return;
        const id = parseInt(row.dataset.id);
        mahar = mahar.filter(x => x.id !== id);
        saveM();
        renderMahar();
      }
    }
  });
}
