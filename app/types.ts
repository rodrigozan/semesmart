export enum Category {
  Mercado = 'Mercado',
  Transporte = 'Transporte',
  Lazer = 'Lazer',
  Educacao = 'Educação',
  Contas = 'Contas',
  Saude = 'Saúde',
  Dizimo = 'Dízimo',
  Outros = 'Outros',
  Entrada = 'Entrada',
}

export enum PaymentMethod {
  Debito = 'Cartão de Débito',
  CreditoAVista = 'Crédito à Vista',
  CreditoParcelado = 'Crédito Parcelado',
  Dinheiro = 'Dinheiro',
  Beneficio = 'Cartão Benefício',
  PIX = 'PIX',
  VR = 'Vale Refeição',
  Boleto = 'Boleto via App',
  TED = 'TED',  
}

export type MemberRole = 'Administrador' | 'Cônjuge' | 'Membro';

export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  title: string;
  email?: string; 
  incomeSource?: string;
}

export interface FamilyProfile {
  name: string;
  avatar?: string;
  createdAt: Date | string;
}

export interface Transaction {
  id: string; // ID gerado pelo Firestore
  userId: string; // ID do usuário proprietário
  description: string;
  amount: number; // Valor (negativo para despesas, positivo para receitas)
  date: string; // Data da transação (ISO string)
  createdAt: string; // Timestamp de criação no app (ISO string)

  // Campos para otimização de consulta e categorização:
  month: number; // Mês da transação (1-12)
  year: number; // Ano da transação
  category?: Category; // Apenas para despesas. Para receitas, este campo pode não existir.
  paymentMethod?: PaymentMethod; // Apenas para despesas
  location?: string; // Para o nome do estabelecimento/local (usado para despesas, por exemplo)
  incomeSource?: string; // Apenas para receitas
  source?: string; // Como a transação foi adicionada (ex: 'manual', 'import')
  type: 'income' | 'expense'; // ESSENCIAL: O tipo da transação

  // Campos de Membro
  memberId: string;
  memberName: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  illustration: string;
  deadline?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'active' | 'completed';
}

export interface Card {
  id: string;
  name: string;
  last4: string;
  issuer: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
}
// Fix: Added UserData interface to be used in App.tsx.
export interface UserData {
  familyProfile: FamilyProfile;
  transactions: Transaction[];
  members: Member[];
  goals: Goal[];
  challenges: Challenge[];
  cards: Card[];
  hasSeenOnboarding?: boolean;
}

// Fix: Added UserCredentials interface to be used in Auth.tsx.
export interface UserCredentials {
  [key: string]: string;
}
