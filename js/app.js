/* ── Tab switching ── */
let tabJustDragged = false;
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    if (tabJustDragged) return;            // ignore the click that follows a drag
    if (t.classList.contains("active")) return;

    // Clear selections on tab switch
    if (typeof selected !== "undefined") selected.clear();
    const bb = document.getElementById("bulkbar");
    if (bb) bb.classList.remove("show");

    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById("panel-" + t.dataset.tab).classList.add("active");

    // Keep the active tab centered when the bar scrolls horizontally (mobile),
    // scrolling only the tab strip — never the page vertically.
    const bar = t.parentElement;
    bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.clientWidth) / 2, behavior: "smooth" });

    if (t.dataset.tab === "home") {
      if (typeof renderHome === "function") renderHome();
    }
    else if (t.dataset.tab === "budget") renderBudget();
    else if (t.dataset.tab === "vendor") {
      if (typeof renderVendors === "function") renderVendors();
    }
    else if (t.dataset.tab === "seserahan") {
      if (typeof renderSeserahan === "function") renderSeserahan();
    }
    else if (t.dataset.tab === "mahar") {
      if (typeof renderMahar === "function") renderMahar();
    }
    else if (t.dataset.tab === "admin") {
      if (typeof renderAdmin === "function") renderAdmin();
    }
    else if (t.dataset.tab === "checklist") {
      if (typeof renderChecklist === "function") renderChecklist();
    }
    else if (t.dataset.tab === "timeline") {
      if (typeof renderTimeline === "function") renderTimeline();
    }
    else renderGuests();
  };
});

/* ── Drag untuk mengatur ulang urutan tab (tersimpan otomatis) ── */
const tabsBar = document.querySelector(".tabs");
const TAB_ORDER_KEY = "wp_tabOrder";
let dragTab = null;

function saveTabOrder() {
  const order = [...tabsBar.querySelectorAll(".tab")].map(t => t.dataset.tab);
  try { localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order)); } catch (e) {}
}

function applyTabOrder() {
  if (!tabsBar) return;
  let order;
  try { order = JSON.parse(localStorage.getItem(TAB_ORDER_KEY)); } catch (e) {}
  if (!Array.isArray(order)) return;
  const all = [...tabsBar.querySelectorAll(".tab")];
  const known = order.map(n => all.find(t => t.dataset.tab === n)).filter(Boolean);
  const rest = all.filter(t => !order.includes(t.dataset.tab));   // tab baru → taruh di akhir
  [...known, ...rest].forEach(t => tabsBar.appendChild(t));
}

function tabAfterPoint(x) {
  return [...tabsBar.querySelectorAll(".tab:not(.dragging)")].find(t => {
    const r = t.getBoundingClientRect();
    return x < r.left + r.width / 2;
  });
}

if (tabsBar) {
  tabsBar.querySelectorAll(".tab").forEach(tab => {
    tab.setAttribute("draggable", "true");
    tab.addEventListener("dragstart", e => {
      dragTab = tab;
      tab.classList.add("dragging");
      tabsBar.classList.add("reordering");
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; }
    });
    tab.addEventListener("dragend", () => {
      tab.classList.remove("dragging");
      tabsBar.classList.remove("reordering");
      dragTab = null;
      saveTabOrder();
      tabJustDragged = true;
      setTimeout(() => { tabJustDragged = false; }, 60);
    });
  });

  tabsBar.addEventListener("dragover", e => {
    if (!dragTab) return;
    e.preventDefault();
    const after = tabAfterPoint(e.clientX);
    if (after) tabsBar.insertBefore(dragTab, after);
    else tabsBar.appendChild(dragTab);
  });
}

applyTabOrder();

/* ── Close modals on Escape ── */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".overlay.show").forEach(o => o.classList.remove("show"));
  }
});

/* ── Boot ── */
init();
if (typeof window.initVendors === "function") window.initVendors();
renderGuests();
if (typeof renderHome === "function") renderHome();

/* ✨ Universal Bulk Actions ✨ */
window.toggleSel = function(id, on) {
  on ? selected.add(id) : selected.delete(id);
  const r = document.querySelector(`[data-id="${id}"]`);
  if (r) r.classList.toggle("sel", on);
  updateBulkbar();
};

window.updateBulkbar = function() {
  const n = selected.size;
  const bulkCount = document.getElementById("bulkCount");
  const bulkbar = document.getElementById("bulkbar");
  if (bulkCount) bulkCount.textContent = n;
  if (bulkbar) bulkbar.classList.toggle("show", n > 0);
  
  // Update Select All Checkbox
  const tab = getActiveTab();
  let items = [];
  if (tab === "tamu") items = typeof visibleGuests === 'function' ? visibleGuests() : [];
  else if (tab === "vendor") items = vendors || [];
  else if (tab === "budget") items = budget || [];
  else if (tab === "seserahan") items = seserahan || [];
  else if (tab === "mahar") items = mahar || [];

  const vis = items.filter(x => {
    if (tab === "budget" && window.bFilter && window.bFilter !== "all" && x.kategori !== window.bFilter) return false;
    if (tab === "vendor" && window.vFilter && window.vFilter !== "all" && x.category !== window.vFilter) return false;
    return true;
  });

  const all = vis.length > 0 && vis.every(x => selected.has(x.id));
  const saId = `selAll${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
  const sa = document.getElementById(saId) || document.getElementById("selAll");
  if (sa) {
    sa.checked = all;
    sa.indeterminate = !all && vis.some(x => selected.has(x.id));
  }
};

window.handleSelAll = function(e) {
  const on = e.target.checked;
  const tab = getActiveTab();
  let items = [];
  if (tab === "tamu") items = typeof visibleGuests === 'function' ? visibleGuests() : [];
  else if (tab === "vendor") items = vendors || [];
  else if (tab === "budget") items = budget || [];
  else if (tab === "seserahan") items = seserahan || [];
  else if (tab === "mahar") items = mahar || [];

  const vis = items.filter(x => {
    if (tab === "budget" && window.bFilter && window.bFilter !== "all" && x.kategori !== window.bFilter) return false;
    if (tab === "vendor" && window.vFilter && window.vFilter !== "all" && x.category !== window.vFilter) return false;
    return true;
  });

  vis.forEach(x => { on ? selected.add(x.id) : selected.delete(x.id); });
  reRenderActive();
};

const getActiveTab = () => {
  const active = document.querySelector(".tab.active");
  return active ? active.dataset.tab : "tamu";
};

const reRenderActive = () => {
  const tab = getActiveTab();
  if (tab === "tamu") { if (typeof renderGuests === 'function') renderGuests(); }
  else if (tab === "vendor") { if (typeof renderVendors === 'function') renderVendors(); }
  else if (tab === "budget") { if (typeof renderBudget === 'function') renderBudget(); }
  else if (tab === "seserahan") { if (typeof renderSeserahan === 'function') renderSeserahan(); }
  else if (tab === "mahar") { if (typeof renderMahar === 'function') renderMahar(); }
};

const bulkClearBtn = document.getElementById("bulkClearBtn");
if (bulkClearBtn) bulkClearBtn.onclick = () => { 
  selected.clear(); 
  updateBulkbar();
  reRenderActive();
};

const bulkDelBtn = document.getElementById("bulkDelBtn");
if (bulkDelBtn) bulkDelBtn.onclick = () => {
  const n = selected.size;
  if (!n) return;
  const tab = getActiveTab();
  if (!confirm(`Hapus ${n} item terpilih dari data ${tab}?`)) return;

  if (tab === "tamu") { guests = guests.filter(x => !selected.has(x.id)); saveG(); }
  else if (tab === "vendor") { vendors = vendors.filter(x => !selected.has(x.id)); saveV(); }
  else if (tab === "budget") { budget = budget.filter(x => !selected.has(x.id)); saveB(); }
  else if (tab === "seserahan") { seserahan = seserahan.filter(x => !selected.has(x.id)); saveS(); }
  else if (tab === "mahar") { mahar = mahar.filter(x => !selected.has(x.id)); saveM(); }

  selected.clear();
  updateBulkbar();
  reRenderActive();
  toast(`${n} item dihapus`);
};

const bulkOverlay = document.getElementById("bulkOverlay");
const bulkEditBtn = document.getElementById("bulkEditBtn");

if (bulkEditBtn) bulkEditBtn.onclick = () => {
  if (!selected.size) return;
  document.getElementById("bulkSub").textContent = `${selected.size} item akan diubah`;
  const tab = getActiveTab();

  document.getElementById("bgTamu").style.display = "none";
  document.getElementById("bgVendor").style.display = "none";
  document.getElementById("bgBudget").style.display = "none";
  document.getElementById("bgItem").style.display = "none";

  if (tab === "tamu") document.getElementById("bgTamu").style.display = "block";
  else if (tab === "vendor") document.getElementById("bgVendor").style.display = "block";
  else if (tab === "budget") document.getElementById("bgBudget").style.display = "block";
  else if (tab === "seserahan" || tab === "mahar") document.getElementById("bgItem").style.display = "block";

  // Reset values
  document.querySelectorAll("#bulkOverlay select").forEach(s => s.value = "");
  document.querySelectorAll("#bulkOverlay input").forEach(i => i.value = "");

  bulkOverlay.classList.add("show");
};

const bulkCancel = document.getElementById("bulkCancel");
if (bulkCancel) bulkCancel.onclick = () => bulkOverlay.classList.remove("show");
if (bulkOverlay) bulkOverlay.onclick = e => { if (e.target === bulkOverlay) bulkOverlay.classList.remove("show"); };

const bulkApply = document.getElementById("bulkApply");
if (bulkApply) bulkApply.onclick = () => {
  const tab = getActiveTab();
  let c = 0;

  if (tab === "tamu") {
    const st = document.getElementById("bulkStatus").value;
    const un = document.getElementById("bulkUndangan").value;
    const kf = document.getElementById("bulkKonfirmasi").value;
    if (!st && !un && !kf) { toast("Pilih minimal satu perubahan"); return; }
    guests.forEach(g => { if (selected.has(g.id)) { if (st) g.status = st; if (un) g.undangan = un; if (kf) g.konfirmasi = (kf === "ya"); c++; } });
    if (c) saveG();
  }
  else if (tab === "vendor") {
    const kat = document.getElementById("bulkVKat").value;
    const stat = document.getElementById("bulkVStat").value;
    if (!kat && !stat) { toast("Pilih minimal satu perubahan"); return; }
    vendors.forEach(v => {
      if (selected.has(v.id)) {
        if (kat) v.category = kat;
        if (stat) {
          v.jadi = (stat === "jadi");
          if (typeof handleVendorDecision === 'function') handleVendorDecision(v, v.jadi);
        }
        c++;
      }
    });
    if (c) saveV();
  }
  else if (tab === "budget") {
    const stat = document.getElementById("bulkBStat").value;
    const due = document.getElementById("bulkBDue").value;
    if (!stat && !due) { toast("Pilih minimal satu perubahan"); return; }
    budget.forEach(b => {
      if (selected.has(b.id)) {
        if (stat === "lunas") b.dibayar = b.aktual;
        else if (stat === "belum") b.dibayar = 0;
        if (due) b.jatuhTempo = due;
        c++;
      }
    });
    if (c) saveB();
  }
  else if (tab === "seserahan") {
    const stat = document.getElementById("bulkIStat").value;
    if (!stat) { toast("Pilih minimal satu perubahan"); return; }
    const isSudah = stat === "sudah";
    seserahan.forEach(x => { if (selected.has(x.id)) { x.status = isSudah; c++; } });
    if (c) saveS();
  }
  else if (tab === "mahar") {
    const stat = document.getElementById("bulkIStat").value;
    if (!stat) { toast("Pilih minimal satu perubahan"); return; }
    const isSudah = stat === "sudah";
    mahar.forEach(x => { if (selected.has(x.id)) { x.status = isSudah; c++; } });
    if (c) saveM();
  }

  bulkOverlay.classList.remove("show");
  if (c) {
    selected.clear();
    updateBulkbar();
    reRenderActive();
    toast(`Berhasil mengubah ${c} item`);
  }
};
