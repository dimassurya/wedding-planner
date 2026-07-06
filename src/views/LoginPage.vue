<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#B32E33" stroke="#B32E33" stroke-width="1" stroke-linejoin="round"/>
        </svg>
        <h1>Wedding Planner</h1>
      </div>
      <p class="login-tagline">Rencanakan hari spesialmu dengan tenang — semua tersimpan aman.</p>

      <button class="login-google-btn" :disabled="busy" @click="handleLogin">
        <svg v-if="!busy" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        <span v-if="busy" class="login-spinner"></span>
        {{ busy ? 'Mengarahkan…' : 'Masuk dengan Google' }}
      </button>

      <p class="login-note">
        Gratis untuk mulai. Akses lifetime dengan satu kali pembayaran.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWeddingStore } from '../stores/wedding'

const store = useWeddingStore()
const busy  = ref(false)

async function handleLogin() {
  busy.value = true
  await store.signInWithGoogle()
}
</script>

<style scoped>
.login-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ivory);
  padding: 24px;
}

.login-card {
  background: var(--paper);
  border: 1px solid var(--gold-soft);
  border-top: 3px solid var(--gold);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 44px 40px 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.login-brand h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--plum);
  margin: 0;
}

.login-tagline {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 36px;
}

.login-google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--plum), var(--wine));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(110, 21, 26, .28);
  transition: box-shadow .15s, transform .1s, filter .15s;
}

.login-google-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(110, 21, 26, .34);
}

.login-google-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-google-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.login-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg) } }

.login-note {
  margin: 20px 0 0;
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.5;
}

@media (max-width: 480px) {
  .login-card { padding: 36px 24px 32px; }
}
</style>
