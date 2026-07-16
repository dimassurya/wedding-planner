// supabase/functions/ipaymu-webhook/index.ts
//
// URL function ini ("Notify URL" / "Callback URL") didaftarkan di
// dashboard iPaymu, supaya iPaymu POST ke sini tiap status transaksi
// berubah. Karena bentuk body callback iPaymu bisa bervariasi & sulit
// diverifikasi keasliannya dari body mentah, handler ini SENGAJA tidak
// percaya status dari body webhook — begitu dapat trx_id, kita query
// BALIK ke iPaymu (pakai kredensial kita sendiri) buat konfirmasi status
// yang sebenarnya. Ini juga otomatis membuat webhook aman dari payload
// palsu: penyerang cuma bisa memicu pengecekan ulang transaksi yang
// BENERAN ada di iPaymu, bukan memalsukan status "lunas".
//
// Idempotent: kalau payments.status transaksi itu sudah 'paid', request
// berikutnya (retry dari iPaymu, dsb) tidak menulis ulang / toast dobel.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function ipaymuSignature(method: string, va: string, apiKey: string, body: string) {
  const bodyHash = await sha256Hex(body)
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`
  return hmacSha256Hex(apiKey, stringToSign)
}

// Body callback iPaymu bisa form-urlencoded ATAU json tergantung setting
// merchant — coba dua-duanya, dan coba beberapa kemungkinan nama field
// buat trx_id biar tahan kalau iPaymu sedikit beda penamaan.
async function extractTrxId(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type') || ''
  let fields: Record<string, string> = {}
  try {
    if (contentType.includes('application/json')) {
      fields = await req.json()
    } else {
      const text = await req.text()
      fields = Object.fromEntries(new URLSearchParams(text))
    }
  } catch (e) {
    console.error('[ipaymu-webhook] gagal parse body:', e)
    return null
  }
  console.log('[ipaymu-webhook] raw callback body:', JSON.stringify(fields))
  const candidate = fields.trx_id ?? fields.TransactionId ?? fields.transactionId ?? fields.reference_id ?? null
  return candidate ? String(candidate) : null
}

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 })

  try {
    const trxId = await extractTrxId(req)
    if (!trxId) {
      console.error('[ipaymu-webhook] tidak menemukan trx_id di body callback')
      return new Response('ok', { status: 200 }) // tetap 200 biar iPaymu tidak retry terus
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: payment } = await admin.from('payments').select('*').eq('trx_id', trxId).maybeSingle()
    if (!payment) {
      console.error('[ipaymu-webhook] trx_id tidak dikenal di tabel payments:', trxId)
      return new Response('ok', { status: 200 })
    }
    if (payment.status === 'paid') {
      return new Response('ok', { status: 200 }) // sudah diproses, idempotent no-op
    }

    // ── Konfirmasi status LANGSUNG ke iPaymu, jangan percaya body webhook ──
    const va = Deno.env.get('IPAYMU_VA')!
    const apiKey = Deno.env.get('IPAYMU_API_KEY')!
    const mode = Deno.env.get('IPAYMU_MODE') || 'sandbox'
    const baseUrl = mode === 'production'
      ? 'https://my.ipaymu.com/api/v2'
      : 'https://sandbox.ipaymu.com/api/v2'

    const checkBody = JSON.stringify({ transactionId: trxId })
    const signature = await ipaymuSignature('POST', va, apiKey, checkBody)
    const checkRes = await fetch(`${baseUrl}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', va, signature },
      body: checkBody,
    })
    const checkJson = await checkRes.json()
    console.log('[ipaymu-webhook] cek status transaksi:', JSON.stringify(checkJson))

    // ── Parse status iPaymu — sesuaikan di sini kalau bentuknya beda ──
    const statusRaw = checkJson?.Data?.Status ?? checkJson?.Data?.status
    const statusDesc = String(checkJson?.Data?.StatusDesc ?? checkJson?.Data?.statusDesc ?? '').toLowerCase()
    const isPaid = statusRaw === 1 || statusRaw === '1' || statusDesc.includes('berhasil') || statusDesc.includes('success')
    const isFailed = statusRaw === -1 || statusRaw === -2 || statusDesc.includes('gagal') || statusDesc.includes('expired')

    const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : 'pending'

    await admin.from('payments').update({ status: newStatus, raw_payload: checkJson }).eq('trx_id', trxId)

    if (isPaid) {
      await admin.from('profiles').update({ paid_at: new Date().toISOString() }).eq('id', payment.owner_user_id)
      console.log('[ipaymu-webhook] profiles.paid_at diset untuk owner:', payment.owner_user_id)
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('[ipaymu-webhook] error:', e)
    // Tetap 200 supaya iPaymu tidak retry storm — error sudah ke-log buat dicek manual.
    return new Response('ok', { status: 200 })
  }
})
