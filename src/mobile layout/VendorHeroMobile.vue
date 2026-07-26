<template>
  <div class="vhm-hero">
    <div class="vhm-top">
      <span class="vhm-title">💍 Persiapan Vendor</span>
      <span class="vhm-pct">{{ progressPct }}%</span>
    </div>
    <div class="vhm-bar"><span :style="{ width: progressPct + '%' }"></span></div>
    <div class="vhm-sub">{{ decidedCount }} dari {{ totalCategories }} kategori selesai</div>

    <div class="vhm-buckets">
      <button type="button" class="vhm-bucket" :class="{ on: activeStatus === 'semua' }" @click="select('semua')">Semua</button>
      <button type="button" class="vhm-bucket" :class="{ on: activeStatus === 'dipakai' }" @click="select('dipakai')"><b>{{ statusBuckets.dipilih }}</b> Dipilih</button>
      <button type="button" class="vhm-bucket vhm-bucket-inc" :class="{ on: activeStatus === 'included' }" @click="select('included')"><b>{{ statusBuckets.included }}</b> Included</button>
      <button type="button" class="vhm-bucket vhm-bucket-muted" :class="{ on: activeStatus === 'batal' }" @click="select('batal')"><b>{{ statusBuckets.belum }}</b> Belum Dipilih</button>
    </div>

    <div class="vhm-divider"></div>

    <div class="vhm-budget">
      <div class="vhm-budget-lbl">💰 Budget Vendor</div>
      <div class="vhm-budget-val">Rp {{ grp(totalBiaya) }}</div>
      <div class="vhm-budget-sub">{{ dipakaiCount }} vendor terpilih</div>
    </div>

    <div v-if="nextCategories.length" class="vhm-next">
      <span class="vhm-next-lbl">📌 Langkah Berikutnya</span>
      <div class="vhm-next-chips">
        <button v-for="c in nextCategories" :key="c.id" type="button" class="vhm-next-chip" @click="$emit('jump-category', c.id)">
          {{ catIcon(c.id) }} {{ c.label }}
        </button>
      </div>
    </div>
    <div v-else class="vhm-next done">✓ Semua kategori vendor sudah punya pilihan</div>
  </div>

  <!-- Ringkasan sticky — muncul pas hero penuh sudah ke-scroll lewat,
       biar progress & budget tetap kelihatan selama user kelola vendor. -->
  <Teleport to="body">
    <div class="vhm-sticky" :class="{ show: scrolled }">
      <div class="vhm-sticky-inner">
        <span class="vhm-sticky-pct">{{ progressPct }}%</span>
        <div class="vhm-sticky-bar"><span :style="{ width: progressPct + '%' }"></span></div>
        <span class="vhm-sticky-budget">Rp {{ grp(totalBiaya) }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Hero mobile — satu card gabungan (progress + status + budget + langkah
// berikutnya), plus ringkasan sticky yang nongol pas discroll. Murni
// tampilan: semua angka dioper dari VendorTab.vue (computed yang sama
// dipakai desktop), nggak ada logic/hitungan baru di sini.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { grp } from '../utils/index'

const props = defineProps({
  progressPct: { type: Number, required: true },
  decidedCount: { type: Number, required: true },
  totalCategories: { type: Number, required: true },
  statusBuckets: { type: Object, required: true },
  totalBiaya: { type: Number, required: true },
  dipakaiCount: { type: Number, required: true },
  nextCategories: { type: Array, required: true },
  activeStatus: { type: String, default: 'semua' },
})
const emit = defineEmits(['jump-category', 'select-status'])
function select(key) { emit('select-status', props.activeStatus === key ? 'semua' : key) }

const CAT_ICONS = { wo: '📋', venue: '🏛', catering: '🍽', dekorasi: '🌸', musik: '🎶', fotografer: '📸', mua: '💄', mc: '🎤', souvenir: '🎁' }
const catIcon = id => CAT_ICONS[id] || '💍'

const scrolled = ref(false)
function onScroll() { scrolled.value = window.scrollY > 220 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.vhm-hero {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px 18px 16px;
  margin: 12px 0;
  box-shadow: 0 1px 3px rgba(36,8,8,.05);
}
.vhm-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.vhm-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: var(--cacao); }
.vhm-pct { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--plum); font-variant-numeric: tabular-nums; }

.vhm-bar { position: relative; height: 12px; background: var(--gold-soft); border-radius: 100px; overflow: hidden; margin-top: 10px; }
.vhm-bar > span { display: block; height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--plum), var(--wine)); transition: width .5s ease; }
.vhm-sub { margin-top: 8px; font-size: var(--m-sub, 12.5px); color: var(--muted); }

.vhm-buckets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.vhm-bucket {
  display: inline-flex; align-items: center; gap: 4px;
  min-height: 36px;
  font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500; color: var(--cacao);
  background: var(--ivory); border: 1.5px solid var(--line); border-radius: 100px;
  padding: 0 12px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.vhm-bucket b { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 700; color: var(--plum); }
.vhm-bucket-inc b { color: var(--teal); }
.vhm-bucket-muted b { color: var(--muted); }
.vhm-bucket.on { background: var(--gold-soft); border-color: var(--gold); font-weight: 700; color: var(--plum); }
.vhm-bucket-inc.on { background: var(--teal-soft); border-color: var(--teal); }

.vhm-divider { height: 1px; background: var(--line); margin: 14px 0; border: none; border-top: 1px dashed var(--line); }

.vhm-budget-lbl { font-size: 12px; font-weight: 600; color: var(--muted); }
.vhm-budget-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--plum); margin-top: 2px; }
.vhm-budget-sub { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

.vhm-next { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line); }
.vhm-next-lbl { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); margin-bottom: 8px; }
.vhm-next.done { font-size: 13px; font-weight: 600; color: var(--plum); margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line); }
.vhm-next-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.vhm-next-chip {
  font-family: 'Jost', sans-serif; font-size: 12.5px; font-weight: 500;
  padding: 8px 13px; min-height: 36px; border-radius: 100px; border: 1px solid var(--line);
  background: var(--ivory); color: var(--cacao); cursor: pointer;
}
.vhm-next-chip:active { background: var(--rose-soft); border-color: var(--rose); }

/* ── Sticky compact summary ── */
.vhm-sticky {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 95;
  transform: translateY(-100%);
  transition: transform .22s ease;
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--paper);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 2px 10px rgba(36,8,8,.08);
}
.vhm-sticky.show { transform: translateY(56px); } /* nempel tepat di bawah MobileHeader (~56px) */
.vhm-sticky-inner {
  display: flex; align-items: center; gap: 10px;
  height: 44px; padding: 0 16px;
}
.vhm-sticky-pct { flex: none; font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 700; color: var(--plum); }
.vhm-sticky-bar { flex: 1; height: 6px; background: var(--gold-soft); border-radius: 100px; overflow: hidden; }
.vhm-sticky-bar > span { display: block; height: 100%; background: linear-gradient(90deg, var(--plum), var(--wine)); border-radius: 100px; }
.vhm-sticky-budget { flex: none; font-size: 12px; font-weight: 600; color: var(--cacao); max-width: 40vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
