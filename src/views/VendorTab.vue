<template>
  <section class="panel active" id="panel-vendor">

    <!-- ═══ MOBILE ONLY — Information First: Hero → Search → Kategori → Daftar ═══ -->
    <template v-if="isMobile">
      <VendorHeroMobile
        class="vhm-hero-anchor"
        :progress-pct="progressPct"
        :decided-count="decidedCount"
        :total-categories="totalCategories"
        :status-buckets="statusBuckets"
        :total-biaya="totalBiaya"
        :dipakai-count="dipakaiList.length"
        :next-categories="nextCategories"
        :active-status="heroStatusFilter"
        :show-sticky="store.activeTab === 'vendor'"
        @jump-category="id => (store.vFilter = id)"
        @select-status="heroStatusFilter = $event"
      />

      <div class="vhm-toolbar">
        <div class="vhm-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9C7575" stroke-width="2"/><path d="M21 21l-4-4" stroke="#9C7575" stroke-width="2" stroke-linecap="round"/></svg>
          <input v-model="searchQ" type="text" placeholder="Cari vendor atau paket...">
        </div>
        <button
          type="button" class="vhm-filter-btn"
          :class="{ active: statusFilter !== 'semua' || sortBy !== 'terbaru' }"
          @click="filterSheetOpen = true"
          aria-label="Filter"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        </button>
        <div class="vhm-overflow-wrap" ref="overflowWrapRef">
          <button type="button" class="vhm-overflow-btn" aria-label="Menu lainnya" @click="overflowOpen = !overflowOpen">⋮</button>
          <div v-if="overflowOpen" class="vhm-overflow-menu">
            <button type="button" @click="overflowOpen = false; store.exportTab('vendor')">📤 Export</button>
            <button type="button" @click="overflowOpen = false; importRef?.click()">📥 Import</button>
            <button type="button" @click="overflowOpen = false; store.startTour(VENDOR_STEPS)">🧭 Panduan</button>
          </div>
        </div>
      </div>

      <div class="vhm-catrow">
        <button
          v-for="c in VENDOR_CATEGORIES" :key="c.id" type="button"
          class="vhm-catpill" :class="{ on: store.vFilter === c.id }"
          @click="store.vFilter = c.id"
        >
          <span>{{ catIcon(c.id) }}</span>{{ c.label }}
          <span class="vhm-catpill-badge">{{ categoryCount(c.id) }}</span>
        </button>
      </div>

      <div v-if="categoryFulfillment && heroStatusFilter === 'semua'" class="vhm-fulfilled">
        <span class="vhm-fulfilled-ico">{{ catIcon(categoryFulfillment.category) }}</span>
        <div class="vhm-fulfilled-main">
          <div class="vhm-fulfilled-lbl">Sudah dipenuhi oleh {{ catLabel(categoryFulfillment.category) }}</div>
          <div class="vhm-fulfilled-name">{{ categoryFulfillment.nama }}<template v-if="categoryFulfillment.namaPaket"> · {{ categoryFulfillment.namaPaket }}</template></div>
        </div>
        <button type="button" class="vhm-fulfilled-btn" @click="jumpToVendor(categoryFulfillment)">Lihat</button>
      </div>

      <div v-if="heroStatusFilter !== 'semua' && !filteredRows.length" class="vhm-fulfilled vhm-status-empty">
        <span class="vhm-fulfilled-ico">{{ VENDOR_STATUS[heroStatusFilter].icon }}</span>
        <div class="vhm-fulfilled-main">
          <div class="vhm-fulfilled-lbl">Belum ada vendor dengan status {{ heroStatusLabel }}</div>
          <div class="vhm-fulfilled-name">Coba pilih status lain</div>
        </div>
        <button type="button" class="vhm-fulfilled-btn" @click="heroStatusFilter = 'semua'">Semua</button>
      </div>

      <MobileVendorList
        v-if="heroStatusFilter === 'semua' || filteredRows.length"
        :rows="filteredRows"
        :has-candidates="!!catRows.length"
        :empty-icon="catIcon(store.vFilter)"
        :empty-category-label="catLabel(store.vFilter)"
        @edit="openEdit"
        @add="openAdd"
        @reset-filter="resetFilters"
      />

      <VendorFilterSheetMobile
        :show="filterSheetOpen"
        :status="statusFilter"
        :sort="sortBy"
        @close="filterSheetOpen = false"
        @apply="applyMobileFilter"
      />
    </template>

    <!-- ═══ Hero: progress persiapan + budget + langkah berikutnya ═══ -->
    <div class="vh-hero" v-if="!isMobile">
      <div class="vh-progress-card">
        <div class="vh-progress-top">
          <span class="vh-progress-title"><span class="vh-progress-ico">💍</span> Persiapan Vendor</span>
          <span class="vh-progress-pct">{{ progressPct }}%</span>
        </div>
        <div class="vh-progressbar"><span :style="{ width: progressPct + '%' }"></span></div>
        <div class="vh-progress-sub">{{ decidedCount }} dari {{ totalCategories }} kategori vendor sudah dipilih</div>
        <!-- Status Summary — sekaligus shortcut filter buat daftar vendor di
             bawah (lintas kategori kalau salah satu status dipilih). -->
        <div class="vh-buckets">
          <button type="button" class="vh-bucket" :class="{ active: heroStatusFilter === 'semua' }" @click="setHeroStatusFilter('semua')">Semua</button>
          <button type="button" class="vh-bucket" :class="{ active: heroStatusFilter === 'dipakai' }" @click="setHeroStatusFilter('dipakai')">
            <span class="vh-bucket-ico">✓</span><b>{{ statusBuckets.dipilih }}</b> Dipilih
          </button>
          <button type="button" class="vh-bucket vh-bucket-inc" :class="{ active: heroStatusFilter === 'included' }" @click="setHeroStatusFilter('included')">
            <span class="vh-bucket-ico">🔗</span><b>{{ statusBuckets.included }}</b> Included
          </button>
          <button type="button" class="vh-bucket vh-bucket-muted" :class="{ active: heroStatusFilter === 'batal' }" @click="setHeroStatusFilter('batal')">
            <span class="vh-bucket-ico">○</span><b>{{ statusBuckets.belum }}</b> Belum Dipilih
          </button>
        </div>

        <div v-if="nextCategories.length" class="vh-progress-next">
          <span class="vh-progress-next-lbl">Berikutnya yang perlu dipilih</span>
          <span class="vh-progress-next-val">{{ nextCategoriesPreview }}</span>
        </div>
        <div v-else class="vh-progress-next done">✓ Semua kategori vendor sudah punya pilihan</div>
      </div>

      <div class="vh-side">
        <div class="vh-mini-card">
          <div class="vh-mini-lbl">💰 Budget Vendor</div>
          <div class="vh-mini-val">Rp {{ grp(totalBiaya) }}</div>
          <div class="vh-mini-sub">{{ dipakaiList.length }} vendor terpilih</div>
        </div>
        <div class="vh-mini-card">
          <div class="vh-mini-lbl">📌 Langkah Berikutnya</div>
          <div v-if="nextCategories.length" class="vh-next-chips">
            <button v-for="c in nextCategories" :key="c.id" class="vh-next-chip" @click="store.vFilter = c.id">
              {{ catIcon(c.id) }} {{ c.label }}
            </button>
          </div>
          <div v-else class="vh-mini-sub">Semua kategori sudah punya vendor 🎉</div>
        </div>
      </div>
    </div>

    <!-- ═══ Ringkasan kecil (insight) ═══ -->
    <div v-if="!isMobile && (priciest || cheapest || topCategory)" class="vh-insights">
      <div v-if="priciest" class="vh-insight">
        <span class="vh-ins-ico">⭐</span>
        <div>
          <div class="vh-ins-lbl">Vendor Termahal</div>
          <div class="vh-ins-name">{{ priciest.nama }}</div>
          <div class="vh-ins-val">Rp {{ grp(store.vendorEffectiveHarga(priciest)) }}</div>
        </div>
      </div>
      <div v-if="cheapest" class="vh-insight">
        <span class="vh-ins-ico">💰</span>
        <div>
          <div class="vh-ins-lbl">Vendor Termurah</div>
          <div class="vh-ins-name">{{ cheapest.nama }}</div>
          <div class="vh-ins-val">Rp {{ grp(store.vendorEffectiveHarga(cheapest)) }}</div>
        </div>
      </div>
      <div v-if="topCategory" class="vh-insight">
        <span class="vh-ins-ico">📂</span>
        <div>
          <div class="vh-ins-lbl">Kategori Terbanyak</div>
          <div class="vh-ins-name">{{ topCategory.label }}</div>
          <div class="vh-ins-val">{{ topCategory.count }} Vendor</div>
        </div>
      </div>
    </div>

    <!-- Category pills -->
    <div v-if="!isMobile" id="vChips" class="vh-catrow">
      <button v-for="c in VENDOR_CATEGORIES" :key="c.id" class="vh-catpill" :class="{ on: store.vFilter === c.id }" @click="store.vFilter = c.id">
        <span class="vh-catpill-ico">{{ catIcon(c.id) }}</span>{{ c.label }}
        <span class="vh-catpill-badge">{{ categoryCount(c.id) }}</span>
      </button>
    </div>

    <!-- Toolbar -->
    <div v-if="!isMobile" class="controls st-toolbar sticky" ref="toolbarRef">
      <button class="icon-btn solid" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Vendor
      </button>
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9C7575" stroke-width="2"/><path d="M21 21l-4-4" stroke="#9C7575" stroke-width="2" stroke-linecap="round"/></svg>
        <input v-model="searchQ" type="text" placeholder="Cari nama vendor atau paket...">
      </div>
      <select class="filter" v-model="statusFilter">
        <option value="semua">Semua Status</option>
        <option value="dipakai">Dipakai</option>
        <option value="dipertimbangkan">Dipertimbangkan</option>
        <option value="included">Included</option>
        <option value="batal">Belum Dipilih</option>
      </select>
      <select class="filter" v-model="sortBy">
        <option value="terbaru">Terbaru</option>
        <option value="harga-rendah">Harga Terendah</option>
        <option value="harga-tinggi">Harga Tertinggi</option>
      </select>
      <div class="tab-io">
        <button class="icon-btn tio-btn" @click="store.exportTab('vendor')">Export</button>
        <button class="icon-btn tio-btn" @click="importRef?.click()">Import</button>
      </div>
      <TourBtn :steps="VENDOR_STEPS" />
    </div>

    <input ref="importRef" type="file" accept=".json" hidden @change="onImport">

    <!-- Chip list (PC) -->
    <div v-if="!isMobile">
      <!-- Hero Status Summary lagi aktif: tampilan lintas kategori, banner
           & empty-state kategori-spesifik di bawah ini disembunyikan. -->
      <template v-if="heroStatusFilter !== 'semua'">
        <div v-if="!filteredRows.length" class="vh-empty">
          <div class="vh-empty-ico">{{ VENDOR_STATUS[heroStatusFilter].icon }}</div>
          <div class="vh-empty-title">Belum ada vendor dengan status {{ heroStatusLabel }}</div>
          <div class="vh-empty-sub">Coba pilih status lain, atau kembali ke "Semua".</div>
          <button class="icon-btn" @click="heroStatusFilter = 'semua'">Tampilkan Semua</button>
        </div>
      </template>

      <template v-else>
        <!-- Kategori sudah dipenuhi lewat Included Vendor punya vendor lain -->
        <div v-if="categoryFulfillment" class="vh-fulfilled">
          <div class="vh-fulfilled-lbl">Kategori {{ catLabel(store.vFilter) }} sudah dipenuhi oleh:</div>
          <div class="vh-fulfilled-vendor">
            <span class="vh-fulfilled-ico">{{ catIcon(categoryFulfillment.category) }}</span>
            <div class="vh-fulfilled-main">
              <div class="vh-fulfilled-cat">{{ catLabel(categoryFulfillment.category) }}</div>
              <div class="vh-fulfilled-name">{{ categoryFulfillment.nama }}<template v-if="categoryFulfillment.namaPaket"> · {{ categoryFulfillment.namaPaket }}</template></div>
            </div>
            <span class="vh-fulfilled-status">🔗 Included</span>
          </div>
          <div class="vh-fulfilled-actions">
            <button type="button" class="icon-btn" @click="jumpToVendor(categoryFulfillment)">Lihat Vendor</button>
            <button type="button" class="icon-btn solid" @click="openAdd">Gunakan Vendor Lain</button>
          </div>
        </div>

        <div v-if="!catRows.length && !categoryFulfillment" class="vh-empty">
          <div class="vh-empty-ico">{{ catIcon(store.vFilter) }}</div>
          <div class="vh-empty-title">Belum ada Vendor {{ catLabel(store.vFilter) }}</div>
          <div class="vh-empty-sub">Tambahkan vendor pertama agar persiapanmu semakin lengkap.</div>
          <button class="icon-btn solid" @click="openAdd">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>Tambah Vendor
          </button>
        </div>

        <div v-if="catRows.length && !filteredRows.length" class="vh-empty">
          <div class="vh-empty-ico">🔍</div>
          <div class="vh-empty-title">Tidak ada vendor yang cocok</div>
          <div class="vh-empty-sub">Coba ubah kata pencarian atau filter yang dipakai.</div>
          <button class="icon-btn" @click="resetFilters">Reset Filter</button>
        </div>
      </template>

      <TransitionGroup
        v-if="filteredRows.length" tag="div" name="vh-fade" class="vh-chiplist"
      >
        <div
          v-for="v in filteredRows"
          :key="v.id"
          class="vh-chip-wrap"
          :class="{ expanded: expandedId === v.id, sel: store.isSelected(v.id) }"
        >
          <div class="vh-chip" @click="toggleExpand(v.id)">
            <label class="vt-cbx" @click.stop>
              <input type="checkbox" class="cbx" :checked="store.isSelected(v.id)" @change="e => store.toggleSelected(v.id, e.target.checked)">
            </label>

            <span class="vh-chip-ico">{{ catIcon(v.category) }}</span>

            <div class="vh-chip-main">
              <span class="vh-chip-cat">{{ catLabel(v.category) }}</span>
              <span class="vh-chip-name">{{ v.nama || 'Tanpa nama' }}<template v-if="v.namaPaket"> · {{ v.namaPaket }}</template></span>
              <div v-if="v.includedVendors && v.includedVendors.length" class="vh-chip-inc">
                <span>🔗 Termasuk:</span>
                <span v-for="(inc, idx) in v.includedVendors" :key="idx" class="vh-chip-inc-chip">✓ {{ includedVendorLabel(inc) }}</span>
              </div>
            </div>

            <div class="vh-chip-price">
              <span class="vh-chip-rp">Rp {{ grp(store.vendorEffectiveHarga(v)) }}</span>
              <span class="vh-chip-tag">{{ tipeHargaTag(v) }}</span>
            </div>

            <div class="vh-chip-status" @click.stop>
              <SwitchToggle :model-value="!!v.jadi" title="Dipakai?" @update:model-value="val => store.setVendorStatus(v, val ? 'dipakai' : 'batal')" />
              <span class="vh-chip-statlbl" :class="'st-' + resolvedStatus(v)">{{ VENDOR_STATUS[resolvedStatus(v)].icon }} {{ VENDOR_STATUS[resolvedStatus(v)].label }}</span>
            </div>

            <button type="button" class="vh-chip-exp" @click.stop="toggleExpand(v.id)" :aria-label="expandedId === v.id ? 'Tutup detail' : 'Buka detail'">
              <svg class="vt-chev" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          <!-- Detail info (expand ke bawah) -->
          <div v-if="expandedId === v.id" class="vt-body">
            <div v-if="v.tipeHarga === 'pax'" class="vt-paxinfo">@ Rp {{ grp(v.hargaPax) }} × {{ vendorPaxMultText(v, store) }}</div>
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

            <div v-if="v.includedVendors && v.includedVendors.length" class="vt-section">
              <div class="vt-section-lbl">🔗 Included Vendor</div>
              <div class="vt-checklist">
                <span v-for="(inc, idx) in v.includedVendors" :key="idx">
                  ✓ {{ includedVendorLabel(inc) }}
                  <template v-if="includedVendorRef(inc)"> — {{ includedVendorRef(inc).nama }}</template>
                  <template v-if="inc.catatan"> ({{ inc.catatan }})</template>
                </span>
              </div>
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
            <div v-if="!v.pic && !v.hp && !v.website && !v.instagram && !v.email && !v.alamat && !(v.genreMusik && v.genreMusik.length) && !v.durasiTampil && !v.deskripsi && !v.catatan && !(v.includedVendors && v.includedVendors.length) && v.category !== 'musik' && v.category !== 'fotografer' && v.category !== 'mua' && v.category !== 'mc' && v.category !== 'souvenir' && v.category !== 'wo' && v.category !== 'venue' && v.category !== 'catering'" class="vt-empty-info">Belum ada info tambahan — lengkapi lewat tombol Edit.</div>

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
      </TransitionGroup>
    </div>

    <VendorModal :show="modalShow" :edit-id="editId" :default-category="store.vFilter" @close="modalShow = false" />
    <BudgetDetailModal :show="payShow" :item-id="payItemId" @close="payShow = false" />
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useWeddingStore } from '../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS } from '../data/constants'
import { grp, fmtDate, vendorPaxMultText } from '../utils/index'
import { openWa } from '../mobile layout/waLink'
import VendorModal from '../components/modals/VendorModal.vue'
import BudgetDetailModal from '../components/modals/BudgetDetailModal.vue'
import { useIsMobile } from '../mobile layout/useIsMobile'
import MobileVendorList from '../mobile layout/MobileVendorList.vue'
import VendorHeroMobile from '../mobile layout/VendorHeroMobile.vue'
import VendorFilterSheetMobile from '../mobile layout/VendorFilterSheetMobile.vue'
import TourBtn from '../components/TourBtn.vue'
import { useStickyThead } from '../composables/useStickyThead'
import SwitchToggle from '../components/SwitchToggle.vue'

const store     = useWeddingStore()
const modalShow = ref(false)
const editId    = ref(null)
const importRef = ref(null)
const isMobile  = useIsMobile()
const { toolbarRef } = useStickyThead()

const expandedId = ref(null)
const payShow    = ref(false)
const payItemId  = ref(null)

// Search/filter/sort — murni tampilan, gak ubah data di store.
const searchQ      = ref('')
const statusFilter = ref('semua')
const sortBy       = ref('terbaru')

const CAT_ICONS = { wo: '📋', venue: '🏛', catering: '🍽', dekorasi: '🌸', musik: '🎶', fotografer: '📸', mua: '💄', mc: '🎤', souvenir: '🎁' }
const catIcon = id => CAT_ICONS[id] || '💍'

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

const VENDOR_STEPS = computed(() => isMobile.value ? [
  {
    selector: '.vhm-hero-anchor',
    icon: '💍',
    title: 'Progress Persiapan Vendor',
    desc: 'Progress, ringkasan status (Dipilih/Included/Belum Dipilih), budget, dan langkah berikutnya — semuanya digabung jadi satu kartu di paling atas.',
  },
  {
    selector: '.vhm-search',
    icon: '🔍',
    title: 'Cari & Filter Vendor',
    desc: 'Cari vendor/paket lewat kotak ini. Tombol di sampingnya buka filter status & urutan, tombol ⋮ berisi Export, Import, dan Panduan.',
  },
  {
    selector: '.vhm-catrow',
    icon: '🏷️',
    title: 'Kategori Vendor',
    desc: 'Geser ke samping buat pindah kategori. Angka di tiap chip nunjukin jumlah vendor yang udah kecatat di kategori itu.',
  },
  {
    selector: '.mv-card',
    icon: '📋',
    title: 'Kartu Vendor',
    desc: 'Ketuk kartunya buat buka detail — alamat, HP, email, website/Instagram, dan deskripsi lengkap.',
  },
  {
    selector: '.mv-status-sel',
    icon: '🔄',
    title: 'Status Vendor → Budget',
    desc: 'Ubah status ke "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dibatalkan, otomatis dihapus dari Budget.',
  },
  {
    selector: '.mv-act-btn.wa',
    icon: '📱',
    title: 'Hubungi via WhatsApp',
    desc: 'Tombol WA langsung membuka chat ke nomor vendor yang sudah diisi. Aktif hanya kalau nomor HP terisi.',
  },
] : [
  {
    selector: '.vh-progress-card',
    icon: '💍',
    title: 'Progress Persiapan Vendor',
    desc: 'Persentase kategori vendor yang sudah punya pilihan "Dipakai", plus daftar kategori yang masih perlu diputuskan.',
  },
  {
    selector: '.vh-side',
    icon: '💰',
    title: 'Budget & Langkah Berikutnya',
    desc: 'Total biaya semua vendor yang sudah dipakai, dan pintasan ke kategori yang belum punya vendor terpilih.',
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
    selector: '.vh-chip-wrap',
    icon: '📋',
    title: 'Kartu Vendor',
    desc: 'Klik kartunya untuk buka detail — alamat, HP, email, website/Instagram, dan deskripsi lengkap.',
  },
  {
    selector: '.vh-chip-price',
    icon: '💰',
    title: 'Sistem Harga Vendor',
    desc: 'All In berarti harga tetap terlepas dari jumlah tamu. Per Pax dikalikan otomatis dari jumlah tamu terkonfirmasi di tab Tamu — angkanya update sendiri kalau tamu bertambah.',
  },
  {
    selector: '.vh-chip-status',
    icon: '🔄',
    title: 'Status Vendor → Budget',
    desc: 'Ubah status ke "Dipakai" dan harga vendor langsung masuk ke tab Budget sebagai item baru. Kalau dibatalkan, otomatis dihapus dari Budget. Tidak perlu input manual.',
  },
])

const catLabel = id => { const c = VENDOR_CATEGORIES.find(x => x.id === id); return c ? c.label : id }
const TIPE_HARGA_TAGS = { pax: 'Per pax', item: 'Per item', jam: 'Per jam', sesi: 'Per sesi', orang: 'Per orang', sewa: 'Sewa Venue', box: 'Per box', stall: 'Per stall' }
const tipeHargaTag = v => TIPE_HARGA_TAGS[v.tipeHarga] || 'All in'

const dipakaiList = computed(() => store.vendors.filter(v => v.jadi))
// Vendor tipe "pax" dihitung LIVE dari Tab Tamu lewat vendorEffectiveHarga
// (Single Source of Truth) — bukan v.harga apa adanya, yang buat tipe pax
// bisa basi begitu jumlah tamu berubah tanpa vendornya disimpan ulang.
const totalBiaya  = computed(() => dipakaiList.value.reduce((s, v) => s + store.vendorEffectiveHarga(v), 0))
const catRows     = computed(() => store.vendors.filter(v => v.category === store.vFilter))

// ── Hero: progress per-kategori (bukan per-baris vendor) ──
// Kategori dianggap "selesai" kalau ada vendor jadi=true langsung DI
// kategori itu, ATAU kategori itu sudah di-cover lewat Included Vendor
// punya vendor lain yang jadi=true (mis. Venue yang paketnya include WO).
function isCategoryDone(catId) {
  return store.vendors.some(v => v.category === catId && v.jadi) || !!store.categoryIncludedBy(catId)
}
const totalCategories   = computed(() => VENDOR_CATEGORIES.length)
const decidedCategories = computed(() => VENDOR_CATEGORIES.filter(c => isCategoryDone(c.id)))
const decidedCount      = computed(() => decidedCategories.value.length)
const progressPct       = computed(() => totalCategories.value ? Math.round(decidedCount.value / totalCategories.value * 100) : 0)
const nextCategories    = computed(() => VENDOR_CATEGORIES.filter(c => !decidedCategories.value.includes(c)))
const nextCategoriesPreview = computed(() => {
  const arr = nextCategories.value
  if (!arr.length) return ''
  if (arr.length <= 4) return arr.map(c => c.label).join(' • ')
  return arr.slice(0, 4).map(c => c.label).join(' • ') + ` +${arr.length - 4} lainnya`
})
const categoryCount = id => store.vendors.filter(v => v.category === id).length

// Dashboard 3-bucket: tiap kategori dihitung SATU kali — dipilih langsung,
// included lewat vendor lain, atau belum ada dua-duanya.
const statusBuckets = computed(() => {
  let dipilih = 0, included = 0, belum = 0
  for (const c of VENDOR_CATEGORIES) {
    if (store.vendors.some(v => v.category === c.id && v.jadi)) dipilih++
    else if (store.categoryIncludedBy(c.id)) included++
    else belum++
  }
  return { dipilih, included, belum }
})

// Status Summary Hero — shortcut filter lintas kategori. 'semua' = kondisi
// default (balik ke daftar per-kategori biasa). Milih kategori manual di
// bawah otomatis reset balik ke 'semua' (lihat watcher store.vFilter).
const heroStatusFilter = ref('semua')
function setHeroStatusFilter(key) { heroStatusFilter.value = heroStatusFilter.value === key ? 'semua' : key }
const HERO_STATUS_LABEL = { dipakai: 'Dipilih', included: 'Included', batal: 'Belum Dipilih' }
const heroStatusLabel = computed(() => HERO_STATUS_LABEL[heroStatusFilter.value] || '')
watch(() => store.vFilter, () => { heroStatusFilter.value = 'semua' })

// Mobile only: overflow menu (Export/Import/Panduan) & bottom sheet filter.
const overflowOpen    = ref(false)
const overflowWrapRef = ref(null)
const filterSheetOpen = ref(false)
function applyMobileFilter({ status, sort }) { statusFilter.value = status; sortBy.value = sort }

// Klik di luar menu overflow → tutup. Esc nutup overflow & filter sheet.
function onBucketDocClick(e) {
  if (overflowOpen.value && !overflowWrapRef.value?.contains(e.target)) overflowOpen.value = false
}
function onBucketKeydown(e) {
  if (e.key !== 'Escape') return
  if (overflowOpen.value) overflowOpen.value = false
  if (filterSheetOpen.value) filterSheetOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onBucketDocClick)
  document.addEventListener('keydown', onBucketKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onBucketDocClick)
  document.removeEventListener('keydown', onBucketKeydown)
})

// Status per-baris vendor buat chip/filter — 'included' itu turunan
// (bukan disimpan di row), menang duluan sebelum 'dipertimbangkan' kalau
// vendor ini kebetulan juga ditunjuk sebagai Included Vendor vendor lain.
function resolvedStatus(v) {
  if (v.jadi) return 'dipakai'
  if (store.vendorIncludedByOther(v.id)) return 'included'
  if (v.status === 'dipertimbangkan') return 'dipertimbangkan'
  return 'batal'
}

// Kalau kategori yang lagi dibuka sudah di-cover vendor lain (Included),
// dipakai buat nampilin banner "sudah dipenuhi oleh..." di atas daftar.
const categoryFulfillment = computed(() => {
  if (store.vendors.some(v => v.category === store.vFilter && v.jadi)) return null
  return store.categoryIncludedBy(store.vFilter)
})

function jumpToVendor(v) {
  store.vFilter = v.category
  expandedId.value = v.id
}

function includedVendorLabel(inc) {
  const c = VENDOR_CATEGORIES.find(x => x.id === inc.category)
  return c ? c.label : 'Lainnya'
}
function includedVendorRef(inc) {
  if (!inc.vendorId) return null
  return store.vendors.find(v => v.id === inc.vendorId) || null
}

// ── Insight kecil ──
const priciest = computed(() => dipakaiList.value.length
  ? [...dipakaiList.value].sort((a, b) => store.vendorEffectiveHarga(b) - store.vendorEffectiveHarga(a))[0]
  : null)
const cheapest = computed(() => {
  if (dipakaiList.value.length < 2) return null
  const sorted = [...dipakaiList.value].sort((a, b) => store.vendorEffectiveHarga(a) - store.vendorEffectiveHarga(b))
  return sorted[0].id === priciest.value?.id ? null : sorted[0]
})
const topCategory = computed(() => {
  if (!store.vendors.length) return null
  const counts = {}
  store.vendors.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1 })
  let best = null
  for (const c of VENDOR_CATEGORIES) {
    const n = counts[c.id] || 0
    if (n > 0 && (!best || n > best.count)) best = { id: c.id, label: c.label, count: n }
  }
  return best
})

// ── Search / filter / sort (tampilan saja, di atas catRows) ──
const filteredRows = computed(() => {
  // Hero Status Summary aktif ('semua' dilepas) → daftar lintas SEMUA
  // kategori, difilter status turunan (resolvedStatus). Kondisi default
  // ('semua') tetap daftar per-kategori biasa kayak sebelumnya.
  const heroActive = heroStatusFilter.value !== 'semua'
  let rows = heroActive ? store.vendors : catRows.value
  const q = searchQ.value.trim().toLowerCase()
  if (q) rows = rows.filter(v => (v.nama || '').toLowerCase().includes(q) || (v.namaPaket || '').toLowerCase().includes(q))
  if (heroActive) rows = rows.filter(v => resolvedStatus(v) === heroStatusFilter.value)
  else if (statusFilter.value !== 'semua') rows = rows.filter(v => resolvedStatus(v) === statusFilter.value)
  rows = [...rows]
  if (sortBy.value === 'harga-rendah') rows.sort((a, b) => store.vendorEffectiveHarga(a) - store.vendorEffectiveHarga(b))
  else if (sortBy.value === 'harga-tinggi') rows.sort((a, b) => store.vendorEffectiveHarga(b) - store.vendorEffectiveHarga(a))
  else if (sortBy.value === 'nama') rows.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''))
  else rows.sort((a, b) => (b.id || 0) - (a.id || 0))
  return rows
})
function resetFilters() { searchQ.value = ''; statusFilter.value = 'semua' }

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

/* ═══════════════════════════════════════════════════════════════════
   MOBILE ONLY — dipakai di dalam <template v-if="isMobile"> di atas.
   Layout/style PC di bawah sini SAMA SEKALI nggak disentuh/diubah.
   ═══════════════════════════════════════════════════════════════════ */
.vhm-toolbar { display: flex; align-items: center; gap: 8px; margin: 4px 0 12px; }
.vhm-search { flex: 1; min-width: 0; position: relative; display: flex; align-items: center; }
.vhm-search svg { position: absolute; left: 14px; opacity: .5; pointer-events: none; }
.vhm-search input {
  width: 100%; height: 44px; box-sizing: border-box;
  padding: 0 14px 0 40px;
  border: 1.5px solid var(--line); border-radius: 100px;
  background: var(--paper); font-family: 'Jost', sans-serif; font-size: 14px; color: var(--ink);
}
.vhm-search input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }

.vhm-filter-btn, .vhm-overflow-btn {
  flex: none; width: 44px; height: 44px;
  display: grid; place-items: center;
  border: 1.5px solid var(--line); border-radius: 50%;
  background: var(--paper); color: var(--plum); cursor: pointer;
}
.vhm-filter-btn.active { background: var(--gold-soft); border-color: var(--gold); }
.vhm-overflow-btn { color: var(--muted); font-size: 20px; line-height: 1; }
.vhm-overflow-wrap { position: relative; flex: none; }
.vhm-overflow-menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 40;
  min-width: 170px;
  background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 12px 28px rgba(36,8,8,.16);
  padding: 6px; display: flex; flex-direction: column; gap: 2px;
}
.vhm-overflow-menu button {
  text-align: left; padding: 11px 12px; border: none; background: none; border-radius: 9px;
  font-family: 'Jost', sans-serif; font-size: 13.5px; color: var(--cacao); cursor: pointer;
}
.vhm-overflow-menu button:active { background: var(--gold-soft); }

.vhm-catrow {
  display: flex; gap: 8px; margin-bottom: 12px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scrollbar-width: none; padding-bottom: 2px;
}
.vhm-catrow::-webkit-scrollbar { display: none; }
.vhm-catpill {
  flex: none;
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 15px;
  font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: var(--muted);
  background: var(--paper); border: 1.5px solid var(--line); border-radius: 100px;
  cursor: pointer;
}
.vhm-catpill.on { background: var(--plum); border-color: var(--plum); color: var(--paper); }
.vhm-catpill-badge {
  font-size: 11px; font-weight: 700; min-width: 18px; text-align: center;
  padding: 1px 6px; border-radius: 100px; background: var(--ivory); color: var(--muted);
}
.vhm-catpill.on .vhm-catpill-badge { background: rgba(255,255,255,.22); color: var(--paper); }

.vhm-fulfilled {
  display: flex; align-items: center; gap: 10px;
  background: var(--teal-soft); border: 1px solid var(--teal); border-radius: 14px;
  padding: 12px 14px; margin-bottom: 12px;
}
.vhm-fulfilled-ico { flex: none; width: 32px; height: 32px; display: grid; place-items: center; font-size: 15px; background: var(--gold-soft); border-radius: 9px; }
.vhm-fulfilled-main { flex: 1; min-width: 0; }
.vhm-fulfilled-lbl { font-size: 11px; color: var(--teal); font-weight: 600; }
.vhm-fulfilled-name { font-size: 13px; font-weight: 600; color: var(--cacao); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vhm-fulfilled-btn {
  flex: none; height: 34px; padding: 0 14px;
  border: 1px solid var(--teal); border-radius: 100px; background: var(--paper); color: var(--teal);
  font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer;
}
.vhm-status-empty { background: var(--gold-soft); border-color: var(--gold); }
.vhm-status-empty .vhm-fulfilled-lbl { color: #7a5c28; }
.vhm-status-empty .vhm-fulfilled-btn { border-color: var(--gold); color: var(--plum); }

/* ═══════════════════════════════════════════════════════════════════
   DESKTOP — tidak diubah dari sebelumnya.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Hero bento ── */
.vh-hero {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) { .vh-hero { grid-template-columns: 1fr; } }

.vh-progress-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 28px 30px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
}
.vh-progress-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.vh-progress-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--cacao); }
.vh-progress-ico { margin-right: 4px; }
.vh-progress-pct { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 700; color: var(--plum); font-variant-numeric: tabular-nums; }

.vh-progressbar { position: relative; height: 14px; background: var(--gold-soft); border-radius: 100px; overflow: hidden; }
.vh-progressbar > span {
  display: block; height: 100%; border-radius: 100px; position: relative;
  background: linear-gradient(90deg, var(--plum), var(--wine));
  transition: width .5s ease;
}
.vh-progressbar > span::after {
  content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 6px;
  background: var(--gold);
}

.vh-progress-sub { margin-top: 12px; font-size: 14px; color: var(--muted); }
.vh-progress-next { margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--line); font-size: 13.5px; }
.vh-progress-next-lbl { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: 4px; }
.vh-progress-next-val { color: var(--cacao); font-weight: 600; }
.vh-progress-next.done { color: var(--plum); font-weight: 600; }

.vh-buckets { position: relative; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.vh-bucket {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px;
  font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 500; color: var(--cacao);
  background: var(--paper); border: 1.5px solid var(--line); border-radius: 100px;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease;
}
.vh-bucket-ico { font-size: 12px; line-height: 1; }
.vh-bucket b { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 700; color: var(--plum); }
.vh-bucket:hover {
  background: var(--rose-soft); border-color: var(--rose);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(36,8,8,.08);
}
.vh-bucket.active {
  background: var(--gold-soft); border-color: var(--gold);
  box-shadow: 0 3px 10px rgba(36,8,8,.08);
}
.vh-bucket:active { transform: translateY(0) scale(.97); }

.vh-side { display: flex; flex-direction: column; gap: 16px; }
.vh-mini-card {
  flex: 1;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.vh-mini-lbl { font-size: 13px; font-weight: 600; color: var(--muted); margin-bottom: 8px; }
.vh-mini-val { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--plum); }
.vh-mini-sub { font-size: 12.5px; color: var(--muted); margin-top: 4px; }

.vh-next-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.vh-next-chip {
  font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500;
  padding: 6px 11px; border-radius: 100px; border: 1px solid var(--line);
  background: var(--ivory); color: var(--cacao); cursor: pointer; transition: .15s;
}
.vh-next-chip:hover { background: var(--rose-soft); border-color: var(--rose); color: var(--wine); }

/* ── Insight kecil ── */
.vh-insights {
  display: flex;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  margin-bottom: 16px;
  overflow: hidden;
}
.vh-insight { flex: 1; display: flex; align-items: center; gap: 12px; padding: 18px 22px; min-width: 0; }
.vh-insight + .vh-insight { border-left: 1px dashed var(--line); }
.vh-ins-ico { font-size: 22px; flex: none; }
.vh-ins-lbl { font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); }
.vh-ins-name { font-size: 14px; font-weight: 600; color: var(--cacao); margin: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vh-ins-val { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: var(--gold); }

/* ── Category pills ── */
.vh-catrow { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.vh-catpill {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500;
  padding: 9px 16px; border-radius: 100px; border: 1.5px solid var(--line);
  background: var(--paper); color: var(--muted); cursor: pointer; transition: .18s;
}
.vh-catpill:hover { background: var(--rose-soft); border-color: var(--rose); color: var(--wine); }
.vh-catpill.on { background: var(--plum); border-color: var(--plum); color: var(--paper); }
.vh-catpill-ico { font-size: 14px; }
.vh-catpill-badge {
  font-size: 11px; font-weight: 700; min-width: 18px; text-align: center;
  padding: 1px 6px; border-radius: 100px; background: var(--ivory); color: var(--muted);
}
.vh-catpill.on .vh-catpill-badge { background: rgba(255,255,255,.22); color: var(--paper); }

/* ── Kategori sudah dipenuhi (Included) ── */
.vh-fulfilled {
  background: var(--teal-soft); border: 1px solid var(--teal); border-radius: 16px;
  padding: 20px 22px; margin-bottom: 14px;
}
.vh-fulfilled-lbl { font-size: 13px; color: var(--cacao); margin-bottom: 12px; }
.vh-fulfilled-vendor { display: flex; align-items: center; gap: 12px; background: var(--paper); border-radius: 12px; padding: 12px 14px; }
.vh-fulfilled-ico { flex: none; width: 34px; height: 34px; display: grid; place-items: center; font-size: 16px; background: var(--gold-soft); border-radius: 10px; }
.vh-fulfilled-main { flex: 1; min-width: 0; }
.vh-fulfilled-cat { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); }
.vh-fulfilled-name { font-weight: 600; font-size: 14px; color: var(--cacao); }
.vh-fulfilled-status { flex: none; font-size: 12px; font-weight: 600; color: var(--teal); }
.vh-fulfilled-actions { display: flex; gap: 8px; margin-top: 14px; }

/* ── Empty state ── */
.vh-empty {
  background: var(--paper); border: 1px dashed var(--line); border-radius: 20px;
  padding: 60px 30px; text-align: center;
}
.vh-empty-ico {
  width: 56px; height: 56px; margin: 0 auto 16px; display: grid; place-items: center;
  font-size: 26px; background: var(--gold-soft); border-radius: 50%;
}
.vh-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--cacao); margin-bottom: 6px; }
.vh-empty-sub { font-size: 13.5px; color: var(--muted); margin-bottom: 20px; max-width: 360px; margin-left: auto; margin-right: auto; }

/* ── Vendor chip list ── */
.vh-chiplist { position: relative; display: flex; flex-direction: column; gap: 10px; }
.vh-fade-enter-active, .vh-fade-leave-active { transition: opacity .22s ease, transform .22s ease; }
.vh-fade-enter-from, .vh-fade-leave-to { opacity: 0; transform: translateY(6px); }
.vh-fade-leave-active { position: absolute; }
.vh-fade-move { transition: transform .22s ease; }
.vh-chip-wrap {
  background: var(--paper); border: 1px solid var(--line); border-radius: 16px;
  box-shadow: 0 1px 2px rgba(36,8,8,.04);
  transition: border-color .15s, box-shadow .15s;
}
.vh-chip-wrap:hover { border-color: var(--gold); box-shadow: 0 2px 10px rgba(36,8,8,.06); }
.vh-chip-wrap.sel { background: rgba(129,1,0,.04); }
.vh-chip-wrap.expanded { border-color: var(--gold); }

.vh-chip { display: flex; align-items: center; gap: 14px; padding: 16px 18px; cursor: pointer; }
.vh-chip-ico {
  flex: none; width: 38px; height: 38px; display: grid; place-items: center;
  font-size: 18px; background: var(--gold-soft); border-radius: 12px;
}
.vh-chip-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.vh-chip-cat { font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); }
.vh-chip-name { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 14.5px; color: var(--cacao); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vh-chip-inc { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-top: 3px; font-size: 11px; color: var(--muted); }
.vh-chip-inc-chip { background: var(--teal-soft); color: var(--teal); border-radius: 100px; padding: 1px 8px; font-weight: 600; }

.vh-chip-price { flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; min-width: 120px; }
.vh-chip-rp { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 700; color: var(--plum); }
.vh-chip-tag { font-size: 11px; color: var(--muted); }

.vh-chip-status { flex: none; display: flex; align-items: center; gap: 8px; }
.vh-chip-statlbl { font-size: 12px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.vh-chip-statlbl.st-dipakai { color: #3B6D11; }
.vh-chip-statlbl.st-dipertimbangkan { color: #7a5c28; }
.vh-chip-statlbl.st-included { color: var(--teal); }
.vh-chip-statlbl.st-batal { color: var(--muted); }

.vh-chip-exp {
  flex: none; display: grid; place-items: center; width: 26px; height: 26px;
  padding: 0; border: none; background: none; color: var(--muted); cursor: pointer;
}
.vh-chip-wrap.expanded .vt-chev { transform: rotate(180deg); }
.vt-chev { transition: transform .2s; }
.vt-cbx { display: inline-flex; flex: none; }

/* ── Body detail (expand ke bawah) — dipertahankan dari layout lama ── */
.vt-body { padding: 0 18px 18px 18px; border-top: 1px dashed var(--line); }
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
