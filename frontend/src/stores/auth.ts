// Store de autenticação – gerencia token, login, registro e logout (RF04, RF14)
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser, registerUser } from '../services/auth-service';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const username = ref<string | null>(localStorage.getItem('username'));
  const router = useRouter();

  const isAuthenticated = computed(() => !!token.value);

  async function login(usernameValue: string, password: string) {
    const authentication = await loginUser({
      username: usernameValue,
      password,
    });

    token.value = authentication.accessToken;
    username.value = usernameValue;
    localStorage.setItem('token', authentication.accessToken);
    localStorage.setItem('username', usernameValue);
  }

  async function register(usernameValue: string, password: string) {
    await registerUser({
      username: usernameValue,
      password,
    });
  }

  function logout() {
    token.value = null;
    username.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  }

  return { token, username, isAuthenticated, login, register, logout };
});
