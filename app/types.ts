export enum Category {
  Mercado = 'Mercado',
  Transporte = 'Transporte',
  Lazer = 'Lazer',
  Educacao = 'Educação',
  Contas = 'Contas',
  Saude = 'Saúde',
  Dizimo = 'Dízimo',
  Investimento = 'Investimento',
  IA = 'IA & Tecnologia',
  Marketing = 'Marketing',
  Ferramentas = 'Ferramentas',
  Outros = 'Outros',
  Entrada = 'Entrada',
}

export enum PaymentMethod {
  Debito = 'Cartão de Débito',
  CreditoAVista = 'Crédito à Vista',
  CreditoParcelado = 'Crédito Parcelado',
  Dinheiro = 'Dinheiro',
  PIX = 'PIX',
  VR = 'Vale Refeição',
  Boleto = 'Boleto',
  TED = 'TED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'member';
  profiles: Profile[];
}

export interface Profile {
  id: string;
  name: string;
  slug: string;
  owner: string;
  members: ProfileMember[];
  avatar?: string;
  color: string;
}

export interface ProfileMember {
  user: string;
  canWrite: boolean;
}

export interface Transaction {
  id: string;
  profile: string;
  createdBy: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: Category;
  paymentMethod?: PaymentMethod;
  date: string;
  month: number;
  year: number;
  location?: string;
  incomeSource?: string;
  tags?: string[];
  source: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  profile: string;
  createdBy: string;
  type: 'stock' | 'fii' | 'fixed_income' | 'crypto' | 'other';
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector?: string;
  broker?: string;
  purchaseDate: string;
  notes?: string;
}

export interface Goal {
  id: string;
  profile: string;
  createdBy: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  illustration: string;
  status: 'active' | 'completed' | 'paused';
}

export interface ConsolidatedProfile {
  profileId: string;
  profileName: string;
  profileColor: string;
  incomes: number;
  expenses: number;
  balance: number;
}

export interface ConsolidatedCategory {
  name: string;
  value: number;
  profileId: string;
}

export interface ConsolidatedDashboard {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  byProfile: ConsolidatedProfile[];
  byCategory: ConsolidatedCategory[];
}
