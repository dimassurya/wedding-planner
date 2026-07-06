// js/seserahan.js

const sBody = document.getElementById("seserahanBody");
const sTotItems = document.getElementById("sTotalItems");
const sTotSudah = document.getElementById("sTotalSudah");
const sTotBud = document.getElementById("sTotalBudget");
const sTotHrg = document.getElementById("sTotalHarga");
const addSBtn = document.getElementById("addSeserahanBtn");

function renderSeserahan() {
  if (!sBody) return;
  if (!seserahan.length) {
    sBody.innerHTML = `<div class="empty">
      <div class="big">Belum ada item seserahan</div>
      <div>Klik Tambah Item untuk mulai mendata seserahan Anda.</div>
    </div>`;
    updateSStats();
    return;
  }

  sBody.innerHTML = seserahan.map((s, i) => {
    const sel = typeof selected !== 'undefined' && selected.has(s.id);
    return `<div class="s-row${sel ? " sel" : ""}" data-id="${s.id}">
      <div class="s-cbx cbx-cell"><input type="checkbox" class="cbx rowcbx" data-id="${s.id}" ${sel ? "checked" : ""}></div>
      <div class="s-item">
        <input type="text" data-sf="item" value="${esc(s.item)}" placeholder="Nama item...">
      </div>
      <div class="s-stat cStat">
        ${WPUI.switchToggle({ title: "Sudah Dibeli?", inputHTML: `<input type="checkbox" data-s-stat ${s.status ? "checked" : ""}>` })}
        <span class="v-lbl">${s.status ? 'Sudah' : 'Belum'}</span>
      </div>
      <div class="s-cell cE s-bud">
        <span class="rp">Rp</span>
        <input type="text" inputmode="numeric" data-sf="budget" value="${grp(s.budget)}" placeholder="0">
      </div>
      <div class="s-cell cA s-hrg">
        <span class="rp">Rp</span>
        <input type="text" inputmode="numeric" data-sf="harga" value="${grp(s.harga)}" placeholder="0">
      </div>
      <div class="s-link">
        <input type="text" data-sf="link" value="${esc(s.link)}" placeholder="https://...">
        <button class="icon-btn" title="Buka Link" onclick="openLink('${esc(s.link)}')" ${!s.link ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </button>
      </div>
      <div class="s-actions r">
        <button class="icon-btn del-s-btn" title="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>`;
  }).join("");

  const sa = document.getElementById("selAllSeserahan");
  if (sa) sa.onchange = handleSelAll;
  sBody.querySelectorAll(".rowcbx").forEach(c => c.onchange = e => toggleSel(parseInt(e.target.dataset.id), e.target.checked));
  if (typeof updateBulkbar === 'function') updateBulkbar();

  updateSStats();
}

function updateSStats() {
  const tot = seserahan.length;
  const sudah = seserahan.filter(s => s.status).length;
  const tBud = seserahan.reduce((sum, s) => sum + (parseInt(s.budget) || 0), 0);
  const tHrg = seserahan.reduce((sum, s) => sum + (parseInt(s.harga) || 0), 0);
  
  if (sTotItems) sTotItems.textContent = tot;
  if (sTotSudah) sTotSudah.textContent = sudah;
  if (sTotBud) sTotBud.textContent = fmt(tBud);
  if (sTotHrg) sTotHrg.textContent = fmt(tHrg);
}

// Events
if (addSBtn) {
  addSBtn.addEventListener("click", () => {
    const itemName = prompt("Masukkan nama item seserahan baru:");
    if (!itemName || !itemName.trim()) {
      toast("Nama item harus diisi");
      return;
    }
    seserahan.push({
      id: Date.now(),
      item: itemName.trim(),
      status: false,
      budget: 0,
      harga: 0,
      link: ""
    });
    saveS();
    renderSeserahan();
    const rows = sBody.querySelectorAll(".s-row");
    if(rows.length) rows[rows.length - 1].scrollIntoView({ behavior: "smooth" });
  });
}

if (sBody) {
  sBody.addEventListener("input", e => {
    const el = e.target;
    if (el.matches("input[inputmode='numeric']")) {
      const v = num(el.value);
      el.value = grp(v);
    }
  });

  sBody.addEventListener("change", e => {
    const el = e.target;
    const row = el.closest(".s-row");
    if (!row) return;
    const id = parseInt(row.dataset.id);
    const s = seserahan.find(x => x.id === id);
    if (!s) return;

    if (el.matches("[data-s-stat]")) {
      s.status = el.checked;
      saveS();
      renderSeserahan();
    } else if (el.matches("[data-sf]")) {
      const field = el.dataset.sf;
      if (field === "budget" || field === "harga") {
        s[field] = num(el.value);
      } else {
        s[field] = el.value.trim();
      }
      saveS();
      // Only re-render if it's the link field (to update the button state)
      if (field === "link") {
        renderSeserahan();
      } else {
        updateSStats();
      }
    }
  });

  sBody.addEventListener("click", e => {
    const delBtn = e.target.closest(".del-s-btn");
    if (delBtn) {
      const row = delBtn.closest(".s-row");
      const id = parseInt(row.dataset.id);
      if (confirm("Hapus item seserahan ini?")) {
        seserahan = seserahan.filter(x => x.id !== id);
        saveS();
        renderSeserahan();
      }
    }
  });

  sBody.addEventListener("focusout", e => {
    const el = e.target;
    if (el.matches("input[data-sf='item']")) {
      if (el.value.trim() === "") {
        const row = el.closest(".s-row");
        if (!row) return;
        const id = parseInt(row.dataset.id);
        seserahan = seserahan.filter(x => x.id !== id);
        saveS();
        renderSeserahan();
      }
    }
  });
}
