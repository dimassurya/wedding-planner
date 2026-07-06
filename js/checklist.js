// js/checklist.js — checklist persiapan, dikelompokkan per fase waktu (H-6 .. H-1, dst)

const checklistBody = document.getElementById("checklistBody");

function nextFaseId() {
  return checklist.length ? Math.max(...checklist.map(g => g.id)) + 1 : 1;
}
function nextTugasId(fase) {
  return fase.items.length ? Math.max(...fase.items.map(i => i.id)) + 1 : 1;
}

function renderChecklist() {
  if (!checklistBody) return;

  // Stats
  let total = 0, done = 0;
  checklist.forEach(g => g.items.forEach(it => { total++; if (it.status) done++; }));
  const ckTI = document.getElementById("ckTotalItems");
  const ckTD = document.getElementById("ckTotalDone");
  const ckTL = document.getElementById("ckTotalLeft");
  if (ckTI) ckTI.textContent = total;
  if (ckTD) ckTD.textContent = done;
  if (ckTL) ckTL.textContent = total - done;
  const pct = total ? Math.round(done / total * 100) : 0;
  const ckPct = document.getElementById("ckPct");
  const ckBar = document.getElementById("ckBar");
  if (ckPct) ckPct.textContent = pct + "%";
  if (ckBar) ckBar.style.width = pct + "%";

  if (!checklist.length) {
    checklistBody.innerHTML = `<div class="card"><div class="empty">
      <div class="big">Belum ada fase</div>
      <div>Klik "Tambah Fase" untuk membuat daftar tugas baru.</div>
    </div></div>`;
    return;
  }

  checklistBody.innerHTML = `<div class="ck-grid">` + checklist.map(g => {
    const gDone = g.items.filter(i => i.status).length;
    const rows = g.items.length ? g.items.map(it => `
      <div class="ck-row${it.status ? " done" : ""}" data-gid="${g.id}" data-id="${it.id}">
        <label class="switch" title="Selesai?">
          <input type="checkbox" data-ck-stat ${it.status ? "checked" : ""}>
          <span class="slider"></span>
        </label>
        <div class="ck-tugas"><input type="text" data-cf="tugas" value="${esc(it.tugas)}" placeholder="Tulis tugas..."></div>
        <button class="icon-btn del-ck-btn" title="Hapus tugas"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>`).join("") : `<div class="empty" style="padding:24px 16px"><div>Belum ada tugas di fase ini.</div></div>`;

    return `<div class="card ck-fase" data-gid="${g.id}">
      <div class="ck-fase-head">
        <span class="ck-drag" title="Seret untuk pindah urutan">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="2.1"/><circle cx="15" cy="5" r="2.1"/><circle cx="9" cy="12" r="2.1"/><circle cx="15" cy="12" r="2.1"/><circle cx="9" cy="19" r="2.1"/><circle cx="15" cy="19" r="2.1"/></svg>
        </span>
        <input type="text" class="ck-fase-name" data-fase value="${esc(g.fase)}" placeholder="Nama fase...">
        <span class="ck-badge">${gDone}/${g.items.length}</span>
        <button class="icon-btn ck-add-item" title="Tambah tugas">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
        </button>
        <button class="icon-btn del-fase-btn" title="Hapus fase"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
      <div class="ck-rows">${rows}</div>
    </div>`;
  }).join("") + `</div>`;
}

// Add a new phase/group
document.getElementById("addChecklistGroupBtn")?.addEventListener("click", () => {
  const name = prompt("Nama fase baru (cth: Hari-H, H-1 Minggu, dll):");
  if (!name || !name.trim()) return;
  checklist.push({ id: nextFaseId(), fase: name.trim(), items: [] });
  saveCK();
  renderChecklist();
  const cards = checklistBody.querySelectorAll(".ck-fase");
  if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
});

// Reorder fase cards by dragging their handle (persisted)
let ckDragCard = null;

function syncChecklistOrderFromDOM() {
  const ids = [...checklistBody.querySelectorAll(".ck-fase")].map(c => parseInt(c.dataset.gid));
  checklist.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

function ckDropTarget(grid, x, y) {
  const cards = [...grid.querySelectorAll(".ck-fase:not(.dragging)")];
  let best = null, bestDist = Infinity, before = true;
  cards.forEach(card => {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d = Math.hypot(x - cx, y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = card;
      before = (y < cy - 6) || (Math.abs(y - cy) <= r.height / 2 && x < cx);
    }
  });
  return { best, before };
}

if (checklistBody) {
  // Enable native drag only when the press starts on the grip handle
  checklistBody.addEventListener("mousedown", e => {
    const handle = e.target.closest(".ck-drag");
    if (handle) { const card = handle.closest(".ck-fase"); if (card) card.draggable = true; }
  });

  checklistBody.addEventListener("dragstart", e => {
    const card = e.target.closest(".ck-fase");
    if (!card || !card.draggable) return;
    ckDragCard = card;
    card.classList.add("dragging");
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });

  checklistBody.addEventListener("dragover", e => {
    if (!ckDragCard) return;
    e.preventDefault();
    const grid = checklistBody.querySelector(".ck-grid");
    if (!grid) return;
    const { best, before } = ckDropTarget(grid, e.clientX, e.clientY);
    if (best && best !== ckDragCard) {
      grid.insertBefore(ckDragCard, before ? best : best.nextSibling);
    }
  });

  checklistBody.addEventListener("dragend", () => {
    if (!ckDragCard) return;
    ckDragCard.classList.remove("dragging");
    ckDragCard.draggable = false;
    ckDragCard = null;
    syncChecklistOrderFromDOM();
    saveCK();
    renderChecklist();
  });

  // If the handle was pressed but no drag happened, clear the draggable flag
  document.addEventListener("mouseup", () => {
    if (ckDragCard) return;
    checklistBody.querySelectorAll('.ck-fase[draggable="true"]').forEach(c => c.draggable = false);
  });

  // Edit tugas text / rename phase (live, no re-render to keep focus)
  checklistBody.addEventListener("input", e => {
    const el = e.target;
    if (el.matches("input[data-cf='tugas']")) {
      const row = el.closest(".ck-row");
      const g = checklist.find(x => x.id === parseInt(row.dataset.gid));
      const it = g && g.items.find(x => x.id === parseInt(row.dataset.id));
      if (it) { it.tugas = el.value; saveCK(); }
    } else if (el.matches("input[data-fase]")) {
      const card = el.closest(".ck-fase");
      const g = checklist.find(x => x.id === parseInt(card.dataset.gid));
      if (g) { g.fase = el.value; saveCK(); }
    }
  });

  // Toggle status
  checklistBody.addEventListener("change", e => {
    const el = e.target;
    if (el.matches("input[data-ck-stat]")) {
      const row = el.closest(".ck-row");
      const g = checklist.find(x => x.id === parseInt(row.dataset.gid));
      const it = g && g.items.find(x => x.id === parseInt(row.dataset.id));
      if (it) { it.status = el.checked; saveCK(); renderChecklist(); }
    }
  });

  // Add tugas, delete tugas, delete fase
  checklistBody.addEventListener("click", e => {
    const addBtn = e.target.closest(".ck-add-item");
    const delItem = e.target.closest(".del-ck-btn");
    const delFase = e.target.closest(".del-fase-btn");

    if (addBtn) {
      const g = checklist.find(x => x.id === parseInt(addBtn.closest(".ck-fase").dataset.gid));
      if (g) {
        g.items.push({ id: nextTugasId(g), tugas: "", status: false });
        saveCK();
        renderChecklist();
        const inputs = checklistBody.querySelectorAll(`.ck-fase[data-gid="${g.id}"] .ck-row input[data-cf='tugas']`);
        if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: "center" }); last.focus(); }
      }
    } else if (delItem) {
      const row = delItem.closest(".ck-row");
      const g = checklist.find(x => x.id === parseInt(row.dataset.gid));
      if (g) {
        g.items = g.items.filter(x => x.id !== parseInt(row.dataset.id));
        saveCK();
        renderChecklist();
      }
    } else if (delFase) {
      const g = checklist.find(x => x.id === parseInt(delFase.closest(".ck-fase").dataset.gid));
      if (g && confirm(`Hapus fase "${g.fase}" beserta semua tugasnya?`)) {
        checklist = checklist.filter(x => x.id !== g.id);
        saveCK();
        renderChecklist();
      }
    }
  });

  // Auto-remove empty tugas on blur
  checklistBody.addEventListener("focusout", e => {
    if (e.target.matches("input[data-cf='tugas']") && e.target.value.trim() === "") {
      const row = e.target.closest(".ck-row");
      const g = checklist.find(x => x.id === parseInt(row.dataset.gid));
      if (g) {
        g.items = g.items.filter(x => x.id !== parseInt(row.dataset.id));
        saveCK();
        renderChecklist();
      }
    }
  });
}
