// js/admin.js — checklist administrasi nikah, dikelompokkan per bagian (pria/wanita/lainnya)

const adminBody = document.getElementById("adminBody");

function nextGroupId() {
  return admin.length ? Math.max(...admin.map(g => g.id)) + 1 : 1;
}
function nextItemId(group) {
  return group.items.length ? Math.max(...group.items.map(i => i.id)) + 1 : 1;
}

function renderAdmin() {
  if (!adminBody) return;

  // Stats
  let total = 0, done = 0;
  admin.forEach(g => g.items.forEach(it => { total++; if (it.status) done++; }));
  const aTI = document.getElementById("aTotalItems");
  const aTD = document.getElementById("aTotalDone");
  const aTL = document.getElementById("aTotalLeft");
  if (aTI) aTI.textContent = total;
  if (aTD) aTD.textContent = done;
  if (aTL) aTL.textContent = total - done;
  const pct = total ? Math.round(done / total * 100) : 0;
  const aPct = document.getElementById("aPct");
  const aBar = document.getElementById("aBar");
  if (aPct) aPct.textContent = pct + "%";
  if (aBar) aBar.style.width = pct + "%";

  if (!admin.length) {
    adminBody.innerHTML = `<div class="card"><div class="empty">
      <div class="big">Belum ada bagian</div>
      <div>Klik "Tambah Bagian" untuk membuat daftar syarat baru.</div>
    </div></div>`;
    return;
  }

  adminBody.innerHTML = admin.map(g => {
    const gDone = g.items.filter(i => i.status).length;
    const rows = g.items.length ? g.items.map((it, i) => `
      <div class="adm-row${it.status ? " done" : ""}" data-gid="${g.id}" data-id="${it.id}">
        <div class="adm-no">${i + 1}</div>
        <div class="adm-syarat"><input type="text" data-af="syarat" value="${esc(it.syarat)}" placeholder="Tulis syarat..."></div>
        <div class="adm-stat">
          <label class="switch" title="Sudah lengkap?">
            <input type="checkbox" data-a-stat ${it.status ? "checked" : ""}>
            <span class="slider"></span>
          </label>
          <span class="v-lbl">${it.status ? "Sudah" : "Belum"}</span>
        </div>
        <div class="adm-act r">
          <button class="icon-btn del-a-btn" title="Hapus syarat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
        </div>
      </div>`).join("") : `<div class="empty" style="padding:28px 20px"><div>Belum ada syarat di bagian ini.</div></div>`;

    return `<div class="card adm-group" data-gid="${g.id}">
      <div class="adm-group-head">
        <input type="text" class="adm-grup-name" data-grup value="${esc(g.grup)}" placeholder="Nama bagian...">
        <span class="adm-badge">${gDone}/${g.items.length}</span>
        <button class="icon-btn adm-add-item" title="Tambah syarat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Syarat
        </button>
        <button class="icon-btn del-group-btn" title="Hapus bagian"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
      <div class="adm-head">
        <div>No</div><div>Syarat</div><div>Status</div><div></div>
      </div>
      <div class="adm-rows">${rows}</div>
    </div>`;
  }).join("");
}

// Add a new section/group
document.getElementById("addAdminGroupBtn")?.addEventListener("click", () => {
  const name = prompt("Nama bagian baru (cth: Saksi, Wali, dll):");
  if (!name || !name.trim()) return;
  admin.push({ id: nextGroupId(), grup: name.trim(), items: [] });
  saveA();
  renderAdmin();
  const groups = adminBody.querySelectorAll(".adm-group");
  if (groups.length) groups[groups.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
});

if (adminBody) {
  // Edit syarat text / rename group (live, no re-render to keep focus)
  adminBody.addEventListener("input", e => {
    const el = e.target;
    if (el.matches("input[data-af='syarat']")) {
      const row = el.closest(".adm-row");
      const g = admin.find(x => x.id === parseInt(row.dataset.gid));
      const it = g && g.items.find(x => x.id === parseInt(row.dataset.id));
      if (it) { it.syarat = el.value; saveA(); }
    } else if (el.matches("input[data-grup]")) {
      const card = el.closest(".adm-group");
      const g = admin.find(x => x.id === parseInt(card.dataset.gid));
      if (g) { g.grup = el.value; saveA(); }
    }
  });

  // Toggle status
  adminBody.addEventListener("change", e => {
    const el = e.target;
    if (el.matches("input[data-a-stat]")) {
      const row = el.closest(".adm-row");
      const g = admin.find(x => x.id === parseInt(row.dataset.gid));
      const it = g && g.items.find(x => x.id === parseInt(row.dataset.id));
      if (it) { it.status = el.checked; saveA(); renderAdmin(); }
    }
  });

  // Add item, delete item, delete group
  adminBody.addEventListener("click", e => {
    const addBtn = e.target.closest(".adm-add-item");
    const delItem = e.target.closest(".del-a-btn");
    const delGroup = e.target.closest(".del-group-btn");

    if (addBtn) {
      const g = admin.find(x => x.id === parseInt(addBtn.closest(".adm-group").dataset.gid));
      if (g) {
        g.items.push({ id: nextItemId(g), syarat: "", status: false });
        saveA();
        renderAdmin();
        const rows = adminBody.querySelectorAll(`.adm-group[data-gid="${g.id}"] .adm-row input[data-af='syarat']`);
        if (rows.length) { const last = rows[rows.length - 1]; last.scrollIntoView({ block: "center" }); last.focus(); }
      }
    } else if (delItem) {
      const row = delItem.closest(".adm-row");
      const g = admin.find(x => x.id === parseInt(row.dataset.gid));
      if (g) {
        g.items = g.items.filter(x => x.id !== parseInt(row.dataset.id));
        saveA();
        renderAdmin();
      }
    } else if (delGroup) {
      const g = admin.find(x => x.id === parseInt(delGroup.closest(".adm-group").dataset.gid));
      if (g && confirm(`Hapus bagian "${g.grup}" beserta semua syaratnya?`)) {
        admin = admin.filter(x => x.id !== g.id);
        saveA();
        renderAdmin();
      }
    }
  });

  // Auto-remove empty syarat on blur
  adminBody.addEventListener("focusout", e => {
    if (e.target.matches("input[data-af='syarat']") && e.target.value.trim() === "") {
      const row = e.target.closest(".adm-row");
      const g = admin.find(x => x.id === parseInt(row.dataset.gid));
      if (g) {
        g.items = g.items.filter(x => x.id !== parseInt(row.dataset.id));
        saveA();
        renderAdmin();
      }
    }
  });
}
