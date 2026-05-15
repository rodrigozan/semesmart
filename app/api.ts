import { UserData, Transaction as TransactionType, Member } from "./types";
import { defaultUserData } from "./data";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = {
  async login(email: string, password: string): Promise<{ uid: string; email: string }> {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao fazer login");
    }
    return res.json();
  },

  async register(
    name: string,
    title: string,
    email: string,
    password: string
  ): Promise<{ uid: string; email: string }> {
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao registrar");
    }
    return res.json();
  },

  async logout(): Promise<void> {
    return;
  },

  async getUserData(uid: string): Promise<UserData | null> {
    const res = await fetch(`${API_URL}/api/user/${uid}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao buscar dados");
    }
    return res.json();
  },

  async updateUserData(uid: string, data: UserData): Promise<UserData> {
    const res = await fetch(`${API_URL}/api/user/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar dados");
    }
    return res.json();
  },

  async getUserTransactions(uid: string): Promise<TransactionType[]> {
    const res = await fetch(`${API_URL}/api/transactions/${uid}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao buscar transações");
    }
    return res.json();
  },

  async getAIFinancialInsights(
    transactions: TransactionType[]
  ): Promise<{ title: string; description: string }[]> {
    const res = await fetch(`${API_URL}/api/ai-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao gerar insights");
    }
    return res.json();
  },

  async addTransaction(
    uid: string,
    transactionData: Omit<TransactionType, "id">
  ): Promise<TransactionType> {
    const res = await fetch(`${API_URL}/api/transactions/${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao adicionar transação");
    }
    return res.json();
  },

  async updateTransaction(
    uid: string,
    transactionId: string,
    updatedData: Partial<Omit<TransactionType, "id">>
  ): Promise<void> {
    const res = await fetch(`${API_URL}/api/transactions/${uid}/${transactionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao atualizar transação");
    }
  },

  async deleteTransaction(uid: string, transactionId: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/transactions/${uid}/${transactionId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao deletar transação");
    }
  },
};

export default api;