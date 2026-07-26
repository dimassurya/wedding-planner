<template>
  <section class="panel active" id="panel-vendor">
    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat a-plum">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5H3z"/><path d="M21 9v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9"/><path d="M9 21V12h6v9"/></svg></div>
        <div class="num">{{ store.vendors.length }}</div><div class="lbl">Total vendor</div>
      </div>
      <div class="stat a-teal">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="num">{{ dipakaiList.length }}</div><div class="lbl">Vendor dipakai</div>
      </div>
      <div class="stat a-gold">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="16" cy="12" r="2"/></svg></div>
        <div class="num">{{ fmt(totalBiaya) }}</div><div class="lbl">Total biaya vendor</div>
      </div>
      <div class="stat a-rose">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg></div>
        <div class="num">{{ store.vendors.length - dipakaiList.length }}</div><div class="lbl">Belum diputuskan</div>
      </div>
    </div>

    <!-- Used vendors list -->
    <div v-if="dipakaiList.length" class="card vd-card">
      <div class="vd-head">✓ Vendor yang Dipakai <span class="vd-count">{{ dipakaiList.length }}</span></div>
      <div class="vd-list">
        <button v-for="v in dipakaiList" :key="v.id" class="vd-item" @click="store.vFilter = v.category">
          <span class="vd-cat">{{ catLabel(v.category) }}</span>
          <span class="vd-name">{{ v.nama }}<template v-if="v.namaPaket"> · {{ v.namaPaket }}</template></span>
          <span class="vd-price">Rp {{ grp(v.harga) }}</span>
        </button>
      </div>
    </div>

    <!-- Category chips -->
    <div class="controls st-toolbar" :class="{ sticky: !isMobile }" ref="toolbarRef">
      <div id="vChips" class="chips">
        <button v-for="c in VENDOR_CATEGORIES" :key="c.id" class="fchip" :class="{ on: store.vFilter === c.id }" @click="store.vFilter = c.id">{{ c.label }}</button>
      </div>
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Vendor
      </button>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('vendor')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
        <input ref="importRef" type="file" accept=".json" hidden @change="onImport">
      </div>
      <TourBtn :steps="VENDOR_STEPS" />
    </div>

    <!-- Mobile: daftar kartu -->
    <MobileVendorList v-if="isMobile" :rows="catRows" @edit="openEdit" />

    <!-- Card grid (PC) -->
    <div v-else>
      <div v-if="!catRows.length" class="card"><div class="empty">
        <div class="big">Tidak ada vendor</div>
        <div>Belum ada data vendor untuk kategori ini.</div>
      </div></div>

      <div v-else class="vt-table">
        <div class="vt-headrow" :style="{ top: headTop + 'px' }">
          <span></span>
          <span>Vendor</span>
          <span>Paket</span>
          <span>Harga</span>
          <span>Status</span>
        </div>

        <div
          v-for="v in catRows"
          :key="v.id"
          class="vt-row-wrap"
          :class="['vs-l-' + statusOf(v), { expanded: expandedId === v.id, sel: store.isSelected(v.id) }]"
        >
          <div class="vt-row" @click="toggleExpand(v.id)">
            <button type="button" class="vt-exp-btn" @click.stop="toggleExpand(v.id)" :aria-label="expandedId === v.id ? 'Tutup detail' : 'Buka detail'">
              <svg class="vt-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            <div class="vt-name">
              <label class="vt-cbx" @click.stop>
                <input type="checkbox" class="cbx" :checked="store.isSelected(v.id)" @change="e => store.toggleSelected(v.id, e.target.checked)">
              </label>
              <span>{{ v.nama || 'Tanpa nama' }}</span>
            </div>

            <div class="vt-cap">
              <span v-if="v.namaPaket">{{ v.namaPaket }}</span>
              <span v-else class="vt-muted">—</span>
            </div>

            <div class="vt-harga">
              <span class="vt-price">Rp {{ grp(v.harga) }}</span>
              <span class="vt-tag">{{ tipeHargaTag(v) }}</span>
            </div>

            <div class="vt-status" @click.stop>
              <SwitchToggle :model-value="!!v.jadi" title="Dipakai?" @update:model-value="val => store.setVendorStatus(v, val ? 'dipakai' : 'batal')" />
              <span class="v-lbl" :class="{ on: v.jadi }">{{ v.jadi ? 'Dipakai' : 'Tidak Dipakai' }}</span>
            </div>
          </div>

          <!-- Detail info (expand ke bawah) -->
          <div v-if="expandedId === v.id" class="vt-body">
            <div v-if="v.tipeHarga === 'pax'" class="vt-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ paxMultText(v) }}</div>
            <div v-if="v.tipeHarga === 'item'" class="vt-paxinfo">@ Rp {{ grp(v.hargaItem) }} × {{ v.jumlahItem }} item</div>
            <div v-if="v.tipeHarga === 'jam'" class="vt-paxinfo">@ Rp {{ grp(v.hargaJam) }} × {{ v.totalJam }} jam</div>
            <div v-if="v.tipeHarga === 'sesi'" class="vt-paxinfo">@ Rp {{ grp(v.hargaSesi) }} × {{ v.totalSesi }} sesi</div>
            <div v-if="v.tipeHarga === 'orang'" class="vt-paxinfo">@ Rp {{ grp(v.hargaOrang) }} × {{ v.jumlahOrang }} orang</div>
            <div v-if="v.tipeHarga === 'box'" class="vt-paxinfo">@ Rp {{ grp(v.hargaBox) }} × {{ v.jumlahBox }} box</div>
            <div v-if="v.tipeHarga === 'stall'" class="vt-paxinfo">@ Rp {{ grp(v.hargaStall) }} × {{ v.jumlahStall }} stall</div>

            <div v-if="v.pic || v.hp || v.website || v.instagram || v.email || v.alamat || (v.genreMusik && v.genreMusik.length) || v.durasiTampil || v.category === 'fotografer'" class="vt-info">
              <span v-if="v.pic"><span class="vt-info-lbl">👤 PIC</span> {{ v.pic }}</span>
              <span v-if="v.hp"><span class="vt-info-lbl">📱 WhatsApp</span> {{ v.hp }}</span>
              <span v-if="v.instagram"><span class="vt-info-lbl">📷 Instagram</span> {{ v.instagram }}</span>
              <span v-if="v.website"><span class="vt-info-lbl">🌐 Website</span> <a :href="v.website.startsWith('http') ? v.website : 'https://' + v.website" target="_blank" rel="noopener" class="vt-link">{{ v.website }}</a></span>
              <span v-if="v.email"><span class="vt-info-lbl">✉️ Email</span> {{ v.email }}</span>
              <span v-if="v.genreMusik && v.genreMusik.length"><span class="vt-info-lbl">🎵 Genre</span> {{ v.genreMusik.join(', ') }}</span>
              <span v-if="v.durasiTampil"><span class="vt-info-lbl">⏱️ Durasi Tampil</span> {{ v.durasiTampil }}</span>
              <span v-if="v.category === 'musik'"><span class="vt-info-lbl">🎤 Request Lagu</span> {{ v.bisaRequestLagu ? 'Bisa' : 'Tidak bisa' }}</span>
              <span v-if="v.category === 'fotografer'"><span class="vt-info-lbl">📸 Prewedding</span> {{ v.includePrewedding ? (v.durasiPrewedding || 'Ya') : 'Tidak' }}</span>
              <span v-if="v.durasiLiputan"><span class="vt-info-lbl">🎬 Durasi Liputan</span> {{ v.durasiLiputan }}</span>
              <span v-if="v.liputanAcara && v.liputanAcara.length" class="vt-span2"><span class="vt-info-lbl">📋 Liputan Acara</span> {{ v.liputanAcara.join(', ') }}</span>
              <span v-if="v.jumlahFotografer || v.jumlahVideografer || v.jumlahContentCreator" class="vt-span2"><span class="vt-info-lbl">👥 Tim</span> {{ timText(v) }}</span>
              <span v-if="v.hasilFotoVideo && v.hasilFotoVideo.length" class="vt-span2"><span class="vt-info-lbl">🎁 Hasil</span> {{ v.hasilFotoVideo.join(', ') }}</span>
              <span v-if="v.estimasiPreview || v.estimasiFotoJadi || v.estimasiVideoJadi" class="vt-span2"><span class="vt-info-lbl">⏳ Estimasi</span> {{ estimasiText(v) }}</span>
              <span v-if="v.alamat" class="vt-span2"><span class="vt-info-lbl">📍 Alamat</span> {{ v.alamat }}</span>
            </div>
            <template v-if="v.category === 'mua'">
              <div v-if="muaLayananPengantin(v).length" class="vt-section">
                <div class="vt-section-lbl">💄 Layanan Pengantin</div>
                <div class="vt-checklist">
                  <span v-for="l in muaLayananPengantin(v)" :key="l">✓ {{ l }}</span>
                </div>
              </div>
              <div v-if="v.includeBusana && v.busanaList && v.busanaList.length" class="vt-section">
                <div class="vt-section-lbl">👗 Busana</div>
                <div class="vt-checklist">
                  <span v-for="b in v.busanaList" :key="b.jenis">✓ {{ b.jenis }}<template v-if="b.jumlah > 1"> ({{ b.jumlah }})</template></span>
                </div>
              </div>
              <div v-if="v.layananTambahan && v.layananTambahan.length" class="vt-section">
                <div class="vt-section-lbl">👨‍👩‍👧 Makeup Tambahan</div>
                <div class="vt-checklist">
                  <span v-for="l in v.layananTambahan" :key="l.jenis">✓ {{ l.jenis }}<template v-if="l.jumlah > 1"> ({{ l.jumlah }})</template></span>
                </div>
              </div>
              <div v-if="v.trialMakeup || v.touchUp" class="vt-section">
                <div class="vt-section-lbl">✨ Benefit</div>
                <div class="vt-checklist">
                  <span v-if="v.trialMakeup">✓ Trial Makeup ({{ v.jumlahTrial }}x)</span>
                  <span v-if="v.touchUp">✓ Touch Up<template v-if="v.durasiPendampingan"> — Pendampingan {{ v.durasiPendampingan }}</template></span>
                </div>
              </div>
            </template>

            <div v-if="v.category === 'mc' && ((v.acaraDibawakan && v.acaraDibawakan.length) || v.durasiMembawakan || (v.bahasaMc && v.bahasaMc.length) || (v.adatMc && v.adatMc.length) || v.gayaMc)" class="vt-section">
              <div class="vt-section-lbl">🎤 Layanan</div>
              <div class="vt-checklist">
                <span v-if="v.acaraDibawakan && v.acaraDibawakan.length">Acara: {{ v.acaraDibawakan.join(', ') }}</span>
                <span v-if="v.durasiMembawakan">Durasi: {{ v.durasiMembawakan }}</span>
                <span v-if="v.bahasaMc && v.bahasaMc.length">Bahasa: {{ v.bahasaMc.join(', ') }}</span>
                <span v-if="v.adatMc && v.adatMc.length">Adat: {{ v.adatMc.join(', ') }}</span>
                <span v-if="v.gayaMc">Gaya: {{ v.gayaMc }}</span>
              </div>
            </div>

            <div v-if="v.category === 'souvenir' && (v.namaSouvenir || (v.isiPaketSouvenir && v.isiPaketSouvenir.length) || v.includePackaging || (v.customisasi && v.customisasi.length) || v.jumlahSouvenir || v.minimalOrder || v.estimasiProduksi || v.estimasiPengiriman)" class="vt-section">
              <div class="vt-section-lbl">🎁 Informasi Souvenir</div>
              <div class="vt-checklist">
                <span v-if="v.namaSouvenir">Nama Souvenir: {{ v.namaSouvenir }}</span>
                <span v-for="item in v.isiPaketSouvenir" :key="item.nama">✓ {{ item.nama }}<template v-if="item.jumlah > 1"> ×{{ item.jumlah }}</template></span>
                <span v-if="v.includePackaging">Packaging: {{ v.jenisPackaging || 'Ya' }}</span>
                <span v-if="v.customisasi && v.customisasi.length">Customisasi: {{ v.customisasi.join(', ') }}</span>
                <span v-if="v.jumlahSouvenir">Jumlah Pesanan: {{ v.jumlahSouvenir }}</span>
                <span v-if="v.minimalOrder">Minimal Order: {{ v.minimalOrder }}</span>
                <span v-if="v.estimasiProduksi">Estimasi Produksi: {{ v.estimasiProduksi }}</span>
                <span v-if="v.estimasiPengiriman">Estimasi Pengiriman: {{ v.estimasiPengiriman }}</span>
              </div>
            </div>

            <div v-if="v.category === 'wo' && (v.jenisLayananWO || (v.layananDidapat && v.layananDidapat.length) || v.jumlahMeeting || v.includeSurveyVenue || v.includeGladiBersih || (v.koordinasiVendor && v.koordinasiVendor.length))" class="vt-section">
              <div class="vt-section-lbl">📋 Informasi Paket</div>
              <div class="vt-checklist">
                <span v-if="v.jenisLayananWO">Jenis Layanan: {{ v.jenisLayananWO }}</span>
                <span v-for="l in v.layananDidapat" :key="l.nama">✓ {{ l.nama }}<template v-if="l.keterangan"> — {{ l.keterangan }}</template></span>
                <span v-if="v.jumlahMeeting">Jumlah Meeting: {{ v.jumlahMeeting }}</span>
                <span v-if="v.includeSurveyVenue">✓ Survey Venue<template v-if="v.jumlahSurvey > 1"> ({{ v.jumlahSurvey }}x)</template></span>
                <span v-if="v.includeGladiBersih">✓ Gladi Bersih</span>
                <span v-if="v.koordinasiVendor && v.koordinasiVendor.length">Koordinasi Vendor: {{ v.koordinasiVendor.join(', ') }}</span>
              </div>
            </div>

            <div v-if="v.category === 'wo' && (v.jumlahCrewHariH || (v.strukturTim && v.strukturTim.length) || v.jumlahKonsumsiTim)" class="vt-section">
              <div class="vt-section-lbl">👥 Tim Wedding Organizer</div>
              <div class="vt-checklist">
                <span v-if="v.jumlahCrewHariH">Jumlah Crew Hari H: {{ v.jumlahCrewHariH }}</span>
                <span v-for="t in v.strukturTim" :key="t.posisi">✓ {{ t.posisi }} ({{ t.jumlah }})</span>
                <span v-if="woTotalPersonel(v) > 0">Total Personel: {{ woTotalPersonel(v) }} orang</span>
                <span v-if="v.jumlahKonsumsiTim">Jumlah Konsumsi Tim: {{ v.jumlahKonsumsiTim }} orang</span>
              </div>
            </div>

            <div v-if="v.category === 'wo' && v.dokumenDidapat && v.dokumenDidapat.length" class="vt-section">
              <div class="vt-section-lbl">📄 Dokumen</div>
              <div class="vt-checklist">
                <span v-for="d in v.dokumenDidapat" :key="d">✓ {{ d }}</span>
              </div>
            </div>

            <div v-if="v.category === 'venue' && (v.jenisVenue || (v.konsepVenue && v.konsepVenue.length) || v.kapasitasMin || v.kapasitasMaks || v.jamMulai || v.jamSelesai || (v.areaAcara && v.areaAcara.length))" class="vt-section">
              <div class="vt-section-lbl">🏛 Informasi Venue</div>
              <div class="vt-checklist">
                <span v-if="v.jenisVenue">Jenis Venue: {{ v.jenisVenue }}</span>
                <span v-if="v.konsepVenue && v.konsepVenue.length">Konsep: {{ v.konsepVenue.join(', ') }}</span>
                <span v-if="v.kapasitasMin || v.kapasitasMaks">Kapasitas: {{ v.kapasitasMin }} - {{ v.kapasitasMaks }} Orang</span>
                <span v-if="v.jamMulai || v.jamSelesai">Durasi: {{ v.jamMulai }} - {{ v.jamSelesai }}</span>
                <span v-for="a in v.areaAcara" :key="a.nama">✓ {{ a.nama }}<template v-if="a.kapasitas"> — {{ a.kapasitas }} Orang</template></span>
              </div>
            </div>

            <div v-if="v.category === 'venue' && v.fasilitasVenue && v.fasilitasVenue.length" class="vt-section">
              <div class="vt-section-lbl">🏢 Fasilitas</div>
              <div class="vt-checklist">
                <span v-for="f in v.fasilitasVenue" :key="f.nama">✓ {{ f.nama }}<template v-if="f.jumlah"> ({{ f.jumlah }})</template></span>
              </div>
            </div>

            <div v-if="v.category === 'venue' && ((v.kebijakanVenue && v.kebijakanVenue.length) || (v.vendorRekanan && v.vendorRekanan.length))" class="vt-section">
              <div class="vt-section-lbl">📜 Kebijakan Venue</div>
              <div class="vt-checklist">
                <span v-for="k in v.kebijakanVenue" :key="k">✓ {{ k }}</span>
                <span v-for="r in v.vendorRekanan" :key="r.nama">Rekanan {{ r.kategori }}: {{ r.nama }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && (v.jenisPaketCatering && v.jenisPaketCatering.length)" class="vt-section">
              <div class="vt-section-lbl">🍽 Jenis Paket</div>
              <div class="vt-checklist">
                <span>{{ v.jenisPaketCatering.join(', ') }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && ((v.buffetAppetizer && v.buffetAppetizer.length) || (v.buffetMainCourse && v.buffetMainCourse.length) || (v.buffetDessert && v.buffetDessert.length) || (v.buffetBeverage && v.buffetBeverage.length))" class="vt-section">
              <div class="vt-section-lbl">🥘 Buffet</div>
              <div class="vt-checklist">
                <span v-if="v.buffetAppetizer && v.buffetAppetizer.length">Appetizer: {{ v.buffetAppetizer.join(', ') }}</span>
                <span v-if="v.buffetMainCourse && v.buffetMainCourse.length">Main Course: {{ v.buffetMainCourse.join(', ') }}</span>
                <span v-if="v.buffetDessert && v.buffetDessert.length">Dessert: {{ v.buffetDessert.join(', ') }}</span>
                <span v-if="v.buffetBeverage && v.buffetBeverage.length">Beverage: {{ v.buffetBeverage.join(', ') }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.foodStall && v.foodStall.length" class="vt-section">
              <div class="vt-section-lbl">🍜 Food Stall</div>
              <div class="vt-checklist">
                <span v-for="s in v.foodStall" :key="s.nama">✓ {{ s.nama }}<template v-if="s.jumlah > 1"> ×{{ s.jumlah }}</template><template v-if="s.keterangan"> — {{ s.keterangan }}</template></span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.includeLiveCooking" class="vt-section">
              <div class="vt-section-lbl">🔥 Live Cooking</div>
              <div class="vt-checklist">
                <span v-if="v.liveCookingList && v.liveCookingList.length">{{ v.liveCookingList.join(', ') }}</span>
                <span v-else>✓ Tersedia</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.includeCatering && v.includeCatering.length" class="vt-section">
              <div class="vt-section-lbl">✅ Include</div>
              <div class="vt-checklist">
                <span v-for="i in v.includeCatering" :key="i">✓ {{ i }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && (v.durasiPelayanan || v.jumlahWaiter || v.jumlahChef || v.sistemRefill)" class="vt-section">
              <div class="vt-section-lbl">👨‍🍳 Pelayanan</div>
              <div class="vt-checklist">
                <span v-if="v.durasiPelayanan">Durasi: {{ v.durasiPelayanan }}</span>
                <span v-if="v.jumlahWaiter">Waiter: {{ v.jumlahWaiter }} orang</span>
                <span v-if="v.jumlahChef">Chef: {{ v.jumlahChef }} orang</span>
                <span v-if="v.sistemRefill">Refill: {{ v.sistemRefill }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.includeFoodTasting" class="vt-section">
              <div class="vt-section-lbl">🧪 Food Tasting</div>
              <div class="vt-checklist">
                <span>✓ Tersedia<template v-if="v.jumlahSesiFoodTasting > 1"> ({{ v.jumlahSesiFoodTasting }} sesi)</template></span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.kebijakanCatering && v.kebijakanCatering.length" class="vt-section">
              <div class="vt-section-lbl">📋 Kebijakan</div>
              <div class="vt-checklist">
                <span v-for="k in v.kebijakanCatering" :key="k">✓ {{ k }}</span>
              </div>
            </div>

            <div v-if="v.category === 'catering' && v.biayaTambahan && v.biayaTambahan.length" class="vt-section">
              <div class="vt-section-lbl">💵 Biaya Tambahan</div>
              <div class="vt-checklist">
                <span v-for="b in v.biayaTambahan" :key="b.nama">{{ b.nama }}: Rp {{ grp(b.nominal) }}<template v-if="b.keterangan"> — {{ b.keterangan }}</template></span>
              </div>
            </div>

            <div v-if="v.deskripsi" class="vt-desc">{{ v.deskripsi }}</div>
            <div v-if="v.catatan" class="vt-note">📝 {{ v.catatan }}</div>
            <div v-if="!v.pic && !v.hp && !v.website && !v.instagram && !v.email && !v.alamat && !(v.genreMusik && v.genreMusik.length) && !v.durasiTampil && !v.deskripsi && !v.catatan && v.category !== 'musik' && v.category !== 'fotografer' && v.category !== 'mua' && v.category !== 'mc' && v.category !== 'souvenir' && v.category !== 'wo' && v.category !== 'venue' && v.category !== 'catering'" class="vt-empty-info">Belum ada info tambahan — lengkapi lewat tombol Edit.</div>

            <div v-if="payInfo(v)" class="vt-payblock">
              <div class="vt-payblock-top">
                <span>{{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}</span>
                <span class="vt-payblock-sub">dibayar Rp {{ grp(payInfo(v).dibayar) }} / Rp {{ grp(payInfo(v).total) }}</span>
              </div>
              <div class="vt-paybar"><span :style="{ width: payInfo(v).pct + '%' }"></span></div>
              <div v-if="payInfo(v).jatuhTempo" class="vt-due">⏰ Jatuh tempo {{ fmtDate(payInfo(v).jatuhTempo) }}</div>
            </div>

            <div class="vt-actions">
              <button v-if="v.hp" class="vt-btn wa" @click="openWa(v)">WhatsApp</button>
              <button v-if="payInfo(v)" class="vt-btn" @click="openPay(v)">Catat pembayaran</button>
              <button class="vt-btn" @click="openEdit(v.id)">Edit</button>
              <button class="vt-btn del" @click="delVendor(v)">Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <VendorModal :show="modalShow" :edit-id="editId" :default-category="store.vFilter" @close="modalShow = false" />
    <BudgetDetailModal :show="payShow" :item-id="payItemId" @close="payShow = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES } from '../data/constants'
import { fmt, grp, fmtDate } from '../utils/index'
import { openWa } from '../mobile layout/waLink'
import VendorModal from '../components/modals/VendorModal.vue'
import BudgetDetailModal from '../components/modals/BudgetDetailModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileVendorList from '../mobile layout/MobileVendorList.vue'
import TourBtn from '../components/TourBtn.vue'
import { useStickyThead } from '../composables/useStickyThead'
import SwitchToggle from '../components/SwitchToggle.vue'

const store     = useWeddingStore()
const modalShow = ref(false)
const editId    = ref(null)
const importRef = ref(null)
const isMobile  = useIsMobile()
const { toolbarRef, headTop } = useStickyThead()

const expandedId = ref(null)
const payShow    = ref(false)
const payItemId  = ref(null)

const statusOf = v => v.jadi ? 'dipakai' : 'batal'
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }
function openPay(v) {
  const b = store.budget.find(x => x.vendorId === v.id)
  if (!b) return
  payItemId.value = b.id
  payShow.value = true
}

// Quick Add FAB (mobile) memicu ini lewat nonce, tanpa mengubah tombol "Tambah" lama
watch(() => store.quickAddNonce, () => {
  if (store.quickAddTarget === 'vendor') openAdd()
})

const VENDOR_STEPS = computed(() => [
  {
    selector: '#panel-vendor .stat-grid',
    icon: '🤝',
    title: 'Ringkasan Vendor',
    desc: 'Empat angka penting: total vendor yang dicatat, berapa yang sudah dipilih, total biaya semua vendor aktif, dan berapa yang belum diputuskan.',
  },
  {
    selector: '#panel-vendor .vd-card',
    icon: '✅',
    title: 'Vendor yang Dipakai',
    desc: 'Panel ini muncul setelah ada vendor yang diaktifkan. Berisi ringkasan cepat — kategori, nama, dan harga. Ketuk salah satunya untuk langsung filter ke kategori itu.',
  },
  {
    selector: '#panel-vendor #vChips',
    icon: '🏷️',
    title: 'Filter Kategori',
    desc: 'Vendor dikelompokkan per kategori: Katering, Foto & Video, Gedung, dan lainnya. Pilih kategori untuk fokus ke satu jenis sekaligus.',
  },
  {
    selector: '#panel-vendor .controls button.icon-btn.solid',
    icon: '➕',
    title: 'Tambah Vendor',
    desc: 'Isi nama, alamat, nomor HP, deskripsi, dan pilih tipe harga. Ada dua tipe: All In (harga tetap) atau Per Pax (dikalikan jumlah tamu otomatis).',
  },
  {
    selector: isMobile.value ? '.mv-card' : '.vt-row-wrap',
    icon: '📋',
    title: isMobile.value ? 'Kartu Vendor' : 'Baris Vendor',
    desc: 'Klik tombol panah di kiri untuk buka detail — alamat, HP, email, website/Instagram, dan deskripsi lengkap.',
  },
  {
    selector: isMobile.value ? '.mv-sub' : '.vt-harga',
    icon: '💰',
    title: 'Sistem Harga Vendor',
    desc: 'All In berarti harga tetap terlepas dari jumlah tamu. Per Pax dikalikan otomatis dari jumlah tamu terkonfirmasi di tab Tamu — angkanya update sendiri kalau tamu bertambah.',
  },
  {
    selector: isMobile.value ? '.mv-status-sel' : '.vt-status',
    icon: '🔄',
    title: 'Status Vendor → Budget',
    desc: 'Ubah status ke "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dibatalkan, otomatis dihapus dari Budget. Tidak perlu input manual.',
  },
  ...(isMobile.value ? [{
    selector: '.mv-act-btn.wa',
    icon: '📱',
    title: 'Hubungi via WhatsApp',
    desc: 'Tombol WA langsung membuka chat ke nomor vendor yang sudah diisi. Aktif hanya kalau nomor HP terisi. Berguna untuk follow up tanpa perlu keluar dari aplikasi.',
  }] : []),
])

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }
const TIPE_HARGA_TAGS = { pax: 'Per pax', item: 'Per item', jam: 'Per jam', sesi: 'Per sesi', orang: 'Per orang', sewa: 'Sewa Venue', box: 'Per box', stall: 'Per stall' }
const tipeHargaTag = v => TIPE_HARGA_TAGS[v.tipeHarga] || 'All in'

const dipakaiList = computed(() => store.vendors.filter(v => v.jadi))
const totalBiaya  = computed(() => dipakaiList.value.reduce((s, v) => s + (v.harga || 0), 0))
const catRows     = computed(() => store.vendors.filter(v => v.category === store.vFilter))

const tOrang    = computed(() => store.confirmedGuests.reduce((s, g) => s + g.jumlah, 0))
const tUndangan = computed(() => store.confirmedGuests.length)

function paxMultText(v) {
  if (v.paxPengali === 'orang') return `${tOrang.value} org`
  if (v.paxPengali === 'undangan') return `${tUndangan.value} undgn`
  if (v.paxPengali === 'hampers') return `${store.hampersCount} hampers`
  return v.paxManualVal
}

function timText(v) {
  const parts = []
  if (v.jumlahFotografer) parts.push(`${v.jumlahFotografer} Fotografer`)
  if (v.jumlahVideografer) parts.push(`${v.jumlahVideografer} Videografer`)
  if (v.jumlahContentCreator) parts.push(`${v.jumlahContentCreator} Content Creator`)
  return parts.join(', ')
}

function estimasiText(v) {
  const parts = []
  if (v.estimasiPreview) parts.push(`Preview ${v.estimasiPreview}`)
  if (v.estimasiFotoJadi) parts.push(`Foto ${v.estimasiFotoJadi}`)
  if (v.estimasiVideoJadi) parts.push(`Video ${v.estimasiVideoJadi}`)
  return parts.join(' · ')
}

function muaLayananPengantin(v) {
  const out = []
  if (v.makeupPengantinWanita) out.push('Makeup Pengantin Wanita')
  if (v.makeupPengantinPria) out.push('Makeup Pengantin Pria')
  if (v.hairdo) out.push('Hairdo')
  if (v.hijabdo) out.push('Hijabdo')
  return out
}

function woTotalPersonel(v) {
  const sum = (v.strukturTim || []).reduce((s, x) => s + (x.jumlah || 0), 0)
  if (sum > 0) return sum
  const m = (v.jumlahCrewHariH || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

function payInfo(v) {
  return store.vendorPayInfo(v)
}

function delVendor(v) {
  store.delVendor(v.id)
}

function openAdd()    { editId.value = null; modalShow.value = true }
function openEdit(id) { editId.value = id;   modalShow.value = true }

function onImport(e) {
  const f = e.target.files[0]
  if (f) store.importTab('vendor', f)
  e.target.value = ''
}
</script>

<style scoped>

/* ── Row grid (desktop) ── */
.vt-table {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  overflow: clip;   /* clip (bukan hidden) biar headrow bisa sticky ke halaman */
}

.vt-headrow {
  display: grid;
  grid-template-columns: 34px minmax(0,1.6fr) 120px 170px 150px;
  gap: 0 10px;
  padding: 10px 15px;
  background: var(--ivory);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
  position: sticky;   /* top diset inline (headTop) */
  z-index: 5;
}

.vt-row-wrap { border-left: 3px solid var(--line); }
.vt-row-wrap + .vt-row-wrap { border-top: 1px solid var(--line); }
.vt-row-wrap.sel { background: rgba(129,1,0,.04); }
.vt-row-wrap.vs-l-dipakai { border-left-color: var(--green); }
.vt-row-wrap.vs-l-batal   { border-left-color: var(--rose); }

.vt-row {
  display: grid;
  grid-template-columns: 34px minmax(0,1.6fr) 120px 170px 150px;
  align-items: center;
  gap: 0 10px;
  padding: 12px 15px 12px 12px;
  cursor: pointer;
}

.vt-exp-btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
}
.vt-chev { transition: transform .2s; }
.vt-row-wrap.expanded .vt-chev { transform: rotate(180deg); }

.vt-name {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  font-family: 'Jost', sans-serif;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--ink);
}
.vt-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vt-cbx { display: inline-flex; flex: none; }

.vt-cap { font-size: 13px; color: var(--ink); font-weight: 600; }
.vt-muted { color: var(--muted); font-weight: 400; }

.vt-harga { display: flex; flex-direction: column; gap: 2px; }
.vt-price { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: var(--ink); }
.vt-tag { font-size: 11px; color: var(--muted); }

.vt-status { display: flex; align-items: center; gap: 8px; justify-self: start; }

/* Body (expand ke bawah) */
.vt-body { padding: 0 15px 15px 46px; border-top: 1px dashed var(--line); }
.vt-paxinfo { padding-top: 12px; font-size: 12px; color: var(--muted); }

.vt-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-top: 12px; font-size: 13px; color: var(--ink); }
.vt-info > span { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.vt-info-lbl { color: var(--muted); font-size: 11px; letter-spacing: .03em; margin-right: 4px; white-space: nowrap; }
.vt-span2 { grid-column: 1 / -1; }
.vt-link { color: var(--plum); text-decoration: none; word-break: break-all; }
.vt-link:hover { text-decoration: underline; }
.vt-desc { margin-top: 8px; font-size: 13px; color: #5f4a4a; font-style: italic; line-height: 1.5; white-space: pre-wrap; }
.vt-note { margin-top: 8px; font-size: 12.5px; color: var(--muted); line-height: 1.5; white-space: pre-wrap; }
.vt-section { margin-top: 14px; }
.vt-section-lbl { font-size: 11.5px; font-weight: 700; color: var(--plum); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 6px; }
.vt-checklist { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--ink); }
.vt-empty-info { margin-top: 12px; font-size: 12.5px; color: var(--muted); }

.vt-payblock { margin-top: 12px; padding: 11px 13px; background: var(--ivory); border-radius: 12px; }
.vt-payblock-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink); }
.vt-payblock-sub { font-size: 11.5px; font-weight: 500; color: var(--muted); }
.vt-paybar { height: 6px; background: var(--line); border-radius: 100px; overflow: hidden; margin: 8px 0 6px; }
.vt-paybar > span { display: block; height: 100%; background: var(--gold); border-radius: 100px; }
.vt-due { font-size: 12px; color: #7a5c28; }

.vt-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.vt-btn {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 13px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.vt-btn:hover { background: var(--gold-soft); border-color: var(--gold); }
.vt-btn.wa { background: #25D366; color: #fff; border-color: #25D366; }
.vt-btn.wa:hover { filter: brightness(1.05); background: #25D366; }
.vt-btn.del { color: var(--rose); }
.vt-btn.del:hover { background: var(--rose-soft); border-color: var(--rose); }
</style>
