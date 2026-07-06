/* ── Setup dropdowns ── */
const gmJumlah = document.getElementById("gmJumlah");
for (let i = 1; i <= 10; i++) {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = i + " orang";
  gmJumlah.appendChild(o);
}

function fillStatus(sel, withBlank) {
  if (withBlank) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "— jangan ubah —";
    sel.appendChild(o);
  }
  ORDER.forEach(k => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = META[k].label;
    sel.appendChild(o);
  });
}
fillStatus(document.getElementById("gmStatus"), false);
fillStatus(document.getElementById("bulkStatus"), true);

const gFilterEl = document.getElementById("gFilter");
ORDER.forEach(k => {
  const o = document.createElement("option");
  o.value = k;
  o.textContent = META[k].label;
  gFilterEl.appendChild(o);
});

/* ── Rendering ── */
const gSearch = document.getElementById("gSearch");
gSearch.oninput = renderGuests;
gFilterEl.onchange = renderGuests;

function visibleGuests() {
  const q = gSearch.value.trim().toLowerCase();
  const f = gFilterEl.value;
  return guests.filter(g => (f === "all" || g.status === f) && g.nama.toLowerCase().includes(q));
}

// Yang dihitung di statistik hanyalah tamu yang dikonfirmasi (jadi diundang).
const isConfirmed = g => g.konfirmasi !== false;

function renderGuests() {
  // Statistik dari tamu terkonfirmasi saja
  const confirmedList = guests.filter(isConfirmed);
  const totalEntri = confirmedList.length;
  const totalOrang = confirmedList.reduce((s, g) => s + g.jumlah, 0);
  const byPax = {}, byCnt = {};
  ORDER.forEach(k => { byPax[k] = 0; byCnt[k] = 0; });
  let pria = 0, wanita = 0;

  confirmedList.forEach(g => {
    const m = META[g.status] || META.lainnya;
    byPax[g.status] = (byPax[g.status] || 0) + g.jumlah;
    byCnt[g.status] = (byCnt[g.status] || 0) + 1;
    if (m.side === "pria") pria += g.jumlah;
    else if (m.side === "wanita") wanita += g.jumlah;
  });

  document.getElementById("sEntri").textContent = totalEntri;
  document.getElementById("sOrang").textContent = totalOrang.toLocaleString("id-ID");
  document.getElementById("sPria").textContent = pria.toLocaleString("id-ID");
  document.getElementById("sWanita").textContent = wanita.toLocaleString("id-ID");

  // Info berapa yang sudah dikonfirmasi dari total daftar
  const cap = document.getElementById("gConfirmInfo");
  if (cap) {
    const belum = guests.length - totalEntri;
    cap.textContent = belum > 0
      ? `Statistik dihitung dari ${totalEntri} undangan terkonfirmasi · ${belum} belum dikonfirmasi`
      : `Semua ${totalEntri} undangan sudah dikonfirmasi`;
  }

  const sideKeys = {
    pria: ["cpp", "teman_pria", "tetangga_pria"],
    wanita: ["cpw", "teman_wanita", "tetangga_wanita"],
  };
  const sideCard = (side, title, totalPax) => {
    const rows = sideKeys[side].map(k => {
      const m = META[k];
      return `<div class="bg-row">
        <span class="bg-dot" style="background:${m.color}"></span>
        <span class="bg-type">${m.group}</span>
        <span class="bg-val">${(byPax[k] || 0)} org</span>
        <span class="bg-sub">${(byCnt[k] || 0)} und</span>
      </div>`;
    }).join("");
    return `<div class="bgrp bgrp-${side}">
      <div class="bgrp-head"><span>${title}</span><b>${totalPax} org</b></div>
      ${rows}
    </div>`;
  };
  const lainPax = byPax.lainnya || 0, lainCnt = byCnt.lainnya || 0;
  const lainCard = lainPax ? `<div class="bgrp bgrp-lain">
    <div class="bg-row">
      <span class="bg-dot" style="background:${META.lainnya.color}"></span>
      <span class="bg-type">Lainnya (tanpa pihak)</span>
      <span class="bg-val">${lainPax} org</span>
      <span class="bg-sub">${lainCnt} und</span>
    </div>
  </div>` : "";
  document.getElementById("breakdown").innerHTML =
    `<div class="bg-grid">${sideCard("pria", "Pihak Pria", pria)}${sideCard("wanita", "Pihak Wanita", wanita)}</div>${lainCard}`;

  const rows = visibleGuests();
  const body = document.getElementById("guestBody");

  if (!rows.length) {
    const q = gSearch.value.trim();
    body.innerHTML = `<div class="empty">
      <div class="big">Belum ada tamu</div>
      <div>${q || gFilterEl.value !== "all" ? "Tidak ada yang cocok." : "Klik Tambah Tamu untuk mulai."}</div>
    </div>`;
    updateBulk();
    return;
  }

  body.innerHTML = rows.map((g, i) => {
    const m = META[g.status] || META.lainnya;
    const und = g.undangan && g.undangan !== "keduanya" ? ` · ${g.undangan}` : "";
    const sel = selected.has(g.id);
    const conf = isConfirmed(g);
    return `<div class="t-row${sel ? " sel" : ""}${conf ? "" : " unconfirmed"}" data-id="${g.id}">
      <div class="t-cbx"><input type="checkbox" class="cbx rowcbx" data-id="${g.id}" ${sel ? "checked" : ""}></div>
      <div class="t-no">${i + 1}</div>
      <div class="t-name">${esc(g.nama)}</div>
      <div class="t-pax-wrap"><span class="t-pax">${g.jumlah}</span></div>
      <div class="t-meta">
        <span class="chip" style="background:${m.bg};color:${m.text}">
          <span class="cdot" style="background:${m.color}"></span>${m.label}${und}
        </span>
      </div>
      <div class="t-konf">
        ${WPUI.switchToggle({ title: "Konfirmasi undangan", inputHTML: `<input type="checkbox" class="konfcbx" data-id="${g.id}" ${conf ? "checked" : ""}>` })}
        <span class="t-konf-lbl">${conf ? "Dikonfirmasi" : "Belum"}</span>
      </div>
      <div class="t-actions">
        <button class="act" onclick="editGuest(${g.id})" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="#46233E" stroke-width="2">
            <path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
        </button>
        <button class="act del" onclick="delGuest(${g.id})" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="#C25B7E" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    </div>`;
  }).join("");

  body.querySelectorAll(".rowcbx").forEach(c =>
    c.onchange = e => toggleSel(parseInt(e.target.dataset.id), e.target.checked)
  );
  body.querySelectorAll(".konfcbx").forEach(c =>
    c.onchange = e => {
      const g = guests.find(x => x.id === parseInt(e.target.dataset.id));
      if (g) { g.konfirmasi = e.target.checked; saveG(); renderGuests(); }
    }
  );
  updateBulk();
}

/* ── Guest Modal ── */
const gOverlay = document.getElementById("gOverlay");

document.getElementById("addGuestBtn").onclick = () => openGuest(null);

function openGuest(id) {
  editGuestId = id;
  if (id) {
    const g = guests.find(x => x.id === id);
    document.getElementById("gmTitle").textContent = "Ubah Data Tamu";
    document.getElementById("gmSub").textContent = g.nama;
    document.getElementById("gmNama").value = g.nama;
    gmJumlah.value = g.jumlah;
    document.getElementById("gmUndangan").value = g.undangan || "keduanya";
    document.getElementById("gmStatus").value = g.status;
    document.getElementById("gmKonfirmasi").value = g.konfirmasi !== false ? "ya" : "tidak";
  } else {
    document.getElementById("gmTitle").textContent = "Tambah Tamu";
    document.getElementById("gmSub").textContent = "Isi data tamu undangan";
    document.getElementById("gmNama").value = "";
    gmJumlah.value = 2;
    document.getElementById("gmUndangan").value = "keduanya";
    document.getElementById("gmStatus").value = "cpp";
    document.getElementById("gmKonfirmasi").value = "ya";
  }
  gOverlay.classList.add("show");
  setTimeout(() => document.getElementById("gmNama").focus(), 60);
}

window.editGuest = id => openGuest(id);

document.getElementById("gmCancel").onclick = () => gOverlay.classList.remove("show");
gOverlay.onclick = e => { if (e.target === gOverlay) gOverlay.classList.remove("show"); };

document.getElementById("gmSave").onclick = () => {
  const nama = document.getElementById("gmNama").value.trim();
  if (!nama) { toast("Nama belum diisi"); document.getElementById("gmNama").focus(); return; }
  const data = {
    nama,
    jumlah: parseInt(gmJumlah.value),
    undangan: document.getElementById("gmUndangan").value,
    status: document.getElementById("gmStatus").value,
    konfirmasi: document.getElementById("gmKonfirmasi").value !== "tidak",
  };
  if (editGuestId) {
    Object.assign(guests.find(x => x.id === editGuestId), data);
    toast("Perubahan tersimpan");
  } else {
    const id = guests.length ? Math.max(...guests.map(g => g.id)) + 1 : 1;
    guests.push({ id, ...data });
    toast("Tamu ditambahkan");
  }
  saveG();
  gOverlay.classList.remove("show");
  renderGuests();
};

window.delGuest = id => {
  const g = guests.find(x => x.id === id);
  if (!confirm(`Hapus "${g.nama}"?`)) return;
  guests = guests.filter(x => x.id !== id);
  selected.delete(id);
  saveG();
  renderGuests();
  toast("Tamu dihapus");
};

/* ── Bulk Selection ── */
function toggleSel(id, on) {
  on ? selected.add(id) : selected.delete(id);
  const r = document.querySelector(`.t-row[data-id="${id}"]`);
  if (r) r.classList.toggle("sel", on);
  updateBulk();
}

function updateBulk() {
  const n = selected.size;
  document.getElementById("bulkCount").textContent = n;
  document.getElementById("bulkbar").classList.toggle("show", n > 0);
  const vis = visibleGuests();
  const all = vis.length > 0 && vis.every(g => selected.has(g.id));
  const sa = document.getElementById("selAll");
  sa.checked = all;
  sa.indeterminate = !all && vis.some(g => selected.has(g.id));
}

document.getElementById("selAll").onchange = e => {
  const on = e.target.checked;
  visibleGuests().forEach(g => { on ? selected.add(g.id) : selected.delete(g.id); });
  renderGuests();
};

/* ✨ Export & Reset ✨ */
document.getElementById("gExportBtn").onclick = () => {
  const head = ["No", "Nama Lengkap", "Jumlah Orang", "Status Relasi", "Undangan Untuk", "Konfirmasi"];
  const rows = guests.map((g, i) =>
    [i + 1, g.nama, g.jumlah, (META[g.status] || META.lainnya).label, g.undangan || "keduanya", g.konfirmasi !== false ? "Dikonfirmasi" : "Belum"]
  );
  dl("daftar-tamu-undangan.csv", toCSV(head, rows));
  toast("CSV tamu diunduh");
};

document.getElementById("gResetBtn").onclick = () => {
  if (!confirm("Kembalikan daftar tamu ke data awal?")) return;
  guests = GUEST_SEED.slice();
  selected.clear();
  saveG();
  renderGuests();
  toast("Data tamu direset");
};
