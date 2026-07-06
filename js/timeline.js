// js/timeline.js — papan deadline: tugas manual + jatuh tempo otomatis dari Budget

const timelineBody = document.getElementById("timelineBody");

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Baris read-only yang ditarik dari item Budget yang punya jatuh tempo
function budgetTimelineRows() {
  if (typeof budget === "undefined") return [];
  return budget.filter(b => b.jatuhTempo).map(b => {
    const st = typeof bStatus === "function" ? bStatus(b) : { key: "belum" };
    const status = st.key === "lunas" ? "selesai" : (st.key === "dp" ? "sedang" : "belum");
    return {
      auto: true,
      tugas: "Bayar: " + (b.item || "tanpa nama"),
      deadline: b.jatuhTempo,
      status,
      pic: "",
      tanggalSelesai: "",
      catatan: b.remarks || "Jatuh tempo pembayaran",
    };
  });
}

// Gabungan tugas manual + baris budget, diurut by deadline (kosong di akhir)
function timelineRows() {
  const manual = timeline.map(t => ({ ...t, auto: false }));
  const all = [...manual, ...budgetTimelineRows()];
  return all.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : (a.deadline > b.deadline ? 1 : 0);
  });
}

function statusOptions(val) {
  return Object.keys(TL_STATUS).map(k =>
    `<option value="${k}" ${val === k ? "selected" : ""}>${TL_STATUS[k].label}</option>`
  ).join("");
}
function picOptions(val) {
  return `<option value="" ${!val ? "selected" : ""}>—</option>` +
    Object.keys(TL_PIC).map(k =>
      `<option value="${k}" ${val === k ? "selected" : ""}>${TL_PIC[k].label}</option>`
    ).join("");
}

function renderTimeline() {
  if (!timelineBody) return;
  const today = todayISO();

  // Stats (hanya tugas manual)
  const total = timeline.length;
  const done = timeline.filter(t => t.status === "selesai").length;
  const proc = timeline.filter(t => t.status === "sedang").length;
  const overdue = timeline.filter(t => t.deadline && t.deadline < today && t.status !== "selesai").length;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set("tlTotal", total); set("tlDone", done); set("tlProgress", proc); set("tlOverdue", overdue);
  const pct = total ? Math.round(done / total * 100) : 0;
  set("tlPct", pct + "%");
  const bar = document.getElementById("tlBar"); if (bar) bar.style.width = pct + "%";

  const rows = timelineRows();
  if (!rows.length) {
    timelineBody.innerHTML = `<div class="empty">
      <div class="big">Belum ada tugas</div>
      <div>Klik "Tambah Tugas" untuk mulai, atau isi jatuh tempo di tab Budget.</div>
    </div>`;
    return;
  }

  timelineBody.innerHTML = rows.map((r, i) => {
    const od = r.deadline && r.deadline < today && r.status !== "selesai";
    const stMeta = TL_STATUS[r.status] || TL_STATUS.belum;

    if (r.auto) {
      const picTxt = "—";
      return `<div class="tl-row tl-auto${od ? " tl-overdue" : ""}">
        <div class="tl-no">${i + 1}</div>
        <div class="tl-tugas"><span class="tl-src">Budget</span><span class="tl-auto-name">${esc(r.tugas)}</span></div>
        <div class="bm-lbl ld">Deadline</div>
        <div class="tl-cell tl-ro">${fmtDate(r.deadline)}</div>
        <div class="bm-lbl ls">Status</div>
        <div class="tl-cell"><span class="chip" style="background:${stMeta.bg};color:${stMeta.text}"><span class="cdot" style="background:${stMeta.color}"></span>${stMeta.label}</span></div>
        <div class="bm-lbl lp">PIC</div>
        <div class="tl-cell tl-ro">${picTxt}</div>
        <div class="bm-lbl lf">Tgl Selesai</div>
        <div class="tl-cell tl-ro">—</div>
        <div class="bm-lbl lc">Catatan</div>
        <div class="tl-catatan tl-ro">${esc(r.catatan)}</div>
        <div class="tl-act"></div>
      </div>`;
    }

    return `<div class="tl-row${od ? " tl-overdue" : ""}" data-id="${r.id}">
      <div class="tl-no">${i + 1}</div>
      <div class="tl-tugas"><input type="text" data-tf="tugas" value="${esc(r.tugas)}" placeholder="Nama tugas..."></div>
      <div class="bm-lbl ld">Deadline</div>
      <div class="tl-cell"><input type="date" data-tf="deadline" value="${r.deadline || ""}"></div>
      <div class="bm-lbl ls">Status</div>
      <div class="tl-cell"><select data-tf="status" class="tl-status tl-st-${r.status}">${statusOptions(r.status)}</select></div>
      <div class="bm-lbl lp">PIC</div>
      <div class="tl-cell"><select data-tf="pic" class="tl-pic tl-pic-${r.pic || "none"}">${picOptions(r.pic)}</select></div>
      <div class="bm-lbl lf">Tgl Selesai</div>
      <div class="tl-cell"><input type="date" data-tf="tanggalSelesai" value="${r.tanggalSelesai || ""}"></div>
      <div class="bm-lbl lc">Catatan</div>
      <div class="tl-catatan"><input type="text" data-tf="catatan" value="${esc(r.catatan)}" placeholder="—"></div>
      <div class="tl-act">
        <button class="icon-btn del-tl-btn" title="Hapus tugas"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
      </div>
    </div>`;
  }).join("");
}

// Add task
document.getElementById("addTimelineBtn")?.addEventListener("click", () => {
  const id = timeline.length ? Math.max(...timeline.map(t => t.id)) + 1 : 1;
  timeline.push({ id, tugas: "", deadline: "", status: "belum", pic: "", tanggalSelesai: "", catatan: "" });
  saveTL();
  renderTimeline();
  const inputs = timelineBody.querySelectorAll('.tl-row[data-id] input[data-tf="tugas"]');
  if (inputs.length) { const last = inputs[inputs.length - 1]; last.scrollIntoView({ block: "center" }); last.focus(); }
});

if (timelineBody) {
  // Text fields: save only, no re-render (keep focus)
  timelineBody.addEventListener("input", e => {
    const el = e.target;
    if (!el.matches("input[data-tf]")) return;
    const f = el.dataset.tf;
    if (f !== "tugas" && f !== "catatan") return;
    const row = el.closest(".tl-row[data-id]");
    const t = row && timeline.find(x => x.id === parseInt(row.dataset.id));
    if (t) { t[f] = el.value; saveTL(); }
  });

  // Date & select: save + re-render (re-sort + recolor)
  timelineBody.addEventListener("change", e => {
    const el = e.target;
    if (!el.matches("[data-tf]")) return;
    const f = el.dataset.tf;
    const row = el.closest(".tl-row[data-id]");
    const t = row && timeline.find(x => x.id === parseInt(row.dataset.id));
    if (!t) return;
    t[f] = el.value;
    // Auto-stamp tanggal selesai saat ditandai selesai (kalau masih kosong)
    if (f === "status" && el.value === "selesai" && !t.tanggalSelesai) t.tanggalSelesai = todayISO();
    saveTL();
    renderTimeline();
  });

  // Delete task
  timelineBody.addEventListener("click", e => {
    const del = e.target.closest(".del-tl-btn");
    if (!del) return;
    const row = del.closest(".tl-row[data-id]");
    const t = row && timeline.find(x => x.id === parseInt(row.dataset.id));
    if (t && confirm(`Hapus tugas "${t.tugas || "tanpa nama"}"?`)) {
      timeline = timeline.filter(x => x.id !== t.id);
      saveTL();
      renderTimeline();
    }
  });

  // Auto-remove empty task on blur
  timelineBody.addEventListener("focusout", e => {
    if (!e.target.matches('input[data-tf="tugas"]') || e.target.value.trim() !== "") return;
    const row = e.target.closest(".tl-row[data-id]");
    const t = row && timeline.find(x => x.id === parseInt(row.dataset.id));
    if (t && !t.deadline && !t.catatan) {
      timeline = timeline.filter(x => x.id !== t.id);
      saveTL();
      renderTimeline();
    }
  });
}
