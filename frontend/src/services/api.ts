// Serviço HTTP centralizado – todas as chamadas à API passam por aqui
import axios from "axios";
import { toApiUrl, type ApiUrl } from "../types/value-objects";

function resolveApiUrl(): ApiUrl {
  const apiUrl =
    import.meta.env.VITE_API_URL?.trim() ??
    import.meta.env.API_URL?.trim() ??
    "";

  // Fallback relativo mantém o frontend operável mesmo quando a variável de ambiente não está exposta.
  return toApiUrl(apiUrl.length > 0 ? apiUrl : "http://localhost:3000");
}

const api = axios.create({
  baseURL: resolveApiUrl(),
});

// Interceptor: injeta token JWT em cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
