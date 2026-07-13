# Partner Collaboration Feature

## Overview
Fitur kolaborasi pasangan memungkinkan dua orang (pengantin pria & wanita) untuk mengedit data wedding planner secara real-time bersama-sama.

## Cara Akses

### Desktop
- Klik banner **"Kolaborasi Pasangan"** di HomeTab (tepat di bawah hero countdown)
- Atau buka menu dropdown (ikon titik tiga) → pilih **"Tambah Pasangan"**

### Mobile
- Buka sidebar (hamburger menu) → klik **"Tambah Pasangan"**
- Atau tap banner **"Kolaborasi Pasangan"** di HomeTab

## User Flow

### Untuk Owner (Pengirim Undangan)
1. **Kirim Undangan**
   - Buka modal Partner
   - Masukkan email pasangan
   - Klik "Buat Link Undangan"
   - Share link via:
     - WhatsApp (direct)
     - Email (mailto)
     - Copy link manual

2. **Pending Invitation**
   - Link undangan ditampilkan di modal
   - Bisa di-copy atau di-share ulang
   - Tombol "Batalkan" untuk cancel invite
   - Link berlaku 7 hari

3. **Partner Aktif**
   - Email partner ditampilkan
   - Tombol "Hapus Pasangan" untuk revoke akses
   - Real-time sync otomatis aktif

### Untuk Partner (Penerima Undangan)
1. **Accept Invitation**
   - Klik link undangan
   - Login dengan Google
   - Otomatis redirect ke dashboard owner
   - Lihat semua data owner

2. **Dashboard Bersama**
   - Modal menampilkan "Dashboard Bersama"
   - Info: "Diundang oleh [email owner]"
   - Bisa edit semua data (guests, budget, vendors, dll)
   - Tombol "Keluar dari Dashboard Bersama" untuk leave

## Technical Details

### Store Functions (wedding.js)
- `sendPartnerInvite(email)` - Kirim invite, return token
- `cancelPartnerInvite(id)` - Cancel pending invite
- `acceptPartnerInvite(token)` - Accept invite (auto called saat klik link)
- `removePartner()` - Owner hapus partner
- `leavePartnership()` - Partner keluar dari dashboard bersama
- `revalidateMembership()` - Sync status kemitraan (on focus/visibility)

### Store State
- `isPartner` (boolean) - True jika login sebagai partner
- `partnerEmail` (string) - Email partner (untuk owner)
- `ownerEmail` (string) - Email owner (untuk partner)
- `ownerUserId` (string) - user_id pemilik data

### Real-time Sync
- Menggunakan Supabase Realtime
- Channel: `wd:{ownerUserId}`
- Auto-sync: guests, budget, vendors, seserahan, mahar, admin, checklist, timeline
- Partner dikeluarkan otomatis jika owner hapus akses

### Database Tables
- `partner_invitations` - Menyimpan invite token & status
- `wedding_data.partner_user_id` - Foreign key ke partner
- `wedding_data.partner_email` - Email partner untuk UI

### RLS (Row Level Security)
- Owner: full access ke row sendiri
- Partner: SELECT + UPDATE (no INSERT/DELETE) ke row owner
- RPC functions: `accept_partner_invite`, `leave_partnership`

## UI Components

### AddPartnerCard.vue
Modal dengan 4 state:
1. **Form undang** - Owner belum kirim invite
2. **Pending invite** - Owner sudah kirim, link aktif
3. **Partner aktif** - Owner punya partner
4. **Dashboard bersama** - Partner view

Features:
- Animated gradient hero dengan dekorasi hati
- Copy link button dengan feedback visual
- WhatsApp & email share buttons
- Confirm dialog untuk destructive actions

### HomeTab Partner Banner
- Gradient merah wine dengan icon hati
- 3 state text:
  - "Kolaborasi Pasangan" (belum ada partner)
  - "Pasangan Aktif" + email (owner view)
  - "Dashboard Bersama" + owner email (partner view)
- Hover effect dengan arrow animation
- Responsive mobile layout

### MobileSidebar Integration
- Menu item dengan icon users
- Green dot indicator jika partner aktif
- Open AddPartnerCard modal on click

## Security Considerations

### Invite Link
- Token-based (UUID v4)
- Expiry: 7 hari
- One-time use (status berubah ke 'accepted')
- Cancel invalidates token

### Permissions
- Partner tidak bisa:
  - Membuat row wedding_data baru
  - Menghapus row wedding_data
  - Mengundang partner lain
  - Menghapus owner
- Owner bisa:
  - Hapus partner kapan saja
  - Cancel pending invite
  - Full control atas data

### Data Isolation
- Partner hanya akses data owner yang mengundang
- Jika partner punya data sendiri, data itu tetap terpisah
- Leave partnership → kembali ke data sendiri

## Edge Cases Handled

1. **Partner diundang 2x**: Prioritas invite terbaru
2. **Owner hapus partner saat partner online**: Realtime event + revalidation on focus
3. **Partner leave saat owner offline**: Owner lihat perubahan pas buka app lagi
4. **Expired invite**: Cek `expires_at` di query
5. **User punya data sendiri + jadi partner**: Data sendiri tetap aman, bisa switch
6. **OAuth redirect membersihkan URL**: Token disimpan di `sessionStorage` sebelum redirect

## Testing Checklist

- [ ] Owner kirim invite → link ter-generate
- [ ] Copy link → clipboard berisi link lengkap
- [ ] Share WhatsApp → WA terbuka dengan pre-filled message
- [ ] Partner klik link → login → auto join
- [ ] Partner edit data → owner lihat perubahan real-time
- [ ] Owner edit data → partner lihat perubahan real-time
- [ ] Owner hapus partner → partner ter-kick
- [ ] Partner leave → owner lihat partner hilang
- [ ] Cancel pending invite → link tidak bisa dipakai
- [ ] Expired invite (7 hari) → tidak muncul di pending
- [ ] Mobile: banner visible & clickable
- [ ] Mobile: sidebar menu buka modal

## Future Improvements

- [ ] Multiple partners (tim wedding planner)
- [ ] Role-based permissions (view-only, edit-only certain tabs)
- [ ] Activity log (siapa edit apa, kapan)
- [ ] In-app notification saat partner edit
- [ ] Partner profile picture di header
- [ ] Partner last active timestamp
