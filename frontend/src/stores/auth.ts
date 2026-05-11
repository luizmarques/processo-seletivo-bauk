// Store de autenticação – gerencia token, login, registro e logout (RF04, RF14)
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { loginUser, logoutUser, registerUser } from "../services/auth-service";
import type { LoginRequest, RegisterUserRequest } from "../types/auth";
import {
  toFeedbackMessage,
  toJwtToken,
  toUsername,
  type FeedbackMessage,
  type JwtToken,
  type Username,
} from "../types/value-objects";

export const useAuthStore = defineStore("auth", () => {
  const persistedToken = localStorage.getItem("token");
  const persistedUsername = localStorage.getItem("username");
  const token = ref<JwtToken | null>(
    persistedToken ? toJwtToken(persistedToken) : null,
  );
  const username = ref<Username | null>(
    persistedUsername ? toUsername(persistedUsername) : null,
  );
  const logoutLoading = ref(false);
  const router = useRouter();

  const isAuthenticated = computed(() => !!token.value);

  async function login(payload: LoginRequest) {
    const authentication = await loginUser(payload);

    token.value = authentication.accessToken;
    username.value = payload.username;
    localStorage.setItem("token", authentication.accessToken);
    localStorage.setItem("username", payload.username);
  }

  async function register(payload: RegisterUserRequest) {
    await registerUser(payload);
  }

  async function logout() {
    if (logoutLoading.value) {
      return;
    }

    logoutLoading.value = true;
    let message: FeedbackMessage = toFeedbackMessage(
      "Sessão encerrada localmente.",
    );

    try {
      try {
        const response = await logoutUser();
        message = response.message;
      } catch {
        message = toFeedbackMessage(
          "Sessão encerrada localmente. Não foi possível confirmar o logout no servidor.",
        );
      }

      token.value = null;
      username.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      await router.push({
        path: "/login",
        query: { message },
      });
    } finally {
      logoutLoading.value = false;
    }
  }

  return {
    token,
    username,
    isAuthenticated,
    logoutLoading,
    login,
    register,
    logout,
  };
});
