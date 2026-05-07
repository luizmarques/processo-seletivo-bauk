<template>
  <div class="min-h-screen flex flex-col font-inter">
    <!-- Navbar -->
    <nav class="bg-white border-b border-brand-border sticky top-0 z-30">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"
      >
        <div class="flex items-center gap-4 sm:gap-8">
          <router-link
            to="/dashboard"
            class="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <BaukLogo class="h-6 sm:h-8" />
          </router-link>
          <div class="hidden sm:flex items-center gap-6">
            <router-link
              to="/dashboard"
              class="text-sm font-semibold text-brand-primary border-b-2 border-brand-primary pb-5 mt-5"
              >Dashboard</router-link
            >
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <div class="flex flex-col items-end">
            <span
              class="text-[9px] sm:text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-none"
              >Acesso de</span
            >
            <span class="text-xs sm:text-sm font-bold text-brand-primary">{{
              auth.username
            }}</span>
          </div>
          <div class="h-6 sm:h-8 w-px bg-brand-border mx-1 sm:mx-2"></div>
          <AppButton
            @click="handleLogout"
            variant="outline"
            :loading="auth.logoutLoading"
            :disabled="auth.logoutLoading"
            class="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs"
          >
            Sair
          </AppButton>
        </div>
      </div>
    </nav>

    <main
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6"
    >
      <!-- Balance & Quick Action -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Balance Card -->
        <AppCard
          class="lg:col-span-1 bg-brand-primary text-white !border-none shadow-xl relative overflow-hidden group"
        >
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-white/10 rounded-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3.5 h-3.5 text-brand-secondary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <h3
                  class="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em]"
                >
                  Saldo Disponível
                </h3>
              </div>
              <button
                type="button"
                @click="showBalance = !showBalance"
                :aria-pressed="showBalance"
                aria-label="Mostrar ou ocultar saldo"
                class="text-brand-deep hover:text-brand-primary transition-colors p-1.5 bg-brand-bg rounded-full hover:bg-brand-secondary/40"
              >
                <svg
                  v-if="showBalance"
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9.88 9.88 2 2" />
                  <path d="M17.357 17.357 22 22" />
                  <path d="M2 12s3-7 10-7a9.77 9.77 0 0 1 5.036 1.417" />
                  <path
                    d="M12 17c-3.666 0-7-4-7-4a9.77 9.77 0 0 1 1.517-2.143"
                  />
                  <path
                    d="m18 18.062s-3.333 3.938-10 3.938c-.333 0-.667 0-1-.062"
                  />
                  <path d="M12 5c4 0 7 2 9 5a9.77 9.77 0 0 1 1 1" />
                  <path d="M12 12c-1.1 0-2-.9-2-2" />
                  <path
                    d="M14.293 14.293c-.42.42-1.02.707-1.707.707a2.5 2.5 0 0 1-2.5-2.5c0-.687.287-1.287.707-1.707"
                  />
                </svg>
              </button>
            </div>
          </template>

          <div v-if="balanceLoading" class="py-4 space-y-5">
            <AppSkeleton height="2.75rem" width="12rem" />
            <div class="flex items-center justify-between">
              <AppSkeleton height="0.75rem" width="5.5rem" />
              <AppSkeleton height="0.75rem" width="7rem" />
            </div>
          </div>
          <div v-else class="py-4">
            <div class="flex items-baseline gap-1.5">
              <span
                class="text-brand-secondary/80 text-sm font-bold font-montserrat"
                >R$</span
              >
              <span
                class="text-3xl sm:text-4xl font-extrabold font-montserrat tracking-tight transition-all duration-300"
                :class="{ 'select-none opacity-40': !showBalance }"
              >
                {{ showBalance ? formattedBalance : "......" }}
              </span>
            </div>
            <div class="mt-6 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <div
                  class="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.6)]"
                ></div>
                <span
                  class="text-[10px] text-brand-secondary/60 font-bold uppercase tracking-wider"
                  >Conta Ativa</span
                >
              </div>
              <span
                class="text-[10px] text-brand-secondary/40 font-medium italic"
                >Bauk Secure Node</span
              >
            </div>
          </div>
        </AppCard>

        <!-- Quick Transfer -->
        <AppCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-brand-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <h3
                class="text-sm font-bold text-brand-primary uppercase tracking-widest"
              >
                Transferência Instantânea
              </h3>
            </div>
          </template>
          <form
            @submit.prevent="handleTransfer"
            class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
          >
            <div class="md:col-span-5">
              <AppInput
                label="Destinatário"
                v-model="transferRequestForm.recipientUsername"
                placeholder="Ex: joao_silva"
                required
              />
            </div>
            <div class="md:col-span-4">
              <AppInput
                label="Valor do Envio"
                v-model.number="transferRequestForm.transferAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              >
                <template #suffix>R$</template>
              </AppInput>
            </div>
            <div class="md:col-span-3">
              <AppButton type="submit" :loading="transferLoading" fullWidth>
                Confirmar
              </AppButton>
            </div>
          </form>
          <div v-if="transferError || transferSuccess" class="mt-4">
            <div
              v-if="transferError"
              class="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100 font-medium"
            >
              {{ transferError }}
            </div>
            <div
              v-if="transferSuccess"
              class="text-xs text-emerald-600 bg-emerald-50 p-2.5 rounded border border-emerald-100 font-medium"
            >
              {{ transferSuccess }}
            </div>
          </div>
        </AppCard>
      </div>

      <!-- History -->
      <AppCard noPadding class="overflow-hidden">
        <template #header>
          <div
            class="flex flex-row items-center justify-between gap-4 w-full flex-wrap xl:flex-nowrap"
          >
            <h3
              class="text-sm font-bold text-brand-primary uppercase tracking-widest shrink-0"
            >
              Histórico de Movimentações
            </h3>

            <div class="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3">
              <!-- Date Range - Separated with Validation -->
              <div class="flex items-center gap-2 w-full xs:w-auto">
                <span
                  class="text-[10px] font-bold text-brand-muted uppercase tracking-wider w-6 xs:w-auto"
                  >De:</span
                >
                <div
                  class="bg-brand-bg px-2 sm:px-3 py-1.5 rounded-md border border-brand-border focus-within:ring-1 focus-within:ring-brand-primary transition-all flex-1 xs:flex-none"
                >
                  <input
                    v-model="transactionFilters.startDate"
                    type="date"
                    :max="transactionFilters.endDate || today"
                    class="bg-transparent border-none text-[10px] sm:text-[11px] font-bold text-brand-primary focus:ring-0 p-0 w-full xs:w-auto"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2 w-full xs:w-auto">
                <span
                  class="text-[10px] font-bold text-brand-muted uppercase tracking-wider w-6 xs:w-auto"
                  >Até:</span
                >
                <div
                  class="bg-brand-bg px-2 sm:px-3 py-1.5 rounded-md border border-brand-border focus-within:ring-1 focus-within:ring-brand-primary transition-all flex-1 xs:flex-none"
                >
                  <input
                    v-model="transactionFilters.endDate"
                    type="date"
                    :min="transactionFilters.startDate"
                    :max="today"
                    class="bg-transparent border-none text-[10px] sm:text-[11px] font-bold text-brand-primary focus:ring-0 p-0 w-full xs:w-auto"
                  />
                </div>
              </div>

              <div class="h-4 w-px bg-brand-border mx-1 hidden xl:block"></div>

              <div class="flex items-center gap-2 flex-1 xs:flex-none">
                <span
                  class="text-[10px] font-bold text-brand-muted uppercase tracking-wider"
                  >Tipo:</span
                >
                <select
                  v-model="transactionFilters.type"
                  class="bg-brand-bg border border-brand-border rounded-md text-[10px] sm:text-[11px] font-bold text-brand-primary px-2 sm:px-3 py-1.5 focus:ring-1 focus:ring-brand-primary flex-1"
                >
                  <option value="">Todos</option>
                  <option value="cash-in">Entradas</option>
                  <option value="cash-out">Saídas</option>
                </select>
              </div>

              <div class="flex items-center gap-2 flex-1 xs:flex-none">
                <span
                  class="text-[10px] font-bold text-brand-muted uppercase tracking-wider"
                  >Ordem:</span
                >
                <select
                  v-model="transactionFilters.order"
                  class="bg-brand-bg border border-brand-border rounded-md text-[10px] sm:text-[11px] font-bold text-brand-primary px-2 sm:px-3 py-1.5 focus:ring-1 focus:ring-brand-primary flex-1"
                >
                  <option value="DESC">Recentes</option>
                  <option value="ASC">Antigas</option>
                </select>
              </div>

              <AppButton
                @click="fetchTransactionHistory(1)"
                variant="primary"
                :loading="transactionsLoading"
                :disabled="transactionsLoading"
                class="!py-1.5 px-3 sm:px-4 text-[10px] sm:text-[11px] w-full xs:w-auto lg:ml-auto"
              >
                Atualizar
              </AppButton>
            </div>
          </div>
        </template>

        <div
          class="overflow-x-auto scrollbar-thin scrollbar-thumb-brand-border"
        >
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead v-once class="sticky top-0 z-10 bg-white">
              <tr class="bg-brand-bg/50 border-b border-brand-border">
                <th
                  class="py-4 px-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted whitespace-nowrap"
                >
                  Fluxo
                </th>
                <th
                  class="py-4 px-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted whitespace-nowrap"
                >
                  Conta Relacionada
                </th>
                <th
                  class="py-4 px-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted text-right whitespace-nowrap"
                >
                  Valor Bruto
                </th>
                <th
                  class="py-4 px-4 sm:px-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted text-right whitespace-nowrap"
                >
                  Data do Registro
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-border">
              <tr
                v-for="index in transactionsLoading ? skeletonRows : []"
                :key="`skeleton-${index}`"
                class="animate-pulse"
              >
                <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                  <AppSkeleton height="1.5rem" width="5.5rem" />
                </td>
                <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                  <AppSkeleton height="1rem" width="8rem" />
                </td>
                <td class="py-4 px-4 sm:px-6">
                  <div class="flex justify-end">
                    <AppSkeleton height="1rem" width="6rem" />
                  </div>
                </td>
                <td class="py-4 px-4 sm:px-6">
                  <div class="flex justify-end">
                    <AppSkeleton height="1rem" width="7rem" />
                  </div>
                </td>
              </tr>
              <tr v-if="!transactionsLoading && transactionHistory.length === 0">
                <td
                  colspan="4"
                  class="py-12 text-center text-sm text-brand-muted italic"
                >
                  Nenhum registro encontrado para os critérios aplicados.
                </td>
              </tr>
              <tr
                v-for="transaction in transactionHistory"
                :key="transaction.id"
                class="hover:bg-brand-bg/30 transition-colors"
              >
                <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <span
                      :class="
                        isCashInTransaction(transaction)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      "
                      class="badge"
                    >
                      {{ isCashInTransaction(transaction) ? "Cash-in" : "Cash-out" }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4 sm:px-6 whitespace-nowrap">
                  <span class="text-xs font-bold text-brand-primary">
                    {{ getRelatedAccountIdentifier(transaction) }}
                  </span>
                </td>
                <td class="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                  <span
                    :class="isCashInTransaction(transaction) ? 'text-emerald-600' : 'text-red-600'"
                    class="text-sm font-bold"
                  >
                    {{ isCashInTransaction(transaction) ? "+" : "-" }} R$
                    {{ formatMoney(transaction.value) }}
                  </span>
                </td>
                <td class="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                  <span class="text-[11px] font-medium text-brand-muted">
                    {{ formatDate(transaction.createdAt) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template #footer>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              class="text-[10px] sm:text-[11px] font-bold text-brand-muted uppercase tracking-wider text-center sm:text-left"
            >
              Página {{ currentPage }} de {{ totalPages || 1 }} ({{
                totalItems
              }}
              registros)
            </span>
            <div class="flex items-center gap-1">
              <AppButton
                variant="outline"
                class="!py-1 px-2 sm:px-3 text-[10px]"
                :disabled="transactionsLoading || currentPage === 1"
                @click="fetchTransactionHistory(currentPage - 1)"
              >
                <span class="hidden xs:inline">Anterior</span>
                <span class="xs:hidden">&lt;</span>
              </AppButton>
              <div class="flex items-center gap-1 mx-1 sm:mx-2">
                <button
                  v-for="p in visiblePages"
                  :key="p"
                  @click="fetchTransactionHistory(p)"
                  :disabled="transactionsLoading"
                  :class="
                    currentPage === p
                      ? 'bg-brand-primary text-white'
                      : 'hover:bg-brand-secondary text-brand-primary'
                  "
                  class="w-6 h-6 sm:w-7 sm:h-7 rounded text-[10px] font-bold transition-all"
                >
                  {{ p }}
                </button>
              </div>
              <AppButton
                variant="outline"
                class="!py-1 px-2 sm:px-3 text-[10px]"
                :disabled="transactionsLoading || currentPage >= totalPages"
                @click="fetchTransactionHistory(currentPage + 1)"
              >
                <span class="hidden xs:inline">Próxima</span>
                <span class="xs:hidden">&gt;</span>
              </AppButton>
            </div>
          </div>
        </template>
      </AppCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, shallowReactive, onMounted, computed, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { createWalletTransfer, fetchWalletBalance, fetchWalletTransactions } from "../services/wallet-service";
import { buildTransferIdempotencyKey } from "../services/idempotency";
import { formatMoneyForDisplay, normalizeMoneyInput } from "../services/money";
import AppButton from "../components/AppButton.vue";
import AppInput from "../components/AppInput.vue";
import AppCard from "../components/AppCard.vue";
import AppSkeleton from "../components/AppSkeleton.vue";
import BaukLogo from "../components/BaukLogo.vue";
import type { TransactionFilters, TransactionOrder, TransactionType, WalletTransaction } from "../types/wallet";
import { toISODateString, toMoneyAmount, toPageNumber, toPageSize, toUsername, type ISODateString, type MoneyAmount } from "../types/value-objects";
import { getFirstValidationMessage, transferFormSchema } from "../validation/forms";

const auth = useAuthStore();
const currentBalance = ref<MoneyAmount>(toMoneyAmount("0.00"));
const balanceLoading = ref(false);
const showBalance = ref(true);
const transactionHistory = shallowRef<WalletTransaction[]>([]);
const transactionsLoading = ref(false);
const totalItems = ref(0);
const currentPage = ref(1);
const itemsPerPage = 5;

const transferRequestForm = shallowReactive({ recipientUsername: "", transferAmount: 0 });
const transferError = ref("");
const transferSuccess = ref("");
const transferLoading = ref(false);

const transactionFilters = shallowReactive<{
  startDate: string;
  endDate: string;
  type: '' | TransactionType;
  order: TransactionOrder;
}>({
  startDate: "",
  endDate: "",
  type: "",
  order: "DESC",
});
const today = new Date().toISOString().split("T")[0];

// Reidratação dinâmica a cada clique/mudança nos filtros
watch(
  transactionFilters,
  () => {
    void fetchTransactionHistory(1);
  },
  { deep: true },
);

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage));
const formattedBalance = computed(() => formatMoneyForDisplay(currentBalance.value));
const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

async function fetchBalance() {
  balanceLoading.value = true;
  try {
    const walletBalance = await fetchWalletBalance();
    currentBalance.value = walletBalance.balance;
  } finally {
    balanceLoading.value = false;
  }
}

async function fetchTransactionHistory(page = 1) {
  currentPage.value = page;
  const filters: TransactionFilters = {
    page: toPageNumber(currentPage.value),
    limit: toPageSize(itemsPerPage),
    order: transactionFilters.order,
  };

  if (transactionFilters.startDate) filters.startDate = toISODateString(transactionFilters.startDate);
  if (transactionFilters.endDate) filters.endDate = toISODateString(transactionFilters.endDate);
  if (transactionFilters.type) filters.type = transactionFilters.type;

  // A lista vem da API e eh sempre substituida em bloco, entao proxy profundo
  // em cada linha nao agrega valor para a tabela.
  transactionsLoading.value = true;
  try {
    const transactionsPage = await fetchWalletTransactions(filters);
    transactionHistory.value = transactionsPage.data;
    totalItems.value = transactionsPage.meta.total;
  } catch (err) {
    console.error("Falha ao buscar transações:", err);
  } finally {
    transactionsLoading.value = false;
  }
}

async function handleTransfer() {
  transferError.value = "";
  transferSuccess.value = "";
  const validation = transferFormSchema.safeParse({
    recipientUsername: transferRequestForm.recipientUsername,
    transferAmount: transferRequestForm.transferAmount,
    currentUsername: auth.username ?? undefined,
  });

  if (!validation.success) {
    transferError.value = getFirstValidationMessage(validation.error);
    return;
  }

  transferLoading.value = true;
  const normalizedTransferValue = normalizeMoneyInput(String(validation.data.transferAmount));

  try {
    await createWalletTransfer({
      idempotencyKey: buildTransferIdempotencyKey({
        senderUsername: auth.username ?? toUsername(""),
        recipientUsername: toUsername(validation.data.recipientUsername),
        value: normalizedTransferValue,
        time: import.meta.env.IDEMPOTENCY_TIME_SECONDS,
      }),
      username: toUsername(validation.data.recipientUsername),
      value: normalizedTransferValue,
    });
    transferSuccess.value = `Sucesso! R$ ${formatMoneyForDisplay(validation.data.transferAmount)} enviados.`;
    transferRequestForm.recipientUsername = "";
    transferRequestForm.transferAmount = 0;
    await fetchBalance();
    await fetchTransactionHistory(1);
  } catch (err: any) {
    transferError.value = err.response?.data?.message || "Falha na operação";
  } finally {
    transferLoading.value = false;
  }
}

async function handleLogout() {
  await auth.logout();
}

function isCashInTransaction(transaction: WalletTransaction): boolean {
  return transaction.type === "cash-in";
}

function getRelatedAccountIdentifier(transaction: WalletTransaction): string {
  return isCashInTransaction(transaction) ? transaction.debitedUsername : transaction.creditedUsername;
}

function formatMoney(value: MoneyAmount | number): string {
  return formatMoneyForDisplay(value);
}

function formatDate(date: ISODateString): string {
  const d = new Date(date);
  return (
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

onMounted(async () => {
  await Promise.all([fetchBalance(), fetchTransactionHistory(1)]);
});
</script>
