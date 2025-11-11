import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import {
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";

import { auth, db } from "./firebaseConfig";
import { UserData, Member, Transaction } from "./types";
import { defaultUserData } from "./data";

// --- Gemini API Schema ---
const insightSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Um título curto e chamativo para a dica financeira.",
    },
    description: {
      type: Type.STRING,
      description:
        "Uma descrição de uma frase, explicando a dica de forma simples e direta.",
    },
  },
  required: ["title", "description"],
};

// --- Firebase Safety Check ---
const checkFirebase = () => {
  if (!auth || !db) {
    throw new Error(
      "Firebase não está configurado. Por favor, adicione suas credenciais em firebaseConfig.ts."
    );
  }
};

// --- API Methods ---
const api = {
  /**
   * 🔐 Login com e-mail e senha
   */
  async login(email: string, password: string): Promise<User> {
    checkFirebase();
    const userCredential = await signInWithEmailAndPassword(
      auth!,
      email,
      password
    );
    return userCredential.user;
  },

  /**
   * 🧑‍💻 Registro de novo usuário + criação inicial no Firestore
   */
  async register(
    name: string,
    title: string,
    email: string,
    password: string
  ): Promise<User> {
    checkFirebase();
    const userCredential = await createUserWithEmailAndPassword(
      auth!,
      email,
      password
    );
    const user = userCredential.user;

    const firstMember: Member = {
      id: `m${Date.now()}`,
      name,
      avatar: "😊",
      role: "Administrador",
      title,
    };

    const newUserData: UserData = {
      ...defaultUserData,
      members: [firstMember],
    };

    const userDocRef = doc(db!, "users", user.uid);
    await setDoc(userDocRef, newUserData);

    return user;
  },

  /**
   * 🚪 Logout do Firebase
   */
  async logout(): Promise<void> {
    checkFirebase();
    await signOut(auth!);
  },

  /**
   * 📄 Retorna dados do usuário (perfil, metas, membros, etc.)
   */
  async getUserData(uid: string): Promise<UserData | null> {
    checkFirebase();
    const userDocRef = doc(db!, "users", uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      console.warn(
        "Nenhum dado encontrado no Firestore para UID:",
        uid,
        ". Criando dados padrão..."
      );
      const newUserData: UserData = {
        ...defaultUserData,
        members: [
          {
            id: "m1",
            name: "Eu",
            avatar: "😊",
            role: "Administrador",
            title: "Admin",
          },
        ],
      };
      await this.updateUserData(uid, newUserData);
      return newUserData;
    }
  },

  /**
   * 💾 Atualiza o documento completo do usuário
   */
  async updateUserData(uid: string, data: UserData): Promise<UserData> {
    checkFirebase();
    const userDocRef = doc(db!, "users", uid);
    await setDoc(userDocRef, data);
    return data;
  },

  /**
   * 💸 Busca todas as transações da coleção global filtrando por userId
   */
  async getUserTransactions(uid: string): Promise<Transaction[]> {
    checkFirebase();
    try {

      const userTransactionsRef = collection(db!, "users", uid, "transactions");
      const q = query(
        userTransactionsRef,
        orderBy("date", "desc") 
      );      

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn("Nenhuma transação encontrada para o usuário:", uid);
        return [];
      }

      const transactionData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      console.log("Transações recuperadas:", transactionData);

      return transactionData
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      throw error;
    }
  },

  /**
   * 🤖 Gera insights financeiros com Gemini AI
   */
  async getAIFinancialInsights(
    transactions: Transaction[]
  ): Promise<{ title: string; description: string }[]> {
    if (!process.env.API_KEY) {
      console.error("Gemini API key não encontrada nas variáveis de ambiente.");
      throw new Error("A chave da API da IA não foi configurada.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const simplifiedTransactions = transactions.map(
      ({ description, amount, category }) => ({
        description,
        amount,
        category,
      })
    );

    const prompt = `Você é um consultor financeiro otimista e didático. Analise os seguintes gastos e gere exatamente 3 dicas curtas e práticas para ajudar a família a economizar ou gerenciar melhor o orçamento.
    
    Gastos recentes:
    ${JSON.stringify(simplifiedTransactions, null, 2)}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: insightSchema,
          },
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Erro ao gerar insights da IA:", error);
      throw new Error("Falha ao gerar insights financeiros.");
    }
  },

  async addTransaction(uid: string, transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    checkFirebase();
    try {
      // Referência à subcoleção de transações do usuário
      const transactionsCollectionRef = collection(db!, "users", uid, "transactions");

      // Adiciona o documento. Firestore gerará um ID automaticamente.
      const docRef = await addDoc(transactionsCollectionRef, transactionData);

      console.log('✅ Transação adicionada no Firestore com ID:', docRef.id);

      // Retorna a transação com o ID gerado pelo Firestore
      return {
        id: docRef.id,
        ...transactionData
      } as Transaction;
    } catch (error) {
      console.error("❌ Erro ao adicionar transação no Firestore:", error);
      throw error; // Re-lança o erro para ser tratado no handleAddTransaction
    }
  },

  async updateTransaction(uid: string, transactionId: string, updatedData: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    checkFirebase();
    try {
      const transactionRef = doc(db!, "users", uid, "transactions", transactionId);
      await updateDoc(transactionRef, updatedData);
      console.log(`✅ Transação ${transactionId} atualizada com sucesso no Firestore.`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar transação ${transactionId} no Firestore:`, error);
      throw error;
    }
  },

  async deleteTransaction(uid: string, transactionId: string): Promise<void> {
    checkFirebase();
    try {
      const transactionRef = doc(db!, "users", uid, "transactions", transactionId);
      await deleteDoc(transactionRef);
      console.log(`✅ Transação ${transactionId} deletada com sucesso do Firestore.`);
    } catch (error) {
      console.error(`❌ Erro ao deletar transação ${transactionId} no Firestore:`, error);
      throw error;
    }
  }
};

export default api;
