<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-brand-bg relative overflow-hidden">
    <!-- Abstract background elements -->
    <div class="absolute top-0 left-0 -ml-20 -mt-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-brand-primary opacity-5 rounded-full blur-3xl"></div>

    <div class="w-full max-w-sm relative z-10">
      <div class="text-center mb-8">
        <div class="mb-4 flex items-center justify-center scale-125">
          <BaukLogo />
        </div>
        <p class="text-xs font-medium text-brand-muted mt-1 uppercase tracking-widest">Criação de Conta Bauk</p>
      </div>

      <AppCard>
        <form @submit.prevent="handleRegister" class="space-y-5">
          <AppInput
            label="Escolha seu Username"
            v-model="username"
            placeholder="Mínimo 3 caracteres"
            required
          />
          <AppInput
            label="Defina sua Senha"
            v-model="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
          />
          
          <div v-if="error" class="text-[11px] font-bold text-red-600 bg-red-50 p-3 rounded border border-red-100">
            {{ error }}
          </div>

          <AppButton type="submit" :loading="loading" fullWidth>
            Criar Minha Conta
          </AppButton>
        </form>

        <template #footer>
          <p class="text-xs text-center text-brand-muted font-medium">
            Já possui acesso? 
            <router-link to="/login" class="text-brand-primary font-bold hover:underline">Voltar ao Login</router-link>
          </p>
        </template>
      </AppCard>
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
import { toPassword, toUsername } from '../types/value-objects';
import { getFirstValidationMessage, registerFormSchema } from '../validation/forms';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

async function handleRegister() {
  error.value = '';
  const validation = registerFormSchema.safeParse({
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
    await auth.register({
      username: toUsername(username.value),
      password: toPassword(password.value),
    });
    router.push('/login');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Falha no cadastro';
  } finally {
    loading.value = false;
  }
}
</script>
