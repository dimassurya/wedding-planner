<template>
  <div class="mv-wrap">
    <div v-if="!rows.length && !hasCandidates" class="mv-empty">
      <div class="mv-empty-ico">{{ emptyIcon }}</div>
      <div class="mv-empty-big">Belum ada Vendor {{ emptyCategoryLabel }}</div>
      <div>Tambahkan vendor pertama agar persiapanmu semakin lengkap.</div>
      <button type="button" class="mv-empty-btn" @click="$emit('add')">+ Tambah Vendor</button>
    </div>

    <div v-else-if="!rows.length" class="mv-empty">
      <div class="mv-empty-ico">🔍</div>
      <div class="mv-empty-big">Tidak ada vendor yang cocok</div>
      <div>Coba ubah kata pencarian atau filter yang dipakai.</div>
      <button type="button" class="mv-empty-btn mv-empty-btn-ghost" @click="$emit('reset-filter')">Reset Filter</button>
    </div>

    <TransitionGroup v-else tag="div" name="mv-fade" class="mv-list">
    <div v-for="v in rows" :key="v.id" class="mv-card" :class="['mvs-' + cardStatusKey(v), { expanded: expandedId === v.id }]">
      <div class="mv-row" @click="toggleExpand(v.id)">
        <span class="mv-cat-ico">{{ catIcon(v.category) }}</span>
        <button type="button" class="mv-exp-btn" @click.stop="toggleExpand(v.id)" :aria-label="expandedId === v.id ? 'Tutup detail' : 'Buka detail'">
          <svg class="mv-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="mv-main">
          <div class="mv-top">
            <span class="mv-name">{{ v.nama || 'Tanpa nama' }}</span>
            <select
              class="mv-status-sel"
              :class="'vs-' + statusKey(v)"
              :value="statusKey(v)"
              @click.stop
              @change="e => store.setVendorStatus(v, e.target.value)"
            >
              <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
            </select>
          </div>
          <div class="mv-catlbl">{{ catLabel(v.category) }}</div>
          <div class="mv-sub">
            <span class="mv-price">Rp {{ grp(store.vendorEffectiveHarga(v)) }} <small>· {{ tipeHargaTag(v) }}</small></span>
            <span v-if="store.vendorBiayaTambahan(v)" class="mv-cap">termasuk Rp {{ grp(store.vendorBiayaTambahan(v)) }} biaya tambahan</span>
            <span v-if="v.namaPaket" class="mv-cap">{{ v.namaPaket }}</span>
          </div>
          <div v-if="cardStatusKey(v) === 'included'" class="mv-inc-src">
            🔗 Included dari {{ catLabel(store.vendorIncludedByOther(v.id).category) }}
          </div>
        </div>
      </div>

      <!-- Detail info (expand ke bawah) -->
      <div v-if="expandedId === v.id" class="mv-body">
        <!-- Payment info -->
        <div v-if="payInfo(v)" class="mv-payblock">
          <div class="mv-pay-top">
            <span :class="{ 'mv-lunas': payInfo(v).lunas }">{{ payInfo(v).lunas ? 'Lunas ✓' : 'sisa Rp ' + grp(payInfo(v).sisa) }}</span>
            <span class="mv-pay-sub">dibayar Rp {{ grp(payInfo(v).dibayar) }} / Rp {{ grp(payInfo(v).total) }}</span>
          </div>
          <div class="mv-paybar"><span :style="{ width: payInfo(v).pct + '%' }"></span></div>
          <div v-if="payInfo(v).jatuhTempo" class="mv-due">⏰ Jatuh tempo {{ fmtDate(payInfo(v).jatuhTempo) }}</div>
        </div>

        <!-- Pax breakdown -->
        <div v-if="v.tipeHarga === 'pax'" class="mv-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ vendorPaxMultText(v, store) }}</div>
        <div v-if="v.tipeHarga === 'item'" class="mv-paxinfo">@ Rp {{ grp(v.hargaItem) }} × {{ v.jumlahItem }} item</div>
        <div v-if="v.tipeHarga === 'jam'" class="mv-paxinfo">@ Rp {{ grp(v.hargaJam) }} × {{ v.totalJam }} jam</div>
        <div v-if="v.tipeHarga === 'sesi'" class="mv-paxinfo">@ Rp {{ grp(v.hargaSesi) }} × {{ v.totalSesi }} sesi</div>
        <div v-if="v.tipeHarga === 'orang'" class="mv-paxinfo">@ Rp {{ grp(v.hargaOrang) }} × {{ v.jumlahOrang }} orang</div>
        <div v-if="v.tipeHarga === 'box'" class="mv-paxinfo">@ Rp {{ grp(v.hargaBox) }} × {{ v.jumlahBox }} box</div>
        <div v-if="v.tipeHarga === 'stall'" class="mv-paxinfo">@ Rp {{ grp(v.hargaStall) }} × {{ v.jumlahStall }} stall</div>

        <!-- Detail info -->
        <div v-if="!v.pic && !v.hp && !v.alamat && !v.email && !v.website && !v.instagram && !(v.genreMusik && v.genreMusik.length) && !v.durasiTampil && !v.deskripsi && !v.catatan && !(v.includedVendors && v.includedVendors.length) && v.category !== 'musik' && v.category !== 'fotografer' && v.category !== 'mua' && v.category !== 'mc' && v.category !== 'souvenir' && v.category !== 'wo' && v.category !== 'venue' && v.category !== 'catering'" class="mv-empty-info">Belum ada info tambahan — lengkapi lewat tombol Edit.</div>
        <div v-else class="mv-details">
          <div v-if="v.pic" class="mv-detail-row">
            <span class="mv-detail-lbl">👤 PIC</span>
            <span class="mv-detail-val">{{ v.pic }}</span>
          </div>
          <div v-if="v.hp" class="mv-detail-row">
            <span class="mv-detail-lbl">📱 WhatsApp</span>
            <span class="mv-detail-val">{{ v.hp }}</span>
          </div>
          <div v-if="v.instagram" class="mv-detail-row">
            <span class="mv-detail-lbl">📷 Instagram</span>
            <span class="mv-detail-val">{{ v.instagram }}</span>
          </div>
          <div v-if="v.website" class="mv-detail-row">
            <span class="mv-detail-lbl">🌐 Website</span>
            <span class="mv-detail-val"><a :href="v.website.startsWith('http') ? v.website : 'https://' + v.website" target="_blank" rel="noopener" class="mv-link">{{ v.website }}</a></span>
          </div>
          <div v-if="v.email" class="mv-detail-row">
            <span class="mv-detail-lbl">✉️ Email</span>
            <span class="mv-detail-val">{{ v.email }}</span>
          </div>
          <div v-if="v.genreMusik && v.genreMusik.length" class="mv-detail-row">
            <span class="mv-detail-lbl">🎵 Genre</span>
            <span class="mv-detail-val">{{ v.genreMusik.join(', ') }}</span>
          </div>
          <div v-if="v.durasiTampil" class="mv-detail-row">
            <span class="mv-detail-lbl">⏱️ Durasi Tampil</span>
            <span class="mv-detail-val">{{ v.durasiTampil }}</span>
          </div>
          <div v-if="v.category === 'musik'" class="mv-detail-row">
            <span class="mv-detail-lbl">🎤 Request Lagu</span>
            <span class="mv-detail-val">{{ v.bisaRequestLagu ? 'Bisa' : 'Tidak bisa' }}</span>
          </div>
          <div v-if="v.category === 'fotografer'" class="mv-detail-row">
            <span class="mv-detail-lbl">📸 Prewedding</span>
            <span class="mv-detail-val">{{ v.includePrewedding ? (v.durasiPrewedding || 'Ya') : 'Tidak' }}</span>
          </div>
          <div v-if="v.durasiLiputan" class="mv-detail-row">
            <span class="mv-detail-lbl">🎬 Durasi Liputan</span>
            <span class="mv-detail-val">{{ v.durasiLiputan }}</span>
          </div>
          <div v-if="v.liputanAcara && v.liputanAcara.length" class="mv-detail-row">
            <span class="mv-detail-lbl">📋 Liputan Acara</span>
            <span class="mv-detail-val">{{ v.liputanAcara.join(', ') }}</span>
          </div>
          <div v-if="v.jumlahFotografer || v.jumlahVideografer || v.jumlahContentCreator" class="mv-detail-row">
            <span class="mv-detail-lbl">👥 Tim</span>
            <span class="mv-detail-val">{{ timText(v) }}</span>
          </div>
          <div v-if="v.hasilFotoVideo && v.hasilFotoVideo.length" class="mv-detail-row">
            <span class="mv-detail-lbl">🎁 Hasil</span>
            <span class="mv-detail-val">{{ v.hasilFotoVideo.join(', ') }}</span>
          </div>
          <div v-if="v.estimasiPreview || v.estimasiFotoJadi || v.estimasiVideoJadi" class="mv-detail-row">
            <span class="mv-detail-lbl">⏳ Estimasi</span>
            <span class="mv-detail-val">{{ estimasiText(v) }}</span>
          </div>
          <div v-if="v.alamat" class="mv-detail-row">
            <span class="mv-detail-lbl">📍 Alamat</span>
            <span class="mv-detail-val">{{ v.alamat }}</span>
          </div>

          <div v-if="v.includedVendors && v.includedVendors.length" class="mv-section">
            <div class="mv-section-lbl">🔗 Included Vendor</div>
            <div class="mv-checklist">
              <span v-for="(inc, idx) in v.includedVendors" :key="idx">
                ✓ {{ includedVendorLabel(inc) }}
                <template v-if="includedVendorRef(inc)"> — {{ includedVendorRef(inc).nama }}</template>
                <template v-if="inc.catatan"> ({{ inc.catatan }})</template>
              </span>
            </div>
          </div>

          <template v-if="v.category === 'mua'">
            <div v-if="muaLayananPengantin(v).length" class="mv-section">
              <div class="mv-section-lbl">💄 Layanan Pengantin</div>
              <div class="mv-checklist">
                <span v-for="l in muaLayananPengantin(v)" :key="l">✓ {{ l }}</span>
              </div>
            </div>
            <div v-if="v.includeBusana && v.busanaList && v.busanaList.length" class="mv-section">
              <div class="mv-section-lbl">👗 Busana</div>
              <div class="mv-checklist">
                <span v-for="b in v.busanaList" :key="b.jenis">✓ {{ b.jenis }}<template v-if="b.jumlah > 1"> ({{ b.jumlah }})</template></span>
              </div>
            </div>
            <div v-if="v.layananTambahan && v.layananTambahan.length" class="mv-section">
              <div class="mv-section-lbl">👨‍👩‍👧 Makeup Tambahan</div>
              <div class="mv-checklist">
                <span v-for="l in v.layananTambahan" :key="l.jenis">✓ {{ l.jenis }}<template v-if="l.jumlah > 1"> ({{ l.jumlah }})</template></span>
              </div>
            </div>
            <div v-if="v.trialMakeup || v.touchUp" class="mv-section">
              <div class="mv-section-lbl">✨ Benefit</div>
              <div class="mv-checklist">
                <span v-if="v.trialMakeup">✓ Trial Makeup ({{ v.jumlahTrial }}x)</span>
                <span v-if="v.touchUp">✓ Touch Up<template v-if="v.durasiPendampingan"> — Pendampingan {{ v.durasiPendampingan }}</template></span>
              </div>
            </div>
          </template>

          <div v-if="v.category === 'mc' && ((v.acaraDibawakan && v.acaraDibawakan.length) || v.durasiMembawakan || (v.bahasaMc && v.bahasaMc.length) || (v.adatMc && v.adatMc.length) || v.gayaMc)" class="mv-section">
            <div class="mv-section-lbl">🎤 Layanan</div>
            <div class="mv-checklist">
              <span v-if="v.acaraDibawakan && v.acaraDibawakan.length">Acara: {{ v.acaraDibawakan.join(', ') }}</span>
              <span v-if="v.durasiMembawakan">Durasi: {{ v.durasiMembawakan }}</span>
              <span v-if="v.bahasaMc && v.bahasaMc.length">Bahasa: {{ v.bahasaMc.join(', ') }}</span>
              <span v-if="v.adatMc && v.adatMc.length">Adat: {{ v.adatMc.join(', ') }}</span>
              <span v-if="v.gayaMc">Gaya: {{ v.gayaMc }}</span>
            </div>
          </div>

          <div v-if="v.category === 'souvenir' && (v.namaSouvenir || (v.isiPaketSouvenir && v.isiPaketSouvenir.length) || v.includePackaging || (v.customisasi && v.customisasi.length) || v.jumlahSouvenir || v.minimalOrder || v.estimasiProduksi || v.estimasiPengiriman)" class="mv-section">
            <div class="mv-section-lbl">🎁 Informasi Souvenir</div>
            <div class="mv-checklist">
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

          <div v-if="v.category === 'wo' && (v.jenisLayananWO || (v.layananDidapat && v.layananDidapat.length) || v.jumlahMeeting || v.includeSurveyVenue || v.includeGladiBersih || (v.koordinasiVendor && v.koordinasiVendor.length))" class="mv-section">
            <div class="mv-section-lbl">📋 Informasi Paket</div>
            <div class="mv-checklist">
              <span v-if="v.jenisLayananWO">Jenis Layanan: {{ v.jenisLayananWO }}</span>
              <span v-for="l in v.layananDidapat" :key="l.nama">✓ {{ l.nama }}<template v-if="l.keterangan"> — {{ l.keterangan }}</template></span>
              <span v-if="v.jumlahMeeting">Jumlah Meeting: {{ v.jumlahMeeting }}</span>
              <span v-if="v.includeSurveyVenue">✓ Survey Venue<template v-if="v.jumlahSurvey > 1"> ({{ v.jumlahSurvey }}x)</template></span>
              <span v-if="v.includeGladiBersih">✓ Gladi Bersih</span>
              <span v-if="v.koordinasiVendor && v.koordinasiVendor.length">Koordinasi Vendor: {{ v.koordinasiVendor.join(', ') }}</span>
            </div>
          </div>

          <div v-if="v.category === 'wo' && (v.jumlahCrewHariH || (v.strukturTim && v.strukturTim.length) || v.jumlahKonsumsiTim)" class="mv-section">
            <div class="mv-section-lbl">👥 Tim Wedding Organizer</div>
            <div class="mv-checklist">
              <span v-if="v.jumlahCrewHariH">Jumlah Crew Hari H: {{ v.jumlahCrewHariH }}</span>
              <span v-for="t in v.strukturTim" :key="t.posisi">✓ {{ t.posisi }} ({{ t.jumlah }})</span>
              <span v-if="woTotalPersonel(v) > 0">Total Personel: {{ woTotalPersonel(v) }} orang</span>
              <span v-if="v.jumlahKonsumsiTim">Jumlah Konsumsi Tim: {{ v.jumlahKonsumsiTim }} orang</span>
            </div>
          </div>

          <div v-if="v.category === 'wo' && v.dokumenDidapat && v.dokumenDidapat.length" class="mv-section">
            <div class="mv-section-lbl">📄 Dokumen</div>
            <div class="mv-checklist">
              <span v-for="d in v.dokumenDidapat" :key="d">✓ {{ d }}</span>
            </div>
          </div>

          <div v-if="v.category === 'venue' && (v.jenisVenue || (v.konsepVenue && v.konsepVenue.length) || v.kapasitasMin || v.kapasitasMaks || v.jamMulai || v.jamSelesai || (v.areaAcara && v.areaAcara.length))" class="mv-section">
            <div class="mv-section-lbl">🏛 Informasi Venue</div>
            <div class="mv-checklist">
              <span v-if="v.jenisVenue">Jenis Venue: {{ v.jenisVenue }}</span>
              <span v-if="v.konsepVenue && v.konsepVenue.length">Konsep: {{ v.konsepVenue.join(', ') }}</span>
              <span v-if="v.kapasitasMin || v.kapasitasMaks">Kapasitas: {{ v.kapasitasMin }} - {{ v.kapasitasMaks }} Orang</span>
              <span v-if="v.jamMulai || v.jamSelesai">Durasi: {{ v.jamMulai }} - {{ v.jamSelesai }}</span>
              <span v-for="a in v.areaAcara" :key="a.nama">✓ {{ a.nama }}<template v-if="a.kapasitas"> — {{ a.kapasitas }} Orang</template></span>
            </div>
          </div>

          <div v-if="v.category === 'venue' && v.fasilitasVenue && v.fasilitasVenue.length" class="mv-section">
            <div class="mv-section-lbl">🏢 Fasilitas</div>
            <div class="mv-checklist">
              <span v-for="f in v.fasilitasVenue" :key="f.nama">✓ {{ f.nama }}<template v-if="f.jumlah"> ({{ f.jumlah }})</template></span>
            </div>
          </div>

          <div v-if="v.category === 'venue' && ((v.kebijakanVenue && v.kebijakanVenue.length) || (v.vendorRekanan && v.vendorRekanan.length))" class="mv-section">
            <div class="mv-section-lbl">📜 Kebijakan Venue</div>
            <div class="mv-checklist">
              <span v-for="k in v.kebijakanVenue" :key="k">✓ {{ k }}</span>
              <span v-for="r in v.vendorRekanan" :key="r.nama">Rekanan {{ r.kategori }}: {{ r.nama }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && (v.jenisPaketCatering && v.jenisPaketCatering.length)" class="mv-section">
            <div class="mv-section-lbl">🍽 Jenis Paket</div>
            <div class="mv-checklist">
              <span>{{ v.jenisPaketCatering.join(', ') }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && ((v.buffetAppetizer && v.buffetAppetizer.length) || (v.buffetMainCourse && v.buffetMainCourse.length) || (v.buffetDessert && v.buffetDessert.length) || (v.buffetBeverage && v.buffetBeverage.length))" class="mv-section">
            <div class="mv-section-lbl">🥘 Buffet</div>
            <div class="mv-checklist">
              <span v-if="v.buffetAppetizer && v.buffetAppetizer.length">Appetizer: {{ v.buffetAppetizer.join(', ') }}</span>
              <span v-if="v.buffetMainCourse && v.buffetMainCourse.length">Main Course: {{ v.buffetMainCourse.join(', ') }}</span>
              <span v-if="v.buffetDessert && v.buffetDessert.length">Dessert: {{ v.buffetDessert.join(', ') }}</span>
              <span v-if="v.buffetBeverage && v.buffetBeverage.length">Beverage: {{ v.buffetBeverage.join(', ') }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.foodStall && v.foodStall.length" class="mv-section">
            <div class="mv-section-lbl">🍜 Food Stall</div>
            <div class="mv-checklist">
              <span v-for="s in v.foodStall" :key="s.nama">✓ {{ s.nama }}<template v-if="s.jumlah > 1"> ×{{ s.jumlah }}</template><template v-if="s.keterangan"> — {{ s.keterangan }}</template></span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.includeLiveCooking" class="mv-section">
            <div class="mv-section-lbl">🔥 Live Cooking</div>
            <div class="mv-checklist">
              <span v-if="v.liveCookingList && v.liveCookingList.length">{{ v.liveCookingList.join(', ') }}</span>
              <span v-else>✓ Tersedia</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.includeCatering && v.includeCatering.length" class="mv-section">
            <div class="mv-section-lbl">✅ Include</div>
            <div class="mv-checklist">
              <span v-for="i in v.includeCatering" :key="i">✓ {{ i }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && (v.durasiPelayanan || v.jumlahWaiter || v.jumlahChef || v.sistemRefill)" class="mv-section">
            <div class="mv-section-lbl">👨‍🍳 Pelayanan</div>
            <div class="mv-checklist">
              <span v-if="v.durasiPelayanan">Durasi: {{ v.durasiPelayanan }}</span>
              <span v-if="v.jumlahWaiter">Waiter: {{ v.jumlahWaiter }} orang</span>
              <span v-if="v.jumlahChef">Chef: {{ v.jumlahChef }} orang</span>
              <span v-if="v.sistemRefill">Refill: {{ v.sistemRefill }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.includeFoodTasting" class="mv-section">
            <div class="mv-section-lbl">🧪 Food Tasting</div>
            <div class="mv-checklist">
              <span>✓ Tersedia<template v-if="v.jumlahSesiFoodTasting > 1"> ({{ v.jumlahSesiFoodTasting }} sesi)</template></span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.kebijakanCatering && v.kebijakanCatering.length" class="mv-section">
            <div class="mv-section-lbl">📋 Kebijakan</div>
            <div class="mv-checklist">
              <span v-for="k in v.kebijakanCatering" :key="k">✓ {{ k }}</span>
            </div>
          </div>

          <div v-if="v.category === 'catering' && v.biayaTambahan && v.biayaTambahan.length" class="mv-section">
            <div class="mv-section-lbl">💵 Biaya Tambahan</div>
            <div class="mv-checklist">
              <span v-for="b in v.biayaTambahan" :key="b.nama">{{ b.nama }}: Rp {{ grp(b.nominal) }}<template v-if="b.keterangan"> — {{ b.keterangan }}</template></span>
            </div>
          </div>

          <div v-if="v.deskripsi" class="mv-desc">{{ v.deskripsi }}</div>
          <div v-if="v.catatan" class="mv-desc">📝 {{ v.catatan }}</div>
        </div>

        <!-- Actions -->
        <div class="mv-actions">
          <button v-if="v.hp" class="mv-act-btn wa" @click.stop="openWa(v)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2m5.8 14.16c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.14.07-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.2-1.59-1.2-3.03s.76-2.15 1.03-2.45c.27-.29.58-.37.78-.37.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.27.14.43.12.58-.07.15-.2.67-.78.85-1.05.18-.27.36-.22.61-.13.24.09 1.54.73 1.81.86.27.14.44.2.51.31.06.11.06.66-.18 1.34"/></svg>
            WA
          </button>
          <button class="mv-act-btn edit" @click.stop="$emit('edit', v.id)">Edit</button>
          <button class="mv-act-btn del" @click.stop="store.delVendor(v.id)">Hapus</button>
        </div>
      </div>
    </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER } from '../data/constants'
import { grp, fmtDate, vendorPaxMultText } from '../utils/index'
import { openWa } from './waLink'

defineProps({
  rows: { type: Array, default: () => [] },
  hasCandidates: { type: Boolean, default: false },
  emptyIcon: { type: String, default: '💍' },
  emptyCategoryLabel: { type: String, default: '' },
})
defineEmits(['edit', 'add', 'reset-filter'])

const store = useWeddingStore()
const expandedId = ref(null)

const CAT_ICONS = { wo: '📋', venue: '🏛', catering: '🍽', dekorasi: '🌸', musik: '🎶', fotografer: '📸', mua: '💄', mc: '🎤', souvenir: '🎁' }
const catIcon = id => CAT_ICONS[id] || '💍'
const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }

// 'included' murni status turunan (vendor ini ditunjuk sbg Included Vendor
// oleh vendor lain yang jadi=true) — dipakai buat WARNA KARTU aja, bukan
// buat <select>, soalnya 'included' bukan option yang bisa dipilih user
// (lihat VENDOR_STATUS_ORDER, cuma 3: dipakai/dipertimbangkan/batal).
const cardStatusKey = v => {
  if (v.jadi) return 'dipakai'
  if (store.vendorIncludedByOther(v.id)) return 'included'
  return v.status === 'dipertimbangkan' ? 'dipertimbangkan' : 'batal'
}
// Ini yang dipakai buat <select> — selalu salah satu dari 3 option asli
// (nggak pernah 'included'), biar dropdown-nya valid & bisa diklik normal.
const statusKey = v => v.jadi ? 'dipakai' : (v.status === 'dipertimbangkan' ? 'dipertimbangkan' : 'batal')
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function includedVendorLabel(inc) {
  const c = VENDOR_CATEGORIES.find(x => x.id === inc.category)
  return c ? c.label : 'Lainnya'
}
function includedVendorRef(inc) {
  if (!inc.vendorId) return null
  return store.vendors.find(v => v.id === inc.vendorId) || null
}

const TIPE_HARGA_TAGS = { pax: 'Per pax', item: 'Per item', jam: 'Per jam', sesi: 'Per sesi', orang: 'Per orang', sewa: 'Sewa Venue', box: 'Per box', stall: 'Per stall' }
const tipeHargaTag = v => TIPE_HARGA_TAGS[v.tipeHarga] || 'All in'

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
</script>

<style scoped>
.mv-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mv-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mv-fade-enter-active, .mv-fade-leave-active { transition: opacity .22s ease, transform .22s ease; }
.mv-fade-enter-from, .mv-fade-leave-to { opacity: 0; transform: translateY(6px); }
.mv-fade-leave-active { position: absolute; width: 100%; }
.mv-fade-move { transition: transform .22s ease; }
.mv-empty {
  background: var(--paper);
  border: 1px dashed var(--line);
  border-radius: 18px;
  padding: 44px 24px;
  text-align: center;
}
.mv-empty-ico {
  width: 52px; height: 52px; margin: 0 auto 14px;
  display: grid; place-items: center;
  font-size: 24px; background: var(--gold-soft); border-radius: 50%;
}
.mv-empty-big {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px; font-weight: 600; color: var(--cacao);
  margin-bottom: 6px;
}
.mv-empty div:not(.mv-empty-ico):not(.mv-empty-big) { font-size: 13px; color: var(--muted); margin-bottom: 18px; }
.mv-empty-btn {
  min-height: 44px; padding: 0 20px;
  border: none; border-radius: 100px;
  background: var(--plum); color: #fff;
  font-family: 'Jost', sans-serif; font-size: 13.5px; font-weight: 600;
  cursor: pointer;
}
.mv-empty-btn-ghost { background: var(--paper); border: 1.5px solid var(--line); color: var(--plum); }
.mv-card {
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(36, 8, 8, .05);
  overflow: hidden;
}
.mv-card.mvs-dipakai { border-left-color: var(--green); }
.mv-card.mvs-batal   { border-left-color: var(--rose); }
.mv-card.mvs-dipertimbangkan { border-left-color: var(--gold); }
.mv-card.mvs-included        { border-left-color: var(--teal); }

/* Row (klik buka/tutup) */
.mv-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
}
.mv-cat-ico {
  flex: none; width: 28px; height: 28px; margin-top: 1px;
  display: grid; place-items: center;
  font-size: 14px; background: var(--gold-soft); border-radius: 8px;
}
.mv-exp-btn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin-top: 2px;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  flex: none;
}
.mv-chev { transition: transform .2s; }
.mv-card.expanded .mv-chev { transform: rotate(180deg); }

.mv-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.mv-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.mv-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--m-title, 17px);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.15;
  word-break: break-word;
}
.mv-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mv-price {
  font-size: var(--m-value, 15px);
  font-weight: 700;
  color: var(--plum);
}
.mv-price small { font-weight: 500; color: var(--muted); }
.mv-cap {
  font-size: var(--m-sub, 12px);
  font-weight: 600;
  color: #3b6d11;
  background: var(--green-soft);
  border-radius: 100px;
  padding: 2px 9px;
}
.mv-catlbl { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); }
.mv-inc-src { font-size: 11.5px; color: var(--teal); font-weight: 600; }
.mv-status-sel {
  font-family: 'Jost', sans-serif;
  font-size: var(--m-sub, 12px);
  font-weight: 600;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 5px 10px;
  cursor: pointer;
  background: var(--paper);
  flex: none;
}
.mv-status-sel.vs-dipakai { color: #2b5010; background: #EAF3DE; border-color: #bcd79a; }
.mv-status-sel.vs-batal   { color: #6b4848; background: #EDE5E2; border-color: #ddc9c9; }
.mv-status-sel.vs-dipertimbangkan { color: #7a5c28; background: var(--gold-soft); border-color: var(--gold); }

/* Body (expand ke bawah) */
.mv-body {
  padding: 0 14px 14px 34px;
  border-top: 1px dashed var(--line);
}
.mv-paxinfo { padding-top: 10px; font-size: 11.5px; color: var(--muted); }
.mv-empty-info { padding-top: 10px; font-size: 12px; color: var(--muted); }

/* Payment block */
.mv-payblock {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--ivory);
  border-radius: 10px;
}
.mv-pay-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ink); }
.mv-pay-sub { font-size: 11px; font-weight: 500; color: var(--muted); }
.mv-lunas { color: var(--green); }
.mv-paybar { height: 5px; background: var(--line); border-radius: 100px; overflow: hidden; margin: 7px 0 5px; }
.mv-paybar > span { display: block; height: 100%; background: var(--gold); border-radius: 100px; }
.mv-due { font-size: 11.5px; color: #7a5c28; }

/* Detail info */
.mv-details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mv-detail-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  color: var(--ink);
}
.mv-detail-lbl {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: .03em;
  white-space: nowrap;
  margin-right: 2px;
}
.mv-detail-val {
  word-break: break-word;
}
.mv-link { color: var(--plum); text-decoration: none; }
.mv-link:active { text-decoration: underline; }
.mv-desc {
  margin-top: 4px;
  font-size: 12.5px;
  color: #5f4a4a;
  font-style: italic;
  line-height: 1.45;
  white-space: pre-wrap;
}
.mv-section { margin-top: 10px; }
.mv-section-lbl { font-size: 10.5px; font-weight: 700; color: var(--plum); text-transform: uppercase; letter-spacing: .03em; margin-bottom: 4px; }
.mv-checklist { display: flex; flex-direction: column; gap: 3px; font-size: 12.5px; color: var(--ink); }

/* Actions */
.mv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.mv-act-btn {
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--plum);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.mv-act-btn:active { background: var(--gold-soft); border-color: var(--gold); }
.mv-act-btn.wa { background: #25D366; color: #fff; border-color: #25D366; }
.mv-act-btn.wa:active { filter: brightness(.95); }
.mv-act-btn.del { color: var(--rose); }
.mv-act-btn.del:active { background: var(--rose-soft); border-color: var(--rose); }
</style>
