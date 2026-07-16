// supabase/functions/create-payment/index.ts
//
// Dipanggil dari client (store.createPayment() di wedding.js) lewat
// supabase.functions.invoke('create-payment'). Bikin transaksi QRIS baru
// di iPaymu, simpan baris `payments` (status pending) pakai service_role,
// balikin data QR ke client buat ditampilkan.
//
// PENTING sebelum deploy: set secret berikut lewat
// `supabase secrets set NAMA=nilai` (lihat db/README.md bagian Payment):
//   IPAYMU_VA        — nomor VA/kode merchant dari dashboard iPaymu
//   IPAYMU_API_KEY   — API key dari dashboard iPaymu
//   IPAYMU_MODE      — "sandbox" atau "production"
// Plus yang sudah otomatis tersedia di semua edge function Supabase:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// CATATAN: field response iPaymu di bawah ini (Data.QrString dkk) mengikuti
// dokumentasi resmi iPaymu API v2 /payment/direct per pengetahuan terakhir.
// Kalau iPaymu mengubah bentuk response-nya, cek log function ini
// (raw response selalu di-log) dan sesuaikan bagian "parse response iPaymu".

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRICE_IDR = 99000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const keyData = new TextEncoder().encode(key)
  const msgData = new TextEncoder().encode(message)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Signature iPaymu v2: HMAC-SHA256(stringToSign, apiKey), di mana
// stringToSign = "{METHOD}:{VA}:{sha256(body) hex lowercase}:{apiKey}"
async function ipaymuSignature(method: string, va: string, apiKey: string, body: string) {
  const bodyHash = await sha256Hex(body)
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`
  return hmacSha256Hex(apiKey, stringToSign)
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Tidak ada sesi login' }), { status: 401, headers: CORS_HEADERS })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verifikasi JWT user pakai anon-key client (bukan bikin koneksi baru
    // ke auth server dgn kredensial user — cukup validasi token-nya).
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sesi login tidak valid' }), { status: 401, headers: CORS_HEADERS })
    }
    const user = userData.user

    const va = Deno.env.get('IPAYMU_VA')!
    const apiKey = Deno.env.get('IPAYMU_API_KEY')!
    const mode = Deno.env.get('IPAYMU_MODE') || 'sandbox'
    const baseUrl = mode === 'production'
      ? 'https://my.ipaymu.com/api/v2'
      : 'https://sandbox.ipaymu.com/api/v2'

    const referenceId = `wp-${user.id.slice(0, 8)}-${Date.now()}`
    const buyerName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pelanggan'

    const payload = {
      product: ['Wedding Planner - Akses Lifetime'],
      qty: [1],
      price: [PRICE_IDR],
      amount: PRICE_IDR,
      paymentMethod: 'qris',
      paymentChannel: 'qris',
      referenceId,
      buyerName,
      buyerEmail: user.email || '',
      buyerPhone: '081234567890',
    }
    const body = JSON.stringify(payload)
    const signature = await ipaymuSignature('POST', va, apiKey, body)

    const ipaymuRes = await fetch(`${baseUrl}/payment/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        va,
        signature,
      },
      body,
    })
    const ipaymuJson = await ipaymuRes.json()
    console.log('[create-payment] iPaymu raw response:', JSON.stringify(ipaymuJson))

    if (!ipaymuRes.ok || !ipaymuJson?.Data) {
      return new Response(JSON.stringify({ error: 'iPaymu gagal membuat transaksi', detail: ipaymuJson }), {
        status: 502, headers: CORS_HEADERS,
      })
    }

    // ── Parse response iPaymu — sesuaikan di sini kalau bentuknya beda ──
    const d = ipaymuJson.Data
    const trxId = String(d.TransactionId ?? d.transactionId ?? d.trx_id ?? '')
    const qrString = d.QrString ?? d.qrString ?? null
    const qrImage = d.QrImage ?? d.qrImage ?? null

    if (!trxId) {
      return new Response(JSON.stringify({ error: 'Response iPaymu tidak berisi TransactionId', detail: ipaymuJson }), {
        status: 502, headers: CORS_HEADERS,
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { error: insertErr } = await admin.from('payments').insert({
      owner_user_id: user.id,
      trx_id: trxId,
      reference_id: referenceId,
      amount: PRICE_IDR,
      status: 'pending',
      method: 'qris',
      raw_payload: ipaymuJson,
    })
    if (insertErr) {
      console.error('[create-payment] insert payments gagal:', insertErr)
      return new Response(JSON.stringify({ error: 'Gagal menyimpan transaksi' }), { status: 500, headers: CORS_HEADERS })
    }

    return new Response(JSON.stringify({
      trxId, referenceId, amount: PRICE_IDR, qrString, qrImage,
    }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[create-payment] error:', e)
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan server' }), { status: 500, headers: CORS_HEADERS })
  }
})
