<template>
  <div class="overlay" :class="{ show: show }" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ editId ? 'Edit Vendor' : 'Tambah Vendor' }}</h3>
      <div class="sub">Lengkapi informasi vendor pilihan Anda</div>
      <form @submit.prevent="save">
        <div class="row2">
          <div class="field">
            <label>Kategori</label>
            <div class="select-wrap">
              <select v-model="form.category">
                <option v-for="c in VENDOR_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>Nama Vendor</label>
            <input ref="namaInput" v-model="form.nama" type="text" required>
          </div>
        </div>
        <template v-if="isWO">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Total Harga Paket</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreWO = !showMoreWO">
            {{ showMoreWO ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, layanan, tim, dokumen, dll.)' }}
          </button>

          <template v-if="showMoreWO">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">📋 Informasi Paket</div>
            <div class="field">
              <label>Jenis Layanan</label>
              <div class="select-wrap">
                <select v-model="form.jenisLayananWO">
                  <option value="">— Pilih —</option>
                  <option v-for="j in JENIS_LAYANAN_WO_OPTIONS" :key="j" :value="j">{{ j }}</option>
                </select>
              </div>
            </div>

            <label class="vm-sub-lbl">Layanan yang Didapat</label>
            <RepeatableCard
              :items="form.layananDidapat"
              :fields="layananDidapatFields"
              icon="📋"
              :title="item => item.nama || 'Layanan baru'"
              :subtitle="item => item.keterangan"
              :new-item="() => ({ nama: '', keterangan: '' })"
              add-label="+ Tambah Layanan"
            />

            <div class="row2">
              <div class="field">
                <label>Jumlah Meeting</label>
                <div class="select-wrap">
                  <select v-model="form.jumlahMeeting">
                    <option value="">— Pilih —</option>
                    <option v-for="m in JUMLAH_MEETING_OPTIONS" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Include Survey Venue</label>
                <div class="select-wrap">
                  <select v-model="form.includeSurveyVenue">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
            </div>
            <div v-if="form.includeSurveyVenue" class="field"><label>Jumlah Survey</label><input v-model.number="form.jumlahSurvey" type="number" min="1"></div>

            <div class="field">
              <label>Include Gladi Bersih</label>
              <div class="select-wrap">
                <select v-model="form.includeGladiBersih">
                  <option :value="false">Tidak</option>
                  <option :value="true">Ya</option>
                </select>
              </div>
            </div>

            <label class="vm-sub-lbl">Koordinasi Vendor</label>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="k in KOORDINASI_VENDOR_OPTIONS" :key="k" class="vm-genre-chip" :class="{ on: form.koordinasiVendor.includes(k) }">
                  <input type="checkbox" :value="k" v-model="form.koordinasiVendor" hidden>
                  {{ k }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">👥 Tim Wedding Organizer</div>
            <div class="field">
              <label>Jumlah Crew Hari H</label>
              <div class="select-wrap">
                <select v-model="form.jumlahCrewHariH">
                  <option value="">— Pilih —</option>
                  <option v-for="c in JUMLAH_CREW_OPTIONS" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <label class="vm-sub-lbl">Struktur Tim</label>
            <RepeatableCard
              :items="form.strukturTim"
              :fields="strukturTimFields"
              icon="👥"
              :title="item => item.posisi || 'Posisi baru'"
              :subtitle="item => item.jumlah ? `${item.jumlah} orang` : null"
              :new-item="() => ({ posisi: '', jumlah: 1 })"
              add-label="+ Tambah Posisi"
            />

            <div class="row2">
              <div class="field">
                <label>Total Personel</label>
                <input type="text" :value="totalPersonel + ' orang'" readonly class="vm-readonly">
              </div>
              <div class="field">
                <label>Jumlah Konsumsi Tim</label>
                <input v-model.number="form.jumlahKonsumsiTim" type="number" min="0">
              </div>
            </div>
            <div class="vm-cap-hint" style="margin:-10px 0 14px;">Digunakan sebagai acuan jumlah konsumsi yang perlu disiapkan untuk tim Wedding Organizer pada hari acara.</div>

            <div class="vm-section-lbl">📄 Dokumen</div>
            <label class="vm-sub-lbl">Dokumen yang Didapat</label>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="d in DOKUMEN_WO_OPTIONS" :key="d" class="vm-genre-chip" :class="{ on: form.dokumenDidapat.includes(d) }">
                  <input type="checkbox" :value="d" v-model="form.dokumenDidapat" hidden>
                  {{ d }}
                </label>
              </div>
            </div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isDekorasi">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="row2">
            <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
            <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
          </div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onDekorasiTipeHargaChange">
                <option value="paket">All In</option>
                <option value="pax">Per Pax</option>
                <option value="item">Per Item</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'pax'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Pax</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaPax)" @input="onHargaPax">
              </div>
            </div>
            <div class="field" style="flex:1.5; min-width:0">
              <label>Jumlah Pax</label>
              <div class="select-wrap">
                <select v-model="form.paxPengali" @change="calcPaxTotal(true)">
                  <option value="orang">Tamu dikonfirmasi — {{ store.hadirOrangCount }} orang</option>
                  <option value="undangan">Undangan dikonfirmasi — {{ store.rsvpUndanganCount }}</option>
                  <option value="hampers">Kirim hampers — {{ store.hampersCount }}</option>
                  <option value="manual">Jumlah kustom</option>
                </select>
              </div>
            </div>
            <div v-if="form.paxPengali === 'manual'" class="field" style="flex:0.8; min-width:0">
              <label>Jumlah</label>
              <input v-model.number="form.paxManualVal" type="number" min="1" @input="calcPaxTotal(true)">
            </div>
          </div>

          <div v-if="form.tipeHarga === 'item'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Item</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaItem)" @input="onHargaItem">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Jumlah Item</label>
              <input v-model.number="form.jumlahItem" type="number" min="1" @input="calcItemTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreDekorasi = !showMoreDekorasi">
            {{ showMoreDekorasi ? '− Sembunyikan info tambahan' : '+ Info tambahan (email, website, IG, alamat, deskripsi)' }}
          </button>

          <template v-if="showMoreDekorasi">
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>
            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
          </template>
        </template>

        <template v-else-if="isBand">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onBandTipeHargaChange">
                <option value="paket">All In</option>
                <option value="jam">Per Jam</option>
                <option value="sesi">Per Sesi</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'jam'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Jam</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaJam)" @input="onHargaJam">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Total Jam</label>
              <input v-model.number="form.totalJam" type="number" min="1" @input="calcJamTotal(true)">
            </div>
          </div>

          <div v-if="form.tipeHarga === 'sesi'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Sesi</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaSesi)" @input="onHargaSesi">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Total Sesi</label>
              <input v-model.number="form.totalSesi" type="number" min="1" @input="calcSesiTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreBand = !showMoreBand">
            {{ showMoreBand ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, genre, deskripsi, dll.)' }}
          </button>

          <template v-if="showMoreBand">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="field">
              <label>Genre Musik</label>
              <div class="vm-genre-grid">
                <label v-for="g in GENRE_MUSIK" :key="g" class="vm-genre-chip" :class="{ on: form.genreMusik.includes(g) }">
                  <input type="checkbox" :value="g" v-model="form.genreMusik" hidden>
                  {{ g }}
                </label>
              </div>
            </div>

            <div class="row2">
              <div class="field"><label>Durasi Tampil</label><input v-model="form.durasiTampil" type="text" placeholder="cth: 2 jam"></div>
              <div class="field">
                <label>Bisa Request Lagu</label>
                <div class="select-wrap">
                  <select v-model="form.bisaRequestLagu">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isFotografer">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onFotografiTipeHargaChange">
                <option value="paket">All In</option>
                <option value="jam">Per Jam</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'jam'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Jam</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaJam)" @input="onHargaJam">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Total Jam</label>
              <input v-model.number="form.totalJam" type="number" min="1" @input="calcJamTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreFoto = !showMoreFoto">
            {{ showMoreFoto ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, layanan, deskripsi, dll.)' }}
          </button>

          <template v-if="showMoreFoto">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">Layanan Prewedding</div>
            <div class="row2">
              <div class="field">
                <label>Include Prewedding</label>
                <div class="select-wrap">
                  <select v-model="form.includePrewedding">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
              <div v-if="form.includePrewedding" class="field"><label>Durasi Prewedding</label><input v-model="form.durasiPrewedding" type="text" placeholder="cth: 1 hari"></div>
            </div>

            <div class="vm-section-lbl">Liputan Hari Acara</div>
            <div class="field">
              <label>Durasi Liputan</label>
              <div class="select-wrap">
                <select v-model="form.durasiLiputan">
                  <option value="">— Pilih —</option>
                  <option v-for="d in DURASI_LIPUTAN_OPTIONS" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Liputan Acara</label>
              <div class="vm-genre-grid">
                <label v-for="a in LIPUTAN_ACARA_OPTIONS" :key="a" class="vm-genre-chip" :class="{ on: form.liputanAcara.includes(a) }">
                  <input type="checkbox" :value="a" v-model="form.liputanAcara" hidden>
                  {{ a }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">Tim</div>
            <div class="row2">
              <div class="field"><label>Jumlah Fotografer</label><input v-model.number="form.jumlahFotografer" type="number" min="0"></div>
              <div class="field"><label>Jumlah Videografer</label><input v-model.number="form.jumlahVideografer" type="number" min="0"></div>
            </div>
            <div class="field"><label>Jumlah Wedding Content Creator</label><input v-model.number="form.jumlahContentCreator" type="number" min="0"></div>

            <div class="vm-section-lbl">Hasil yang Didapat</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="h in HASIL_FOTOVIDEO_OPTIONS" :key="h" class="vm-genre-chip" :class="{ on: form.hasilFotoVideo.includes(h) }">
                  <input type="checkbox" :value="h" v-model="form.hasilFotoVideo" hidden>
                  {{ h }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">Estimasi Hasil</div>
            <div class="row2">
              <div class="field"><label>Estimasi Preview</label><input v-model="form.estimasiPreview" type="text" placeholder="cth: 1 minggu"></div>
              <div class="field"><label>Estimasi Foto Jadi</label><input v-model="form.estimasiFotoJadi" type="text" placeholder="cth: 1 bulan"></div>
            </div>
            <div class="field"><label>Estimasi Video Jadi</label><input v-model="form.estimasiVideoJadi" type="text" placeholder="cth: 2 bulan"></div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isMua">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onMuaTipeHargaChange">
                <option value="paket">All In</option>
                <option value="orang">Per Orang</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'orang'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Orang</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaOrang)" @input="onHargaOrang">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Jumlah Orang</label>
              <input v-model.number="form.jumlahOrang" type="number" min="1" @input="calcOrangTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreMua = !showMoreMua">
            {{ showMoreMua ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, layanan, busana, dll.)' }}
          </button>

          <template v-if="showMoreMua">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">Layanan Pengantin</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label class="vm-genre-chip" :class="{ on: form.makeupPengantinWanita }">
                  <input type="checkbox" v-model="form.makeupPengantinWanita" hidden>Makeup Pengantin Wanita
                </label>
                <label class="vm-genre-chip" :class="{ on: form.makeupPengantinPria }">
                  <input type="checkbox" v-model="form.makeupPengantinPria" hidden>Makeup Pengantin Pria
                </label>
                <label class="vm-genre-chip" :class="{ on: form.hairdo }">
                  <input type="checkbox" v-model="form.hairdo" hidden>Hairdo
                </label>
                <label class="vm-genre-chip" :class="{ on: form.hijabdo }">
                  <input type="checkbox" v-model="form.hijabdo" hidden>Hijabdo
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">Busana</div>
            <div class="field">
              <label>Include Busana</label>
              <div class="select-wrap">
                <select v-model="form.includeBusana">
                  <option :value="false">Tidak</option>
                  <option :value="true">Ya</option>
                </select>
              </div>
            </div>
            <div v-if="form.includeBusana" class="vm-repeat-list">
              <div v-for="item in BUSANA_OPTIONS" :key="item" class="vm-repeat-row">
                <label class="vm-repeat-check">
                  <input type="checkbox" :checked="isRepeatChecked('busanaList', item)" @change="toggleRepeat('busanaList', item, $event.target.checked)">
                  {{ item }}
                </label>
                <input v-if="isRepeatChecked('busanaList', item)" type="number" min="1" class="vm-repeat-qty" :value="repeatQty('busanaList', item)" @input="setRepeatQty('busanaList', item, $event.target.value)">
              </div>
            </div>

            <div class="vm-section-lbl">Layanan Tambahan</div>
            <div class="vm-repeat-list">
              <div v-for="item in LAYANAN_TAMBAHAN_OPTIONS" :key="item" class="vm-repeat-row">
                <label class="vm-repeat-check">
                  <input type="checkbox" :checked="isRepeatChecked('layananTambahan', item)" @change="toggleRepeat('layananTambahan', item, $event.target.checked)">
                  {{ item }}
                </label>
                <input v-if="isRepeatChecked('layananTambahan', item)" type="number" min="1" class="vm-repeat-qty" :value="repeatQty('layananTambahan', item)" @input="setRepeatQty('layananTambahan', item, $event.target.value)">
              </div>
            </div>

            <div class="vm-section-lbl">Benefit Paket</div>
            <div class="row2">
              <div class="field">
                <label>Trial Makeup</label>
                <div class="select-wrap">
                  <select v-model="form.trialMakeup">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
              <div v-if="form.trialMakeup" class="field"><label>Jumlah Trial</label><input v-model.number="form.jumlahTrial" type="number" min="1"></div>
            </div>
            <div class="row2">
              <div class="field">
                <label>Touch Up</label>
                <div class="select-wrap">
                  <select v-model="form.touchUp">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
              <div v-if="form.touchUp" class="field"><label>Durasi Pendampingan</label><input v-model="form.durasiPendampingan" type="text" placeholder="cth: 8 Jam"></div>
            </div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isMc">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onMcTipeHargaChange">
                <option value="paket">All In</option>
                <option value="jam">Per Jam</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'jam'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Jam</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaJam)" @input="onHargaJam">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Total Jam</label>
              <input v-model.number="form.totalJam" type="number" min="1" @input="calcJamTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreMc = !showMoreMc">
            {{ showMoreMc ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, layanan, deskripsi, dll.)' }}
          </button>

          <template v-if="showMoreMc">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">Acara yang Dibawakan</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="a in ACARA_MC_OPTIONS" :key="a" class="vm-genre-chip" :class="{ on: form.acaraDibawakan.includes(a) }">
                  <input type="checkbox" :value="a" v-model="form.acaraDibawakan" hidden>
                  {{ a }}
                </label>
              </div>
            </div>

            <div class="field">
              <label>Durasi Membawakan Acara</label>
              <div class="select-wrap">
                <select v-model="form.durasiMembawakan">
                  <option value="">— Pilih —</option>
                  <option v-for="d in DURASI_MC_OPTIONS" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
            </div>

            <div class="vm-section-lbl">Bahasa</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="b in BAHASA_MC_OPTIONS" :key="b" class="vm-genre-chip" :class="{ on: form.bahasaMc.includes(b) }">
                  <input type="checkbox" :value="b" v-model="form.bahasaMc" hidden>
                  {{ b }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">Adat</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="a in ADAT_MC_OPTIONS" :key="a" class="vm-genre-chip" :class="{ on: form.adatMc.includes(a) }">
                  <input type="checkbox" :value="a" v-model="form.adatMc" hidden>
                  {{ a }}
                </label>
              </div>
            </div>

            <div class="field">
              <label>Gaya Membawakan Acara</label>
              <div class="select-wrap">
                <select v-model="form.gayaMc">
                  <option value="">— Pilih —</option>
                  <option v-for="g in GAYA_MC_OPTIONS" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isSouvenir">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Paket Premium">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onSouvenirTipeHargaChange">
                <option value="paket">All In</option>
                <option value="item">Per Item</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'item'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Item</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaItem)" @input="onHargaItem">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Jumlah Item</label>
              <input v-model.number="form.jumlahItem" type="number" min="1" @input="calcItemTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreSouvenir = !showMoreSouvenir">
            {{ showMoreSouvenir ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, isi paket, packaging, dll.)' }}
          </button>

          <template v-if="showMoreSouvenir">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">Jenis Souvenir</div>
            <div class="field">
              <label>Nama Souvenir</label>
              <div class="select-wrap">
                <select v-model="form.namaSouvenir">
                  <option value="">— Pilih —</option>
                  <option v-for="n in NAMA_SOUVENIR_OPTIONS" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>

            <div class="vm-section-lbl">Isi Paket Souvenir</div>
            <RepeatableCard
              :items="form.isiPaketSouvenir"
              :fields="isiPaketSouvenirFields"
              icon="🎁"
              :title="item => item.nama || 'Item baru'"
              :subtitle="item => item.jumlah > 1 ? `×${item.jumlah}` : null"
              :new-item="() => ({ nama: '', jumlah: 1 })"
              add-label="+ Tambah Item"
            />

            <div class="vm-section-lbl">Packaging</div>
            <div class="row2">
              <div class="field">
                <label>Include Packaging</label>
                <div class="select-wrap">
                  <select v-model="form.includePackaging">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
              <div v-if="form.includePackaging" class="field">
                <label>Jenis Packaging</label>
                <div class="select-wrap">
                  <select v-model="form.jenisPackaging">
                    <option value="">— Pilih —</option>
                    <option v-for="p in PACKAGING_OPTIONS" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="vm-section-lbl">Customisasi</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="c in CUSTOMISASI_OPTIONS" :key="c" class="vm-genre-chip" :class="{ on: form.customisasi.includes(c) }">
                  <input type="checkbox" :value="c" v-model="form.customisasi" hidden>
                  {{ c }}
                </label>
              </div>
            </div>

            <div class="row2">
              <div class="field"><label>Jumlah Souvenir</label><input v-model="form.jumlahSouvenir" type="text" placeholder="cth: 500 pcs"></div>
              <div class="field"><label>Minimal Order</label><input v-model="form.minimalOrder" type="text" placeholder="cth: 50 pcs"></div>
            </div>

            <div class="row2">
              <div class="field">
                <label>Estimasi Produksi</label>
                <div class="select-wrap">
                  <select v-model="form.estimasiProduksi">
                    <option value="">— Pilih —</option>
                    <option v-for="e in ESTIMASI_PRODUKSI_OPTIONS" :key="e" :value="e">{{ e }}</option>
                  </select>
                </div>
              </div>
              <div class="field"><label>Estimasi Pengiriman</label><input v-model="form.estimasiPengiriman" type="text" placeholder="cth: 3 hari (opsional)"></div>
            </div>

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isVenue">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Ballroom Gold">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga">
                <option value="paket">All In</option>
                <option value="sewa">Sewa Venue</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Total Harga</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreVenue = !showMoreVenue">
            {{ showMoreVenue ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, fasilitas, kebijakan, dll.)' }}
          </button>

          <template v-if="showMoreVenue">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">🏛 Informasi Venue</div>
            <div class="field">
              <label>Jenis Venue</label>
              <div class="select-wrap">
                <select v-model="form.jenisVenue">
                  <option value="">— Pilih —</option>
                  <option v-for="j in JENIS_VENUE_OPTIONS" :key="j" :value="j">{{ j }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Konsep Venue</label>
              <div class="vm-genre-grid">
                <label v-for="k in KONSEP_VENUE_OPTIONS" :key="k" class="vm-genre-chip" :class="{ on: form.konsepVenue.includes(k) }">
                  <input type="checkbox" :value="k" v-model="form.konsepVenue" hidden>
                  {{ k }}
                </label>
              </div>
            </div>

            <div class="row2">
              <div class="field"><label>Kapasitas Minimum</label><input v-model.number="form.kapasitasMin" type="number" min="0" placeholder="cth: 300"></div>
              <div class="field"><label>Kapasitas Maksimum</label><input v-model.number="form.kapasitasMaks" type="number" min="0" placeholder="cth: 500"></div>
            </div>
            <div v-if="form.kapasitasMaks > 0" class="vm-cap-hint" :class="{ over: store.totalGuestPax > form.kapasitasMaks }">
              Tamu terkonfirmasi sekarang: {{ store.totalGuestPax }} orang ·
              <template v-if="store.totalGuestPax > form.kapasitasMaks">lebih {{ store.totalGuestPax - form.kapasitasMaks }} dari kapasitas maksimum</template>
              <template v-else>sisa {{ form.kapasitasMaks - store.totalGuestPax }} kursi</template>
            </div>

            <div class="row2">
              <div class="field"><label>Jam Mulai</label><input v-model="form.jamMulai" type="time"></div>
              <div class="field"><label>Jam Selesai</label><input v-model="form.jamSelesai" type="time"></div>
            </div>

            <label class="vm-sub-lbl">Area Acara</label>
            <RepeatableCard
              :items="form.areaAcara"
              :fields="areaAcaraFields"
              icon="🏛"
              :title="item => item.nama || 'Area baru'"
              :subtitle="item => item.kapasitas ? `${item.kapasitas} orang` : null"
              :new-item="() => ({ nama: '', kapasitas: 0 })"
              add-label="+ Tambah Area"
            />

            <div class="vm-section-lbl">🏢 Fasilitas</div>
            <div class="vm-repeat-list">
              <div v-for="f in FASILITAS_VENUE_OPTIONS" :key="f.nama" class="vm-repeat-row">
                <label class="vm-repeat-check">
                  <input type="checkbox" :checked="isFasilitasChecked(f.nama)" @change="toggleFasilitas(f.nama, $event.target.checked)">
                  {{ f.nama }}
                </label>
                <input v-if="f.qtyLabel && isFasilitasChecked(f.nama)" type="number" min="1" class="vm-repeat-qty" :placeholder="f.qtyLabel" :value="fasilitasQty(f.nama)" @input="setFasilitasQty(f.nama, $event.target.value)">
              </div>
            </div>

            <div class="vm-section-lbl">📜 Kebijakan Venue</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="k in KEBIJAKAN_VENUE_OPTIONS" :key="k" class="vm-genre-chip" :class="{ on: form.kebijakanVenue.includes(k) }">
                  <input type="checkbox" :value="k" v-model="form.kebijakanVenue" hidden>
                  {{ k }}
                </label>
              </div>
              <div class="vm-cap-hint">Kalau tidak dicentang, berarti pakai vendor rekanan venue (lihat daftar di bawah).</div>
            </div>

            <label class="vm-sub-lbl">Vendor Rekanan</label>
            <RepeatableCard
              :items="form.vendorRekanan"
              :fields="vendorRekananFields"
              icon="🤝"
              :title="item => item.nama || 'Vendor rekanan baru'"
              :subtitle="item => item.kategori"
              :new-item="() => ({ kategori: '', nama: '' })"
              add-label="+ Tambah Vendor Rekanan"
            />

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-else-if="isCatering">
          <div class="row2">
            <div class="field">
              <label>Nama Paket</label>
              <input v-model="form.namaPaket" type="text" placeholder="cth: Gold Package">
            </div>
            <div class="field">
              <label>Status</label>
              <div class="select-wrap">
                <select v-model="form.status">
                  <option v-for="k in VENDOR_STATUS_ORDER" :key="k" :value="k">{{ VENDOR_STATUS[k].label }}</option>
                </select>
              </div>
            </div>
          </div>
          <div v-if="form.status === 'dipakai'" class="vm-cap-hint" style="margin:-10px 0 14px;">Vendor "Dipakai" otomatis masuk ke anggaran (tab Budget).</div>

          <div class="field">
            <label>Tipe Harga</label>
            <div class="select-wrap">
              <select v-model="form.tipeHarga" @change="onCateringTipeHargaChange">
                <option value="paket">All In</option>
                <option value="pax">Per Pax</option>
                <option value="box">Per Box</option>
                <option value="stall">Per Stall</option>
              </select>
            </div>
          </div>

          <div v-if="form.tipeHarga === 'pax'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Pax</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaPax)" @input="onHargaPax">
              </div>
            </div>
            <div class="field" style="flex:1.5; min-width:0">
              <label>Dikali</label>
              <div class="select-wrap">
                <select v-model="form.paxPengali" @change="calcPaxTotal(true)">
                  <option value="orang">Tamu dikonfirmasi — {{ store.hadirOrangCount }} orang</option>
                  <option value="undangan">Undangan dikonfirmasi — {{ store.rsvpUndanganCount }}</option>
                  <option value="hampers">Kirim hampers — {{ store.hampersCount }}</option>
                  <option value="manual">Jumlah kustom</option>
                </select>
              </div>
            </div>
            <div v-if="form.paxPengali === 'manual'" class="field" style="flex:0.8; min-width:0">
              <label>Jumlah</label>
              <input v-model.number="form.paxManualVal" type="number" min="1" @input="calcPaxTotal(true)">
            </div>
          </div>

          <div v-if="form.tipeHarga === 'box'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Box</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaBox)" @input="onHargaBox">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Jumlah Box</label>
              <input v-model.number="form.jumlahBox" type="number" min="1" @input="calcBoxTotal(true)">
            </div>
          </div>

          <div v-if="form.tipeHarga === 'stall'" class="pax-fields" style="display:flex; padding:12px; background:#f9f6f8; border-radius:8px; border:1px dashed #d1c7ce; margin-bottom:12px; align-items:start; gap:12px;">
            <div class="field" style="flex:1.2; min-width:0">
              <label>Harga Per Stall</label>
              <div class="cur-wrap"><span class="cur-rp">Rp</span>
                <input class="cur" type="text" inputmode="numeric" :value="grp(form.hargaStall)" @input="onHargaStall">
              </div>
            </div>
            <div class="field" style="flex:1; min-width:0">
              <label>Jumlah Stall</label>
              <input v-model.number="form.jumlahStall" type="number" min="1" @input="calcStallTotal(true)">
            </div>
          </div>

          <div class="field">
            <label>{{ form.tipeHarga === 'paket' ? 'Total Harga' : 'Total Harga (Bisa diedit)' }}</label>
            <div class="cur-wrap"><span class="cur-rp">Rp</span>
              <input class="cur" type="text" inputmode="numeric" :value="grp(form.harga)" @input="onHarga" required>
            </div>
            <div v-if="form.tipeHarga !== 'paket'" style="display:block; color:var(--muted); font-size:11.5px; margin-top:6px;">
              💡 Hasil perkalian otomatis. Anda dapat mengedit nilainya jika ingin digenapkan.
            </div>
          </div>

          <button type="button" class="vm-more-btn" @click="showMoreCatering = !showMoreCatering">
            {{ showMoreCatering ? '− Sembunyikan info tambahan' : '+ Info tambahan (kontak, menu, kebijakan, dll.)' }}
          </button>

          <template v-if="showMoreCatering">
            <div class="row2">
              <div class="field"><label>Nama PIC</label><input v-model="form.pic" type="text" placeholder="Contact person"></div>
              <div class="field"><label>WhatsApp</label><input v-model="form.hp" type="text"></div>
            </div>
            <div class="row2">
              <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
              <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
            </div>
            <div class="field"><label>Instagram</label><input v-model="form.instagram" type="text" placeholder="@namaakun atau https://instagram.com/..."></div>
            <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>

            <div class="vm-section-lbl">🍽 Jenis Paket</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="j in JENIS_PAKET_CATERING_OPTIONS" :key="j" class="vm-genre-chip" :class="{ on: form.jenisPaketCatering.includes(j) }">
                  <input type="checkbox" :value="j" v-model="form.jenisPaketCatering" hidden>
                  {{ j }}
                </label>
              </div>
            </div>

            <template v-if="form.tipeHarga !== 'box'">
              <div class="vm-section-lbl">🥘 Buffet / Prasmanan</div>
              <label class="vm-sub-lbl">Appetizer</label>
              <div class="vm-strlist">
                <span v-for="(item, idx) in form.buffetAppetizer" :key="idx" class="vm-strlist-chip">{{ item }}<button type="button" @click="removeStringItem('buffetAppetizer', idx)" aria-label="Hapus">✕</button></span>
              </div>
              <div class="vm-strlist-add">
                <input type="text" v-model="newMenuItem.buffetAppetizer" placeholder="cth: Salad" @keydown.enter.prevent="addStringItem('buffetAppetizer')">
                <button type="button" @click="addStringItem('buffetAppetizer')">+ Tambah</button>
              </div>

              <label class="vm-sub-lbl">Main Course</label>
              <div class="vm-strlist">
                <span v-for="(item, idx) in form.buffetMainCourse" :key="idx" class="vm-strlist-chip">{{ item }}<button type="button" @click="removeStringItem('buffetMainCourse', idx)" aria-label="Hapus">✕</button></span>
              </div>
              <div class="vm-strlist-add">
                <input type="text" v-model="newMenuItem.buffetMainCourse" placeholder="cth: Ayam Bakar" @keydown.enter.prevent="addStringItem('buffetMainCourse')">
                <button type="button" @click="addStringItem('buffetMainCourse')">+ Tambah</button>
              </div>

              <label class="vm-sub-lbl">Dessert</label>
              <div class="vm-strlist">
                <span v-for="(item, idx) in form.buffetDessert" :key="idx" class="vm-strlist-chip">{{ item }}<button type="button" @click="removeStringItem('buffetDessert', idx)" aria-label="Hapus">✕</button></span>
              </div>
              <div class="vm-strlist-add">
                <input type="text" v-model="newMenuItem.buffetDessert" placeholder="cth: Puding" @keydown.enter.prevent="addStringItem('buffetDessert')">
                <button type="button" @click="addStringItem('buffetDessert')">+ Tambah</button>
              </div>

              <label class="vm-sub-lbl">Beverage</label>
              <div class="vm-strlist">
                <span v-for="(item, idx) in form.buffetBeverage" :key="idx" class="vm-strlist-chip">{{ item }}<button type="button" @click="removeStringItem('buffetBeverage', idx)" aria-label="Hapus">✕</button></span>
              </div>
              <div class="vm-strlist-add">
                <input type="text" v-model="newMenuItem.buffetBeverage" placeholder="cth: Es Teh" @keydown.enter.prevent="addStringItem('buffetBeverage')">
                <button type="button" @click="addStringItem('buffetBeverage')">+ Tambah</button>
              </div>
            </template>

            <template v-if="form.jenisPaketCatering.includes('Food Stall')">
              <div class="vm-section-lbl">🍜 Food Stall</div>
              <RepeatableCard
                :items="form.foodStall"
                :fields="foodStallFields"
                icon="🍜"
                :title="item => item.nama || 'Stall baru'"
                :subtitle="item => [item.jumlah > 1 ? `×${item.jumlah}` : null, item.keterangan].filter(Boolean)"
                :new-item="() => ({ nama: '', jumlah: 1, keterangan: '' })"
                add-label="+ Tambah Stall"
              />
            </template>

            <div class="vm-section-lbl">🔥 Live Cooking</div>
            <div class="field">
              <label>Include Live Cooking</label>
              <div class="select-wrap">
                <select v-model="form.includeLiveCooking">
                  <option :value="false">Tidak</option>
                  <option :value="true">Ya</option>
                </select>
              </div>
            </div>
            <template v-if="form.includeLiveCooking">
              <div class="vm-strlist">
                <span v-for="(item, idx) in form.liveCookingList" :key="idx" class="vm-strlist-chip">{{ item }}<button type="button" @click="removeStringItem('liveCookingList', idx)" aria-label="Hapus">✕</button></span>
              </div>
              <div class="vm-strlist-add">
                <input type="text" v-model="newMenuItem.liveCookingList" placeholder="cth: Sate" @keydown.enter.prevent="addStringItem('liveCookingList')">
                <button type="button" @click="addStringItem('liveCookingList')">+ Tambah</button>
              </div>
            </template>

            <div class="vm-section-lbl">✅ Include</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="i in INCLUDE_CATERING_OPTIONS" :key="i" class="vm-genre-chip" :class="{ on: form.includeCatering.includes(i) }">
                  <input type="checkbox" :value="i" v-model="form.includeCatering" hidden>
                  {{ i }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">👨‍🍳 Pelayanan</div>
            <div class="row2">
              <div class="field">
                <label>Durasi Pelayanan</label>
                <div class="select-wrap">
                  <select v-model="form.durasiPelayanan">
                    <option value="">— Pilih —</option>
                    <option v-for="d in DURASI_PELAYANAN_CATERING_OPTIONS" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Sistem Refill</label>
                <div class="select-wrap">
                  <select v-model="form.sistemRefill">
                    <option value="">— Pilih —</option>
                    <option v-for="r in SISTEM_REFILL_OPTIONS" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="row2">
              <div class="field"><label>Jumlah Waiter</label><input v-model.number="form.jumlahWaiter" type="number" min="0"></div>
              <div class="field"><label>Jumlah Chef</label><input v-model.number="form.jumlahChef" type="number" min="0"></div>
            </div>

            <div class="vm-section-lbl">🧪 Food Tasting</div>
            <div class="row2">
              <div class="field">
                <label>Food Tasting</label>
                <div class="select-wrap">
                  <select v-model="form.includeFoodTasting">
                    <option :value="false">Tidak</option>
                    <option :value="true">Ya</option>
                  </select>
                </div>
              </div>
              <div v-if="form.includeFoodTasting" class="field"><label>Jumlah Sesi</label><input v-model.number="form.jumlahSesiFoodTasting" type="number" min="1"></div>
            </div>

            <div class="vm-section-lbl">📋 Kebijakan</div>
            <div class="field">
              <div class="vm-genre-grid">
                <label v-for="k in KEBIJAKAN_CATERING_OPTIONS" :key="k" class="vm-genre-chip" :class="{ on: form.kebijakanCatering.includes(k) }">
                  <input type="checkbox" :value="k" v-model="form.kebijakanCatering" hidden>
                  {{ k }}
                </label>
              </div>
            </div>

            <div class="vm-section-lbl">💵 Biaya Tambahan</div>
            <RepeatableCard
              :items="form.biayaTambahan"
              :fields="biayaTambahanFields"
              icon="💵"
              :title="item => item.nama || 'Biaya baru'"
              :subtitle="item => [item.nominal ? `Rp ${grp(item.nominal)}` : null, item.keterangan].filter(Boolean)"
              :new-item="() => ({ nama: '', nominal: 0, keterangan: '' })"
              add-label="+ Tambah Biaya"
            />

            <div class="field"><label>Deskripsi</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
            <div class="field"><label>Catatan</label><textarea v-model="form.catatan" rows="2"></textarea></div>
          </template>
        </template>

        <template v-if="!isWO && !isVenue && !isCatering && !isDekorasi && !isBand && !isFotografer && !isMua && !isMc && !isSouvenir">
          <div class="row2">
            <div class="field"><label>Email</label><input v-model="form.email" type="email" placeholder="opsional"></div>
            <div class="field"><label>Website</label><input v-model="form.website" type="text" placeholder="https://..."></div>
          </div>
          <div class="field"><label>Alamat</label><textarea v-model="form.alamat" rows="2"></textarea></div>
          <div class="field"><label>Deskripsi (Isi Paket dsb.)</label><textarea ref="deskEl" class="autosize" v-model="form.deskripsi" rows="3" @input="autoGrowDesk"></textarea></div>
        </template>

        <!-- Included Vendor — berlaku buat semua kategori, bukan cuma satu.
             Vendor lain yang udah termasuk dalam paket vendor ini (mis. Venue
             yang paketnya udah include Catering & WO), biar kategori itu
             otomatis dianggap terpenuhi tanpa nambah budget dobel. -->
        <div class="vm-section-lbl">🔗 Included Vendor</div>
        <div class="vm-inc-hint">Vendor lain yang paketnya sudah termasuk dalam paket vendor ini (mis. Venue yang sudah include Catering & WO). Kategori yang di-include otomatis dianggap terpenuhi, tanpa menambah total budget.</div>
        <RepeatableCard
          :items="form.includedVendors"
          :fields="includedVendorFields"
          :icon="includedVendorIcon"
          :title="includedVendorTitle"
          :subtitle="includedVendorSubtitle"
          :new-item="() => ({ category: '', vendorId: null, catatan: '' })"
          add-label="+ Tambah Included Vendor"
        />

        <div class="modal-actions" style="margin-top:20px">
          <button type="button" class="btn btn-ghost" @click="$emit('close')">Batal</button>
          <button type="submit" class="btn primary">Simpan</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useWeddingStore } from '../../stores/wedding'
import { VENDOR_CATEGORIES, VENDOR_STATUS, VENDOR_STATUS_ORDER, GENRE_MUSIK, DURASI_LIPUTAN_OPTIONS, LIPUTAN_ACARA_OPTIONS, HASIL_FOTOVIDEO_OPTIONS, BUSANA_OPTIONS, LAYANAN_TAMBAHAN_OPTIONS, ACARA_MC_OPTIONS, DURASI_MC_OPTIONS, BAHASA_MC_OPTIONS, ADAT_MC_OPTIONS, GAYA_MC_OPTIONS, NAMA_SOUVENIR_OPTIONS, PACKAGING_OPTIONS, CUSTOMISASI_OPTIONS, ESTIMASI_PRODUKSI_OPTIONS, JENIS_LAYANAN_WO_OPTIONS, JUMLAH_MEETING_OPTIONS, JUMLAH_CREW_OPTIONS, KOORDINASI_VENDOR_OPTIONS, DOKUMEN_WO_OPTIONS, JENIS_VENUE_OPTIONS, KONSEP_VENUE_OPTIONS, FASILITAS_VENUE_OPTIONS, KEBIJAKAN_VENUE_OPTIONS, JENIS_PAKET_CATERING_OPTIONS, INCLUDE_CATERING_OPTIONS, DURASI_PELAYANAN_CATERING_OPTIONS, SISTEM_REFILL_OPTIONS, KEBIJAKAN_CATERING_OPTIONS, INCLUDED_VENDOR_CATEGORY_OPTIONS } from '../../data/constants'
import { grp, num } from '../../utils/index'
import RepeatableCard from '../RepeatableCard.vue'

// Icon kategori kecil buat ringkasan card Included Vendor — dupe kecil dari
// yang dipakai VendorTab.vue, sengaja nggak diimpor lintas file biar
// VendorModal tetap berdiri sendiri (sama kayak TIPE_HARGA_TAGS di tab lain).
const CAT_ICONS = { wo: '📋', venue: '🏛', catering: '🍽', dekorasi: '🌸', musik: '🎶', fotografer: '📸', mua: '💄', mc: '🎤', souvenir: '🎁', lainnya: '🔗' }

const props = defineProps({ show: Boolean, editId: { type: Number, default: null }, defaultCategory: { type: String, default: 'wo' } })
const emit  = defineEmits(['close'])
const store = useWeddingStore()
const namaInput = ref(null)
const deskEl    = ref(null)
const showMoreDekorasi = ref(false)
const showMoreBand = ref(false)
const showMoreFoto = ref(false)
const showMoreMua = ref(false)
const showMoreMc = ref(false)
const showMoreSouvenir = ref(false)
const showMoreWO = ref(false)
const showMoreVenue = ref(false)
const showMoreCatering = ref(false)
const newMenuItem = ref({ buffetAppetizer: '', buffetMainCourse: '', buffetDessert: '', buffetBeverage: '', liveCookingList: '' })

// Deskripsi otomatis melar ngikutin isi, biar teks paket/isi vendor yang
// panjang nggak kepotong di kotak kecil kayak sebelumnya.
function autoGrowDesk() {
  const el = deskEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// WO: harga cuma All In (nggak ada Tipe Harga lain), tapi punya paket
// info paling detail — Layanan yang Didapat & Struktur Tim keduanya
// repeatable list, plus Total Personel/Jumlah Konsumsi yang auto-hitung
// dari Struktur Tim (lihat totalPersonel computed + watcher-nya).
const isWO = computed(() => form.value.category === 'wo')
const isCatering = computed(() => form.value.category === 'catering')
// Dekorasi: 1 record = 1 vendor + 1 paket (nama paket jadi field sendiri,
// bukan child entity terpisah) — form & tampilan diisolasi dari kategori lain.
const isDekorasi = computed(() => form.value.category === 'dekorasi')
// Band/Musik: sama prinsipnya kayak Dekorasi (1 record = 1 vendor + 1
// paket), tapi field kontak & info tambahan lebih ditekuk lagi ke balik
// toggle karena target-nya calon pengantin, bukan WO.
const isBand = computed(() => form.value.category === 'musik')
// Fotografer & Wedding Content Creator: gabungan foto+video+content
// creator dalam 1 kategori (bekas Fotografer & Videografer terpisah).
const isFotografer = computed(() => form.value.category === 'fotografer')
// MUA: sama prinsipnya kayak Dekorasi/Band/Fotografer — form ringkas +
// expandable, plus 2 repeatable list (busana & layanan tambahan) yang
// masing-masing itemnya nyimpen jumlah, bukan field terpisah satu-satu.
const isMua = computed(() => form.value.category === 'mua')
// MC: sama prinsipnya kayak kategori lain — Tipe Harga cuma All In / Per
// Jam (numpang hargaJam/totalJam yang sama kayak Band & Fotografer).
const isMc = computed(() => form.value.category === 'mc')
// Souvenir: sama prinsipnya kayak kategori lain, plus 1 repeatable list
// bebas-teks (Isi Paket Souvenir) — beda dari checklist MUA yang opsinya
// tetap, di sini user nambah/hapus baris sendiri (nama souvenir bervariasi).
const isSouvenir = computed(() => form.value.category === 'souvenir')
// Venue: kapasitas lama (single number) diganti Min-Maks yang lebih
// fleksibel — kapasitasMaks yang dipakai fitur warning kapasitas-vs-tamu
// di Home/Tamu (lihat store.venueCapacity), bukan kapasitas lagi.
const isVenue = computed(() => form.value.category === 'venue')

const blankForm = () => ({ category: props.defaultCategory, nama: '', namaPaket: '', pic: '', alamat: '', hp: '', email: '', website: '', instagram: '', harga: 0, deskripsi: '', tipeHarga: 'paket', hargaPax: 0, paxPengali: 'orang', paxManualVal: 1, hargaItem: 0, jumlahItem: 1, kapasitas: 0, status: 'batal', genreMusik: [], durasiTampil: '', bisaRequestLagu: false, hargaJam: 0, totalJam: 1, hargaSesi: 0, totalSesi: 1, catatan: '', includePrewedding: false, durasiPrewedding: '', durasiLiputan: '', liputanAcara: [], jumlahFotografer: 0, jumlahVideografer: 0, jumlahContentCreator: 0, hasilFotoVideo: [], estimasiPreview: '', estimasiFotoJadi: '', estimasiVideoJadi: '', makeupPengantinWanita: false, makeupPengantinPria: false, hairdo: false, hijabdo: false, includeBusana: false, busanaList: [], layananTambahan: [], trialMakeup: false, jumlahTrial: 1, touchUp: false, durasiPendampingan: '', hargaOrang: 0, jumlahOrang: 1, acaraDibawakan: [], durasiMembawakan: '', bahasaMc: [], adatMc: [], gayaMc: '', namaSouvenir: '', isiPaketSouvenir: [], includePackaging: false, jenisPackaging: '', customisasi: [], jumlahSouvenir: '', minimalOrder: '', estimasiProduksi: '', estimasiPengiriman: '', jenisLayananWO: '', layananDidapat: [], jumlahMeeting: '', includeSurveyVenue: false, jumlahSurvey: 1, includeGladiBersih: false, koordinasiVendor: [], jumlahCrewHariH: '', strukturTim: [], jumlahKonsumsiTim: 0, dokumenDidapat: [], jenisVenue: '', konsepVenue: [], kapasitasMin: 0, kapasitasMaks: 0, jamMulai: '', jamSelesai: '', areaAcara: [], fasilitasVenue: [], kebijakanVenue: [], vendorRekanan: [], jenisPaketCatering: [], hargaBox: 0, jumlahBox: 1, hargaStall: 0, jumlahStall: 1, buffetAppetizer: [], buffetMainCourse: [], buffetDessert: [], buffetBeverage: [], foodStall: [], includeLiveCooking: false, liveCookingList: [], includeCatering: [], durasiPelayanan: '', jumlahWaiter: 0, jumlahChef: 0, sistemRefill: '', includeFoodTasting: false, jumlahSesiFoodTasting: 1, kebijakanCatering: [], biayaTambahan: [], includedVendors: [] })
const form = ref(blankForm())

watch(() => props.show, open => {
  if (!open) return
  if (props.editId) {
    const v = store.vendors.find(x => x.id === props.editId)
    if (v) {
      form.value = { category: v.category, nama: v.nama, namaPaket: v.namaPaket || '', pic: v.pic || '', alamat: v.alamat || '', hp: v.hp || '', email: v.email || '', website: v.website || '', instagram: v.instagram || '', harga: v.harga || 0, deskripsi: v.deskripsi || '', tipeHarga: v.tipeHarga || 'paket', hargaPax: v.hargaPax || 0, paxPengali: v.paxPengali || 'orang', paxManualVal: v.paxManualVal || 1, hargaItem: v.hargaItem || 0, jumlahItem: v.jumlahItem || 1, kapasitas: v.kapasitas || 0, status: v.jadi ? 'dipakai' : 'batal', genreMusik: v.genreMusik || [], durasiTampil: v.durasiTampil || '', bisaRequestLagu: !!v.bisaRequestLagu, hargaJam: v.hargaJam || 0, totalJam: v.totalJam || 1, hargaSesi: v.hargaSesi || 0, totalSesi: v.totalSesi || 1, catatan: v.catatan || '', includePrewedding: !!v.includePrewedding, durasiPrewedding: v.durasiPrewedding || '', durasiLiputan: v.durasiLiputan || '', liputanAcara: v.liputanAcara || [], jumlahFotografer: v.jumlahFotografer || 0, jumlahVideografer: v.jumlahVideografer || 0, jumlahContentCreator: v.jumlahContentCreator || 0, hasilFotoVideo: v.hasilFotoVideo || [], estimasiPreview: v.estimasiPreview || '', estimasiFotoJadi: v.estimasiFotoJadi || '', estimasiVideoJadi: v.estimasiVideoJadi || '', makeupPengantinWanita: !!v.makeupPengantinWanita, makeupPengantinPria: !!v.makeupPengantinPria, hairdo: !!v.hairdo, hijabdo: !!v.hijabdo, includeBusana: !!v.includeBusana, busanaList: v.busanaList || [], layananTambahan: v.layananTambahan || [], trialMakeup: !!v.trialMakeup, jumlahTrial: v.jumlahTrial || 1, touchUp: !!v.touchUp, durasiPendampingan: v.durasiPendampingan || '', hargaOrang: v.hargaOrang || 0, jumlahOrang: v.jumlahOrang || 1, acaraDibawakan: v.acaraDibawakan || [], durasiMembawakan: v.durasiMembawakan || '', bahasaMc: v.bahasaMc || [], adatMc: v.adatMc || [], gayaMc: v.gayaMc || '', namaSouvenir: v.namaSouvenir || '', isiPaketSouvenir: (v.isiPaketSouvenir || []).map(x => ({ ...x })), includePackaging: !!v.includePackaging, jenisPackaging: v.jenisPackaging || '', customisasi: v.customisasi || [], jumlahSouvenir: v.jumlahSouvenir || '', minimalOrder: v.minimalOrder || '', estimasiProduksi: v.estimasiProduksi || '', estimasiPengiriman: v.estimasiPengiriman || '', jenisLayananWO: v.jenisLayananWO || '', layananDidapat: (v.layananDidapat || []).map(x => ({ ...x })), jumlahMeeting: v.jumlahMeeting || '', includeSurveyVenue: !!v.includeSurveyVenue, jumlahSurvey: v.jumlahSurvey || 1, includeGladiBersih: !!v.includeGladiBersih, koordinasiVendor: v.koordinasiVendor || [], jumlahCrewHariH: v.jumlahCrewHariH || '', strukturTim: (v.strukturTim || []).map(x => ({ ...x })), jumlahKonsumsiTim: v.jumlahKonsumsiTim || 0, dokumenDidapat: v.dokumenDidapat || [], jenisVenue: v.jenisVenue || '', konsepVenue: v.konsepVenue || [], kapasitasMin: v.kapasitasMin || 0, kapasitasMaks: v.kapasitasMaks || 0, jamMulai: v.jamMulai || '', jamSelesai: v.jamSelesai || '', areaAcara: (v.areaAcara || []).map(x => ({ ...x })), fasilitasVenue: (v.fasilitasVenue || []).map(x => ({ ...x })), kebijakanVenue: v.kebijakanVenue || [], vendorRekanan: (v.vendorRekanan || []).map(x => ({ ...x })), jenisPaketCatering: v.jenisPaketCatering || [], hargaBox: v.hargaBox || 0, jumlahBox: v.jumlahBox || 1, hargaStall: v.hargaStall || 0, jumlahStall: v.jumlahStall || 1, buffetAppetizer: v.buffetAppetizer || [], buffetMainCourse: v.buffetMainCourse || [], buffetDessert: v.buffetDessert || [], buffetBeverage: v.buffetBeverage || [], foodStall: (v.foodStall || []).map(x => ({ ...x })), includeLiveCooking: !!v.includeLiveCooking, liveCookingList: v.liveCookingList || [], includeCatering: v.includeCatering || [], durasiPelayanan: v.durasiPelayanan || '', jumlahWaiter: v.jumlahWaiter || 0, jumlahChef: v.jumlahChef || 0, sistemRefill: v.sistemRefill || '', includeFoodTasting: !!v.includeFoodTasting, jumlahSesiFoodTasting: v.jumlahSesiFoodTasting || 1, kebijakanCatering: v.kebijakanCatering || [], biayaTambahan: (v.biayaTambahan || []).map(x => ({ ...x })), includedVendors: (v.includedVendors || []).map(x => ({ ...x })) }
      // Dekorasi/Band/Fotografer/MUA/MC/Souvenir/WO/Venue/Catering: jangan sembunyiin data yang udah keisi di balik toggle.
      if (v.category === 'dekorasi') showMoreDekorasi.value = !!(v.email || v.website || v.instagram || v.alamat || v.deskripsi)
      if (v.category === 'musik') showMoreBand.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || (v.genreMusik && v.genreMusik.length) || v.durasiTampil || v.deskripsi || v.catatan)
      if (v.category === 'fotografer') showMoreFoto.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || v.includePrewedding || v.durasiLiputan || (v.liputanAcara && v.liputanAcara.length) || v.jumlahFotografer || v.jumlahVideografer || v.jumlahContentCreator || (v.hasilFotoVideo && v.hasilFotoVideo.length) || v.estimasiPreview || v.estimasiFotoJadi || v.estimasiVideoJadi || v.deskripsi || v.catatan)
      if (v.category === 'mua') showMoreMua.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || v.makeupPengantinWanita || v.makeupPengantinPria || v.hairdo || v.hijabdo || v.includeBusana || v.trialMakeup || v.touchUp || v.deskripsi || v.catatan)
      if (v.category === 'mc') showMoreMc.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || (v.acaraDibawakan && v.acaraDibawakan.length) || v.durasiMembawakan || (v.bahasaMc && v.bahasaMc.length) || (v.adatMc && v.adatMc.length) || v.gayaMc || v.deskripsi || v.catatan)
      if (v.category === 'souvenir') showMoreSouvenir.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || v.namaSouvenir || (v.isiPaketSouvenir && v.isiPaketSouvenir.length) || v.includePackaging || (v.customisasi && v.customisasi.length) || v.jumlahSouvenir || v.minimalOrder || v.estimasiProduksi || v.estimasiPengiriman || v.deskripsi || v.catatan)
      if (v.category === 'wo') showMoreWO.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || v.jenisLayananWO || (v.layananDidapat && v.layananDidapat.length) || v.jumlahMeeting || v.includeSurveyVenue || v.includeGladiBersih || (v.koordinasiVendor && v.koordinasiVendor.length) || v.jumlahCrewHariH || (v.strukturTim && v.strukturTim.length) || v.jumlahKonsumsiTim || (v.dokumenDidapat && v.dokumenDidapat.length) || v.deskripsi || v.catatan)
      if (v.category === 'venue') showMoreVenue.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || v.jenisVenue || (v.konsepVenue && v.konsepVenue.length) || v.kapasitasMin || v.kapasitasMaks || v.jamMulai || v.jamSelesai || (v.areaAcara && v.areaAcara.length) || (v.fasilitasVenue && v.fasilitasVenue.length) || (v.kebijakanVenue && v.kebijakanVenue.length) || (v.vendorRekanan && v.vendorRekanan.length) || v.deskripsi || v.catatan)
      if (v.category === 'catering') showMoreCatering.value = !!(v.pic || v.hp || v.email || v.website || v.instagram || v.alamat || (v.jenisPaketCatering && v.jenisPaketCatering.length) || (v.buffetAppetizer && v.buffetAppetizer.length) || (v.buffetMainCourse && v.buffetMainCourse.length) || (v.buffetDessert && v.buffetDessert.length) || (v.buffetBeverage && v.buffetBeverage.length) || (v.foodStall && v.foodStall.length) || v.includeLiveCooking || (v.includeCatering && v.includeCatering.length) || v.durasiPelayanan || v.jumlahWaiter || v.jumlahChef || v.sistemRefill || v.includeFoodTasting || (v.kebijakanCatering && v.kebijakanCatering.length) || (v.biayaTambahan && v.biayaTambahan.length) || v.deskripsi || v.catatan)
      // Buka modal edit vendor Per Pax (bukan "Jumlah Custom") → recalc
      // Total Harga terhadap data Tab Tamu SEKARANG, bukan pasrah nampilin
      // v.harga yang mungkin udah basi sejak vendor ini terakhir disimpan.
      if (v.tipeHarga === 'pax' && v.paxPengali !== 'manual') calcPaxTotal(true)
    }
  } else {
    form.value = blankForm()
    form.value.category = props.defaultCategory
    showMoreDekorasi.value = false
    showMoreBand.value = false
    showMoreFoto.value = false
    showMoreMua.value = false
    showMoreMc.value = false
    showMoreSouvenir.value = false
    showMoreWO.value = false
    showMoreVenue.value = false
    showMoreCatering.value = false
  }
  nextTick(() => { namaInput.value?.focus(); autoGrowDesk() })
})

// Total Personel = jumlah Struktur Tim; fallback ke angka di Jumlah Crew
// Hari H kalau Struktur Tim belum diisi (mis. "4 Orang" -> 4).
const totalPersonel = computed(() => {
  const sum = form.value.strukturTim.reduce((s, x) => s + (x.jumlah || 0), 0)
  if (sum > 0) return sum
  const m = (form.value.jumlahCrewHariH || '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
})
// Jumlah Konsumsi Tim ngikutin Total Personel secara default — sama kayak
// pola auto-calc harga di kategori lain (force || value === 0), berhenti
// ngikutin begitu user isi manual.
watch(totalPersonel, val => {
  if (form.value.jumlahKonsumsiTim === 0 && val > 0) form.value.jumlahKonsumsiTim = val
})

function togglePax() {
  if (form.value.tipeHarga === 'pax') {
    calcPaxTotal(false)
    if (form.value.category !== 'venue') form.value.kapasitas = 0
  }
}

function onDekorasiTipeHargaChange() {
  if (form.value.tipeHarga === 'pax') calcPaxTotal(false)
  else if (form.value.tipeHarga === 'item') calcItemTotal(false)
}

function calcPaxTotal(force = true) {
  if (form.value.tipeHarga !== 'pax') return
  // Multiplier-nya SELALU baca live dari store (Single Source of Truth
  // Tab Tamu, lihat vendorPaxMultiplier di wedding.js) — nggak ada
  // perhitungan/cache jumlah tamu terpisah di sini.
  const mult = store.vendorPaxMultiplier(form.value)
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaPax || 0) * mult
}

// Live sync — kalau data tamu di Tab Tamu berubah SELAGI modal ini
// kebuka (mis. user habis edit/hapus/tambah tamu atau ubah status
// RSVP/kehadiran/hampers di tab lain, terus balik ke modal Vendor ini
// tanpa nutupnya), Total Harga ikut ke-update otomatis tanpa perlu
// refresh halaman atau trigger manual. "Jumlah Custom" sengaja dilewati
// karena itu memang lepas dari Tab Tamu.
watch([() => store.hadirOrangCount, () => store.rsvpUndanganCount, () => store.hampersCount], () => {
  if (form.value.tipeHarga === 'pax' && form.value.paxPengali !== 'manual') calcPaxTotal(true)
})

function calcItemTotal(force = true) {
  if (form.value.tipeHarga !== 'item') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaItem || 0) * (form.value.jumlahItem || 1)
}

function onBandTipeHargaChange() {
  if (form.value.tipeHarga === 'jam') calcJamTotal(false)
  else if (form.value.tipeHarga === 'sesi') calcSesiTotal(false)
}

function calcJamTotal(force = true) {
  if (form.value.tipeHarga !== 'jam') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaJam || 0) * (form.value.totalJam || 1)
}

function calcSesiTotal(force = true) {
  if (form.value.tipeHarga !== 'sesi') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaSesi || 0) * (form.value.totalSesi || 1)
}

// Fotografer cuma pakai All In / Per Jam — Per Jam-nya numpang pakai
// hargaJam/totalJam/calcJamTotal yang sama kayak Band, cukup beda handler
// perubahan tipe harga-nya (Fotografer nggak punya opsi Per Sesi).
function onFotografiTipeHargaChange() {
  if (form.value.tipeHarga === 'jam') calcJamTotal(false)
}

function onMuaTipeHargaChange() {
  if (form.value.tipeHarga === 'orang') calcOrangTotal(false)
}

function onMcTipeHargaChange() {
  if (form.value.tipeHarga === 'jam') calcJamTotal(false)
}

function onSouvenirTipeHargaChange() {
  if (form.value.tipeHarga === 'item') calcItemTotal(false)
}

function onCateringTipeHargaChange() {
  if (form.value.tipeHarga === 'pax') calcPaxTotal(false)
  else if (form.value.tipeHarga === 'box') calcBoxTotal(false)
  else if (form.value.tipeHarga === 'stall') calcStallTotal(false)
}
function calcBoxTotal(force = true) {
  if (form.value.tipeHarga !== 'box') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaBox || 0) * (form.value.jumlahBox || 1)
}
function calcStallTotal(force = true) {
  if (form.value.tipeHarga !== 'stall') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaStall || 0) * (form.value.jumlahStall || 1)
}
function onHargaBox(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaBox = num(e.target.value)
  calcBoxTotal(true)
}
function onHargaStall(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaStall = num(e.target.value)
  calcStallTotal(true)
}

// List teks bebas (menu buffet & live cooking) — cukup nama, tanpa jumlah.
function addStringItem(listKey) {
  const val = (newMenuItem.value[listKey] || '').trim()
  if (val && !form.value[listKey].includes(val)) {
    form.value[listKey].push(val)
    newMenuItem.value[listKey] = ''
  }
}
function removeStringItem(listKey, idx) {
  form.value[listKey].splice(idx, 1)
}

// Fasilitas venue — sebagian item punya jumlah (mis. Toilet), sebagian
// cuma checklist polos (mis. AC). jumlah null kalau nggak relevan.
function isFasilitasChecked(nama) {
  return form.value.fasilitasVenue.some(x => x.nama === nama)
}
function toggleFasilitas(nama, checked) {
  if (checked) {
    if (!isFasilitasChecked(nama)) form.value.fasilitasVenue.push({ nama, jumlah: null })
  } else {
    form.value.fasilitasVenue = form.value.fasilitasVenue.filter(x => x.nama !== nama)
  }
}
function fasilitasQty(nama) {
  const found = form.value.fasilitasVenue.find(x => x.nama === nama)
  return found && found.jumlah != null ? found.jumlah : ''
}
function setFasilitasQty(nama, val) {
  const found = form.value.fasilitasVenue.find(x => x.nama === nama)
  if (found) found.jumlah = val === '' ? null : Math.max(1, parseInt(val, 10) || 1)
}

// Included Vendor — vendor lain yang paketnya udah termasuk di vendor ini.
// Dropdown "Vendor" per baris cuma nampilin vendor kategori yang sama
// dengan baris itu, dan nggak nampilin vendor yang lagi diedit ini sendiri
// (nggak masuk akal include diri sendiri).
function vendorOptionsFor(category) {
  return store.vendors.filter(v => v.category === category && v.id !== props.editId)
}
const includedVendorFields = [
  {
    key: 'category', label: 'Kategori', type: 'select', placeholder: 'Pilih kategori',
    options: () => INCLUDED_VENDOR_CATEGORY_OPTIONS.map(c => ({ value: c.id, label: c.label })),
    onChange: item => { item.vendorId = null },
  },
  {
    key: 'vendorId', label: 'Vendor', type: 'select', valueType: 'number', full: true,
    hidden: item => !item.category || item.category === 'lainnya',
    options: item => [{ value: null, label: 'Vendor ditentukan kemudian' }, ...vendorOptionsFor(item.category).map(v => ({ value: v.id, label: v.nama + (v.namaPaket ? ' — ' + v.namaPaket : '') }))],
  },
  { key: 'catatan', label: 'Catatan (opsional)', type: 'text', placeholder: 'cth: vendor mengikuti paket ini', full: true },
]
function includedVendorIcon(item) { return CAT_ICONS[item.category] || '🔗' }
function includedVendorTitle(item) {
  if (!item.category) return 'Included vendor baru'
  const c = INCLUDED_VENDOR_CATEGORY_OPTIONS.find(x => x.id === item.category)
  return c ? c.label : item.category
}
function includedVendorSubtitle(item) {
  const lines = []
  if (item.category && item.category !== 'lainnya') {
    const v = item.vendorId ? store.vendors.find(x => x.id === item.vendorId) : null
    lines.push(v ? v.nama : 'Vendor ditentukan kemudian')
  }
  if (item.catatan) lines.push(item.catatan)
  return lines
}

const layananDidapatFields = [
  { key: 'nama', label: 'Nama Layanan', type: 'text', placeholder: 'cth: Koordinasi Vendor', full: true },
  { key: 'keterangan', label: 'Keterangan (opsional)', type: 'textarea', placeholder: 'opsional', full: true },
]
const strukturTimFields = [
  { key: 'posisi', label: 'Posisi', type: 'text', placeholder: 'cth: Team Leader' },
  { key: 'jumlah', label: 'Jumlah', type: 'number' },
]
const isiPaketSouvenirFields = [
  { key: 'nama', label: 'Nama Item', type: 'text', placeholder: 'cth: Mug Keramik' },
  { key: 'jumlah', label: 'Jumlah', type: 'number' },
]
const areaAcaraFields = [
  { key: 'nama', label: 'Nama Area', type: 'text', placeholder: 'cth: Ballroom Utama' },
  { key: 'kapasitas', label: 'Kapasitas (orang)', type: 'number' },
]
const vendorRekananFields = [
  { key: 'kategori', label: 'Kategori', type: 'select', placeholder: 'Pilih kategori', options: () => VENDOR_CATEGORIES.map(c => ({ value: c.label, label: c.label })) },
  { key: 'nama', label: 'Nama Vendor', type: 'text', placeholder: 'Nama vendor rekanan', full: true },
]
const foodStallFields = [
  { key: 'nama', label: 'Nama Stall', type: 'text', placeholder: 'cth: Bakso' },
  { key: 'jumlah', label: 'Jumlah', type: 'number' },
  { key: 'keterangan', label: 'Keterangan (opsional)', type: 'text', placeholder: 'opsional', full: true },
]
const biayaTambahanFields = [
  { key: 'nama', label: 'Nama Biaya', type: 'text', placeholder: 'cth: Transport' },
  { key: 'nominal', label: 'Nominal', type: 'currency' },
  { key: 'keterangan', label: 'Keterangan (opsional)', type: 'text', placeholder: 'opsional', full: true },
]

function calcOrangTotal(force = true) {
  if (form.value.tipeHarga !== 'orang') return
  if (force || form.value.harga === 0) form.value.harga = (form.value.hargaOrang || 0) * (form.value.jumlahOrang || 1)
}

// Repeatable list (busana/layanan tambahan) — tiap item { jenis, jumlah }.
// Dipakai generik lewat listKey ('busanaList' / 'layananTambahan') biar
// nggak duplikasi 2x fungsi yang sama persis.
function isRepeatChecked(listKey, item) {
  return form.value[listKey].some(x => x.jenis === item)
}
function toggleRepeat(listKey, item, checked) {
  if (checked) {
    if (!isRepeatChecked(listKey, item)) form.value[listKey].push({ jenis: item, jumlah: 1 })
  } else {
    form.value[listKey] = form.value[listKey].filter(x => x.jenis !== item)
  }
}
function repeatQty(listKey, item) {
  const found = form.value[listKey].find(x => x.jenis === item)
  return found ? found.jumlah : 1
}
function setRepeatQty(listKey, item, val) {
  const found = form.value[listKey].find(x => x.jenis === item)
  if (found) found.jumlah = Math.max(1, parseInt(val, 10) || 1)
}

function onHargaPax(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaPax = num(e.target.value)
  calcPaxTotal(true)
}
function onHargaItem(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaItem = num(e.target.value)
  calcItemTotal(true)
}
function onHargaJam(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaJam = num(e.target.value)
  calcJamTotal(true)
}
function onHargaSesi(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaSesi = num(e.target.value)
  calcSesiTotal(true)
}
function onHargaOrang(e) {
  e.target.value = grp(e.target.value)
  form.value.hargaOrang = num(e.target.value)
  calcOrangTotal(true)
}
function onHarga(e) {
  e.target.value = grp(e.target.value)
  form.value.harga = num(e.target.value)
}

async function save() {
  if (!form.value.nama.trim()) return
  const vData = { ...form.value, nama: form.value.nama.trim(), namaPaket: form.value.namaPaket.trim(), pic: form.value.pic.trim(), alamat: form.value.alamat.trim(), hp: form.value.hp.trim(), email: form.value.email.trim(), website: form.value.website.trim(), instagram: form.value.instagram.trim(), deskripsi: form.value.deskripsi.trim(), harga: form.value.harga, durasiTampil: form.value.durasiTampil.trim(), catatan: form.value.catatan.trim(), durasiPrewedding: form.value.durasiPrewedding.trim(), estimasiPreview: form.value.estimasiPreview.trim(), estimasiFotoJadi: form.value.estimasiFotoJadi.trim(), estimasiVideoJadi: form.value.estimasiVideoJadi.trim(), durasiPendampingan: form.value.durasiPendampingan.trim(), jumlahSouvenir: form.value.jumlahSouvenir.trim(), minimalOrder: form.value.minimalOrder.trim(), estimasiPengiriman: form.value.estimasiPengiriman.trim(), isiPaketSouvenir: form.value.isiPaketSouvenir.map(x => ({ nama: x.nama.trim(), jumlah: x.jumlah || 1 })).filter(x => x.nama), layananDidapat: form.value.layananDidapat.map(x => ({ nama: x.nama.trim(), keterangan: x.keterangan.trim() })).filter(x => x.nama), strukturTim: form.value.strukturTim.map(x => ({ posisi: x.posisi.trim(), jumlah: x.jumlah || 1 })).filter(x => x.posisi), areaAcara: form.value.areaAcara.map(x => ({ nama: x.nama.trim(), kapasitas: x.kapasitas || 0 })).filter(x => x.nama), vendorRekanan: form.value.vendorRekanan.map(x => ({ kategori: x.kategori.trim(), nama: x.nama.trim() })).filter(x => x.nama), foodStall: form.value.foodStall.map(x => ({ nama: x.nama.trim(), jumlah: x.jumlah || 1, keterangan: x.keterangan.trim() })).filter(x => x.nama), biayaTambahan: form.value.biayaTambahan.map(x => ({ nama: x.nama.trim(), nominal: x.nominal || 0, keterangan: x.keterangan.trim() })).filter(x => x.nama), includedVendors: form.value.includedVendors.map(x => ({ category: x.category, vendorId: x.vendorId || null, catatan: (x.catatan || '').trim() })).filter(x => x.category) }
  if (props.editId) {
    const idx = store.vendors.findIndex(x => x.id === props.editId)
    if (idx > -1) {
      // jadi diturunkan dari status — bukan dipertahankan dari nilai lama.
      const jadi = vData.status === 'dipakai'
      Object.assign(store.vendors[idx], vData, { jadi })
      // Sinkronkan baris Budget: bikin/hapus sesuai status "dipakai".
      store.handleVendorDecision(store.vendors[idx], jadi)
    }
    store.saveV()
  } else {
    // PK vendors di-generate server — insert dulu & tunggu id aslinya balik
    const row = await store.addVendor(vData)
    if (!row) return
  }
  store.toast(props.editId ? 'Vendor disimpan' : 'Vendor ditambahkan')
  emit('close')
}
</script>

<style scoped>
.vm-cap-hint { font-size: 12px; color: var(--muted); margin-top: 6px; }
.vm-cap-hint.over { color: var(--rose); font-weight: 600; }
textarea.autosize { min-height: 64px; max-height: 300px; overflow-y: auto; resize: none; }
.vm-more-btn {
  display: block;
  width: 100%;
  margin-bottom: 14px;
  padding: 10px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  background: none;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.vm-more-btn:hover { background: var(--gold-soft); border-color: var(--gold); }
.vm-genre-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.vm-genre-chip {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 100px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  background: var(--paper);
  cursor: pointer;
  user-select: none;
}
.vm-genre-chip.on { background: var(--plum); border-color: var(--plum); color: #fff; }
.vm-section-lbl {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--plum);
  text-transform: uppercase;
  letter-spacing: .03em;
  margin: 16px 0 8px;
}
.vm-repeat-list {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 4px 12px;
  margin-bottom: 12px;
}
.vm-repeat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.vm-repeat-row:last-child { border-bottom: none; }
.vm-repeat-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  flex: 1;
}
.vm-repeat-check input { width: 16px; height: 16px; accent-color: var(--plum); cursor: pointer; flex: none; }
.vm-repeat-qty {
  width: 56px;
  padding: 5px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}
.vm-sub-lbl {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 6px;
}
.vm-inc-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  margin: -4px 0 8px;
}
.vm-readonly {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 14px;
  color: var(--muted);
  background: var(--ivory);
}
.vm-strlist { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
.vm-strlist-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 100px;
  background: var(--ivory);
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--ink);
}
.vm-strlist-chip button {
  border: none;
  background: none;
  color: var(--rose);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}
.vm-strlist-add { display: flex; gap: 8px; margin-bottom: 14px; }
.vm-strlist-add input {
  flex: 1;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 13px;
  color: var(--ink);
  background: var(--paper);
}
.vm-strlist-add button {
  flex: none;
  padding: 7px 12px;
  border: 1px dashed var(--line);
  border-radius: 6px;
  background: none;
  color: var(--plum);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.vm-strlist-add button:hover { background: var(--gold-soft); border-color: var(--gold); }
</style>
