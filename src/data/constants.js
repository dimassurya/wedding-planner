export const WEDDING_DATE = '2026-12-20'

export const META = {
  cpp:             { label: 'Keluarga Pengantin Pria',   short: 'Kel. Pria',    side: 'pria',   group: 'Keluarga', color: '#7090C8', bg: '#0A1D4B', text: '#fff' },
  cpw:             { label: 'Keluarga Pengantin Wanita', short: 'Kel. Wanita',  side: 'wanita', group: 'Keluarga', color: '#F0A8A8', bg: '#B32E33', text: '#fff' },
  teman_pria:      { label: 'Teman Pengantin Pria',      short: 'Tmn. Pria',    side: 'pria',   group: 'Teman',    color: '#7090C8', bg: '#0A1D4B', text: '#fff' },
  teman_wanita:    { label: 'Teman Pengantin Wanita',    short: 'Tmn. Wanita',  side: 'wanita', group: 'Teman',    color: '#D08080', bg: '#810100', text: '#fff' },
  tetangga_pria:   { label: 'Tetangga Pengantin Pria',   short: 'Ttg. Pria',    side: 'pria',   group: 'Tetangga', color: '#E5C99A', bg: '#CD9F65', text: '#3a2a10' },
  tetangga_wanita: { label: 'Tetangga Pengantin Wanita', short: 'Ttg. Wanita',  side: 'wanita', group: 'Tetangga', color: '#C07080', bg: '#6E151A', text: '#fff' },
  lainnya:         { label: 'Lainnya',                   short: 'Lainnya',      side: null,     group: 'Lainnya',  color: '#C4A8A8', bg: '#3A2A2A', text: '#E8D0D0' },
}

export const ORDER = ['cpp','cpw','teman_pria','teman_wanita','tetangga_pria','tetangga_wanita','lainnya']

export const GUEST_SEED = [
  ['papa dimsur',4,'cpp'],['lek yum',2,'cpp'],['nia',2,'cpp'],['dila',2,'cpp'],['mbak tatik',3,'cpp'],
  ['mbak ina',4,'cpp'],['mbak santi',4,'cpp'],['mbak tia',3,'cpp'],['pakde',1,'cpp'],['mas riski',2,'cpp'],
  ['bu umi + palek mono',4,'cpp'],['tante sulis',2,'cpp'],['mas fajar',2,'cpp'],['mbak lipa',4,'cpp'],
  ['tante erwin',2,'cpp'],['paklek polisi',2,'cpp'],['papa kiki',2,'cpw'],['nenek umi',2,'cpw'],
  ['nenek yeyek',3,'cpw'],['kai jen & nenek nining',2,'cpw'],['om dani & istri',3,'cpw'],['kai han',1,'cpw'],
  ['tante ririn & om ferdi',5,'cpw'],['mas sandy & istri',2,'cpw'],['om muji & tante santi',3,'cpw'],
  ['bu mimik & suami',3,'cpw'],['njo',2,'cpw'],['kak hendra',2,'cpw'],['masde',1,'cpw'],
  ['kak rani & suami',3,'cpw'],['tante eni',5,'cpw'],['tante lina',4,'cpw'],['bupuh ita',1,'cpw'],
  ['bupuh mojokerto',2,'cpw'],['fani',2,'cpw'],['plemahan',2,'cpw'],['plemahan',2,'cpw'],['plemahan',2,'cpw'],
  ['eyang kak rani',1,'cpw'],['reza',1,'teman_pria'],['bima',1,'teman_pria'],['aji',2,'teman_pria'],
  ['era',2,'teman_pria'],['luki',2,'teman_pria'],['titan',1,'teman_pria'],['destian',2,'teman_pria'],
  ['pak reza',2,'teman_pria'],['tirta',2,'teman_pria'],['bill',2,'teman_pria'],['harun',2,'teman_pria'],
  ['mas gilang',2,'teman_pria'],['ravin',2,'teman_pria'],['rendy',2,'teman_pria'],['riko',2,'teman_pria'],
  ['duta',2,'teman_pria'],['fahmi',2,'teman_pria'],['romi',2,'teman_pria'],['fahrul',2,'teman_pria'],
  ['pak nanang',2,'teman_pria'],['fikri',2,'teman_pria'],['ari',2,'teman_pria'],['mariam',2,'teman_pria'],
  ['bu novi',2,'teman_pria'],['pak yo',2,'teman_pria'],['pak david',2,'teman_pria'],['mas apri',2,'teman_pria'],
  ['mas alam',2,'teman_pria'],['bagas',2,'teman_pria'],['aldi',2,'teman_pria'],['rizal',2,'teman_pria'],
  ['zul',2,'teman_pria'],['pak andri & bu nia',2,'teman_wanita'],['mas wisnu',2,'teman_wanita'],
  ['mas yayan',2,'teman_wanita'],['om roni',2,'teman_wanita'],['mas fudin fanee',2,'teman_wanita'],
  ['mas dana',2,'teman_wanita'],['mas rudi',2,'teman_wanita'],['mas anam',2,'teman_wanita'],['retno',2,'teman_wanita'],
  ['mas irfan',2,'teman_wanita'],['mbak tari',2,'teman_wanita'],['eca',2,'teman_wanita'],['mbak iis',2,'teman_wanita'],
  ['fina',2,'teman_wanita'],['mas yuda',2,'teman_wanita'],['mas ninu',2,'teman_wanita'],['mbak hanim',2,'teman_wanita'],
  ['mbak orin',2,'teman_wanita'],['ulfa',2,'teman_wanita'],['rista',2,'teman_wanita'],['bilqis',2,'teman_wanita'],
  ['zahra',2,'teman_wanita'],['mbak desi',2,'teman_wanita'],['mbak ipeh',2,'teman_wanita'],['pipi',2,'teman_wanita'],
  ['syara',2,'teman_wanita'],['mega',2,'teman_wanita'],['bong',2,'teman_wanita'],['nopal',2,'teman_wanita'],
  ['dimas',2,'teman_wanita'],['kak diana',2,'teman_wanita'],['bu aini',2,'teman_wanita'],['mbak kiky',2,'teman_wanita'],
  ['ukik',2,'teman_wanita'],['mas riky',2,'teman_wanita'],['mbak tasya',2,'teman_wanita'],['celin',2,'teman_wanita'],
  ['tante endang',2,'tetangga_wanita'],['tante rini',2,'tetangga_wanita'],['tante alfa & suami',2,'tetangga_wanita'],
  ['bu rt & suami',2,'tetangga_wanita'],['om akibi',2,'tetangga_wanita'],['tante lita',2,'tetangga_wanita'],
  ['om rusdi',2,'tetangga_wanita'],['tante ena',2,'tetangga_wanita'],['mas jan',2,'tetangga_wanita'],
  ['tante sri',2,'tetangga_wanita'],['mas budi',2,'tetangga_wanita'],['tante ning cak kan',2,'tetangga_wanita'],
  ['mas wawan',2,'tetangga_wanita'],['eko',2,'tetangga_wanita'],['pak RT',2,'tetangga_pria'],
  ['bu vera',2,'lainnya'],['pak amri',2,'lainnya'],['pak wawan',2,'lainnya'],['pak anang',2,'lainnya'],
].map((r, i) => ({ id: i + 1, nama: r[0], jumlah: r[1], status: r[2], undangan: r[3] || 'keduanya', konfirmasi: true }))

export const BUDGET_SEED = [
  'Mahar','Seserahan','Resto','Dekor','Konsumsi','MASJID',
  'Dokumentasi','Music + Sound','MC Akad + Resepsi','Undangan Online','Undangan Cetak',
  'MakeUp Pengantin','Attire','Hair/Hijabdo','Henna/Nails Art','Kue untuk Undangan',
  'Penginapan','Souvenir','Buku Tamu','Penjaga Stand','Penerima Tamu','Kendaraan',
  'Bingkisan','Makeup Keluarga','Busana Keluarga','Biaya Penghulu',
].map((item, i) => ({ id: i + 1, item, estimasi: 0, aktual: 0, uangMuka: 0, dibayar: 0, jatuhTempo: '', remarks: '', template: true }))

export const VENDOR_CATEGORIES = [
  { id: 'wo',        label: 'Wedding Organizer' },
  { id: 'venue',     label: 'Venue' },
  { id: 'catering',  label: 'Catering' },
  { id: 'dekorasi',  label: 'Dekorasi' },
  { id: 'musik',     label: 'Musik/Band' },
  { id: 'fotografer',label: 'Fotografer' },
  { id: 'video',     label: 'Videografer' },
  { id: 'mua',       label: 'Makeup Artist' },
  { id: 'mc',        label: 'MC' },
  { id: 'souvenir',  label: 'Souvenir' },
]

export const SESERAHAN_SEED = []

function buildAdminSyarat(ktpLabel) {
  return [
    'Surat pengantar dari Desa/Kelurahan',
    'N1 - Surat Keterangan Untuk Nikah (dari Kelurahan)',
    'N2 - Surat Keterangan Asal Usul (dari Kelurahan)',
    'N3 - Surat Persetujuan Mempelai',
    'N4 - Surat Keterangan Tentang Orang Tua',
    'N5 - Surat Izin Orang Tua (jika umur di bawah 21 tahun)',
    'Fotocopy KTP ' + ktpLabel,
    'Fotocopy KTP Orang Tua',
    'Fotocopy KTP Saksi 1',
    'Fotocopy KTP Saksi 2',
    'Fotocopy Kartu Keluarga',
    'Fotocopy Akta Lahir',
    'Surat keterangan sehat calon suami / imunisasi calon istri',
    'Surat pernyataan belum pernah kawin disertai 2 saksi bermaterai 6000',
    'Pas photo 2x3 (5 lembar) & 4x6 (4 lembar)',
  ].map((s, i) => ({ id: i + 1, syarat: s, status: false }))
}

export const ADMIN_SEED = [
  { id: 1, grup: 'Calon Pengantin Pria',   items: buildAdminSyarat('Calon Pengantin Pria') },
  { id: 2, grup: 'Calon Pengantin Wanita', items: buildAdminSyarat('Calon Pengantin Wanita') },
]

function ckItems(rows) {
  return rows.map((r, i) => ({ id: i + 1, tugas: r[0], status: !!r[1] }))
}

export const CHECKLIST_SEED = [
  { id: 1, fase: '6 Bulan Sebelum', items: ckItems([
    ['Tentukan tanggal pernikahan (20 Desember 2026)', true],
    ['Diskusikan konsep & tema pernikahan (intimate)', true],
    ['Buat anggaran/budget nikah (under 45jt)', true],
    ['Susun list tamu kasar', true],
    ['Survey & booking vendor utama: dekorasi, katering, fotografer, videografer', false],
    ['Cari & pilih wedding organizer (jika pakai)', false],
    ['Mulai riset undangan (fisik & digital)', false],
    ['Tentukan seserahan & mahar', false],
    ['Rencanakan acara adat (lamaran, siraman, pengajian, dll. jika ada)', false],
    ['Survey cincin nikah (cpw done, cpp belum)', true],
    ['Rencana Honeymoon', false],
    ['Survei dekorasi & tenda', false],
  ]) },
  { id: 2, fase: '5 Bulan Sebelum', items: ckItems([
    ['Booking venue utama (gedung/tempat resepsi)', false],
    ['Booking perias/make-up artist', false],
    ['Tentukan MC & entertainment (band, DJ, traditional art)', false],
    ['Pilih & booking desainer/butik busana pengantin', false],
    ['Diskusi & test food catering', false],
    ['Susun rundown acara sementara', false],
    ['Finalisasi konsep dekorasi & detail bunga', false],
    ['Buat list penginapan untuk keluarga/tamu luar kota', false],
  ]) },
  { id: 3, fase: '4 Bulan Sebelum', items: ckItems([
    ['Mulai cicilan pembayaran vendor', false],
    ['Pilih pengiring pengantin (bridesmaid, groomsmen)', false],
    ['Tentukan souvenir pernikahan', false],
    ['Mulai perawatan tubuh (skincare, diet sehat, olahraga)', false],
    ['Pilih desain undangan final', false],
    ['Konfirmasi vendor utama (progress & pembayaran)', false],
    ['Siapkan dokumen legal & administrasi pernikahan (KUA/Catatan Sipil)', false],
    ['Fitting pertama baju pengantin', false],
  ]) },
  { id: 4, fase: '3 Bulan Sebelum', items: ckItems([
    ['Fitting kedua baju pengantin', false],
    ['Test make-up', false],
    ['Mulai persiapan acara adat (siraman/pengajian)', false],
    ['Kirim undangan ke tamu luar kota (save the date opsional)', false],
    ['Finalisasi dekorasi & detail teknis dengan vendor', false],
    ['Koordinasi rundown detail dengan MC & WO', false],
    ['Pastikan semua vendor sudah DP/terbayar sebagian', false],
    ['Cek ulang list tamu & seating plan', false],
  ]) },
  { id: 5, fase: '2 Bulan Sebelum', items: ckItems([
    ['Susun playlist musik', false],
    ['Cetak & distribusi undangan resmi (fisik/digital)', false],
    ['Fitting ketiga baju pengantin', false],
    ['Finalisasi souvenir, kue, dan cincin nikah', false],
    ['Persiapan kebutuhan acara adat (siraman, pengajian, dll.)', false],
    ['Konfirmasi semua vendor (jadwal & kontrak)', false],
  ]) },
  { id: 6, fase: '1 Bulan Sebelum', items: ckItems([
    ['Latihan teknis dengan pengiring pengantin', false],
    ['Siapkan daftar kontak darurat vendor (penanggung jawab tiap vendor)', false],
    ['Ambil & cek kelengkapan baju pengantin', false],
    ['Gladi bersih (jika ada)', false],
    ['Perawatan tubuh akhir (facial, spa, lulur)', false],
    ['Jaga kesehatan & istirahat cukup', false],
    ['Mulai persiapan koper honeymoon', false],
  ]) },
]

export const TIMELINE_SEED = [
  ['Menentukan anggaran',       '2026-06-30','belum',  'wanita',  '',          ''],
  ['Menentukan tanggal',        '2026-06-30','selesai','keduanya','2026-06-20','Fix 20 Des 2026'],
  ['Mencari WO/EO',             '2026-07-31','sedang', 'wanita',  '',          'Shortlist 3 vendor'],
  ['Memesan venue',             '2026-07-31','belum',  'pria',    '',          ''],
  ['Catering',                  '2026-08-15','belum',  'wanita',  '',          ''],
  ['Fotografer & videografer',  '2026-08-15','selesai','pria',    '2026-06-15','DP sudah dibayar'],
].map((r, i) => ({ id: i+1, tugas: r[0], deadline: r[1], status: r[2], pic: r[3], tanggalSelesai: r[4], catatan: r[5] }))

export const TL_STATUS = {
  belum:   { label: 'Belum',   color: '#B32E33', bg: '#F8E8E8', text: '#7a1a1a' },
  sedang:  { label: 'Sedang',  color: '#CD9F65', bg: '#F0E6CB', text: '#7a5c28' },
  selesai: { label: 'Selesai', color: '#E5C99A', bg: '#CD9F65', text: '#3a2a10' },
}

export const TL_PIC = {
  pria:     { label: 'Pria',     bg: '#0A1D4B', text: '#fff' },
  wanita:   { label: 'Wanita',   bg: '#F8E8E8', text: '#7a1a1a' },
  keduanya: { label: 'Keduanya', bg: '#F0E6CB', text: '#7a5c28' },
}

export const WP_TABS = [
  { tab: 'home',      label: 'Home' },
  { tab: 'tamu',      label: 'Tamu' },
  { tab: 'vendor',    label: 'Vendor' },
  { tab: 'seserahan', label: 'Seserahan' },
  { tab: 'mahar',     label: 'Mahar' },
  { tab: 'admin',     label: 'Dokumen Nikah' },
  { tab: 'checklist', label: 'Checklist' },
  { tab: 'budget',    label: 'Budget' },
  { tab: 'timeline',  label: 'Timeline' },
]

export const STORAGE_KEYS = {
  GKEY:  'weddingGuests_v3',
  BKEY:  'weddingBudget_v1',
  VKEY:  'weddingVendors_v1',
  SKEY:  'wp_seserahan',
  MKEY:  'wp_mahar',
  AKEY:  'wp_admin',
  CKEY:  'wp_checklist',
  TLKEY: 'wp_timeline',
  TAB_ORDER: 'wp_tabOrder',
}
