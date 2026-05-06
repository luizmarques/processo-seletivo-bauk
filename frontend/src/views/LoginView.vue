<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-brand-bg relative overflow-hidden">
    <!-- Abstract background elements -->
    <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-sm relative z-10">
      <div class="text-center mb-8">
        <router-link to="/" class="mb-4 flex items-center justify-center scale-125 hover:opacity-80 transition-opacity">
          <BaukLogo />
        </router-link>
        <p class="text-xs font-medium text-brand-muted mt-1 uppercase tracking-widest">Processo Seletivo Bauk</p>
      </div>

      <AppCard>
        <form @submit.prevent="handleLogin" class="space-y-5">
          <AppInput
            label="ID de Usuário"
            v-model="username"
            placeholder="Digite seu username"
            required
          />
          <AppInput
            label="Senha de Acesso"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
          
          <div v-if="error" class="text-[11px] font-bold text-red-600 bg-red-50 p-3 rounded border border-red-100">
            {{ error }}
          </div>

          <AppButton type="submit" :loading="loading" fullWidth>
            Entrar no Sistema
          </AppButton>
        </form>

        <template #footer>
          <p class="text-xs text-center text-brand-muted font-medium">
            Ainda não tem conta? 
            <router-link to="/register" class="text-brand-primary font-bold hover:underline">Solicitar Acesso</router-link>
          </p>
        </template>
      </AppCard>
      
      <p class="text-center mt-8 text-[10px] font-bold text-brand-muted/40 uppercase tracking-[0.2em]">
        Bauk &copy; 2026 &bull; Secure Financial Operations
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppButton from '../components/AppButton.vue';
import AppInput from '../components/AppInput.vue';
import AppCard from '../components/AppCard.vue';
import BaukLogo from '../components/BaukLogo.vue';
import { getFirstValidationMessage, loginFormSchema } from '../validation/forms';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

async function handleLogin() {
  error.value = '';
  const validation = loginFormSchema.safeParse({
    username: username.value,
    password: password.value,
  });

  if (!validation.success) {
    error.value = getFirstValidationMessage(validation.error);
    return;
  }

  username.value = validation.data.username;
  password.value = validation.data.password;
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Falha na autenticação';
  } finally {
    loading.value = false;
  }
}
</script>
