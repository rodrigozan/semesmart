import React, { useMemo, useState, useEffect } from 'react';
import { Transaction, Category, Profile, ConsolidatedDashboard } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from './common/Icons';
import EmptyState from './common/EmptyState';
import api from '../api';

interface DashboardProps {
  transactions?: Transaction[];
  onAddTransaction: (type: 'income' | 'expense') => void;
  isOwner?: boolean;
  profiles?: Profile[];
}

const categoryColors: { [key in Category]?: string } = {
  [Category.Mercado]: '#FBBF24',
  [Category.Transporte]: '#60A5FA',
  [Category.Lazer]: '#EC4899',
  [Category.Educacao]: '#A78BFA',
  [Category.Contas]: '#F87171',
  [Category.Saude]: '#34D399',
  [Category.Dizimo]: '#2DD4BF',
  [Category.Investimento]: '#818CF8',
  [Category.IA]: '#A78BFA',
  [Category.Marketing]: '#FB923C',
  [Category.Ferramentas]: '#94A3B8',
  [Category.Outros]: '#9CA3AF',
  [Category.Entrada]: '#52C293',
};

const Dashboard: React.FC<DashboardProps> = ({
  transactions = [],
  onAddTransaction,
  isOwner = false,
  profiles = [],
}) => {
  const [consolidatedMode, setConsolidatedMode] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedDashboard | null>(null);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);

  useEffect(() => {
    if (!consolidatedMode) return;
    const fetchConsolidated = async () => {
      setIsLoadingConsolidated(true);
      try {
        const res = await api.getConsolidatedDashboard();
        setConsolidatedData(res.data);
      } catch (err) {
        console.error('Failed to load consolidated dashboard:', err);
      } finally {
        setIsLoadingConsolidated(false);
      }
    };
    fetchConsolidated();
  }, [consolidatedMode]);

  const { totalIncomes, totalExpenses, balance } = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { totalIncomes: 0, totalExpenses: 0, balance: 0 };
    }

    let currentMonthIncomes = 0;
    let currentMonthExpenses = 0;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      const txMonth = transactionDate.getMonth() + 1;
      const txYear = transactionDate.getFullYear();

      if (txMonth === currentMonth && txYear === currentYear) {
        if (t.type === 'income') {
          currentMonthIncomes += t.amount;
        } else {
          currentMonthExpenses += Math.abs(t.amount);
        }
      }
    });

    return {
      totalIncomes: currentMonthIncomes,
      totalExpenses: currentMonthExpenses,
      balance: currentMonthIncomes - currentMonthExpenses,
    };
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const categoryMap: { [key: string]: number } = {};
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      })
      .forEach(t => {
        const cat = t.category || 'Outros';
        categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
      });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const consolidatedExpensesByCategory = useMemo(() => {
    if (!consolidatedData) return [];
    const map: Record<string, number> = {};
    consolidatedData.byCategory.forEach(cat => {
      map[cat.name] = (map[cat.name] || 0) + Math.abs(cat.value);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedData]);

  const showToggle = isOwner && profiles.length > 1;

  if (consolidatedMode) {
    if (isLoadingConsolidated) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="animate-pulse text-gray-500">Carregando...</p>
        </div>
      );
    }

    const data = consolidatedData || {
      totalIncomes: 0,
      totalExpenses: 0,
      balance: 0,
      byProfile: [],
      byCategory: [],
    };

    const displayBalance = data.totalIncomes - data.totalExpenses;

    return (
      <div className="space-y-6">
        {showToggle && (
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-full p-1 flex gap-1">
              <button
                onClick={() => setConsolidatedMode(false)}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-gray-800 shadow-sm transition-colors"
              >
                Perfil Atual
              </button>
              <button
                onClick={() => setConsolidatedMode(true)}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#3B82F6] text-white transition-colors"
              >
                Consolidado
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 p-4 rounded-xl">
            <p className="text-xs text-emerald-700">Receitas</p>
            <p className="text-lg font-bold text-emerald-900">
              {data.totalIncomes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl">
            <p className="text-xs text-red-700">Despesas</p>
            <p className="text-lg font-bold text-red-900">
              {Math.abs(data.totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-xs text-blue-700">Saldo</p>
            <p className="text-lg font-bold text-blue-900">
              {displayBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center pt-2">
          <button
            onClick={() => onAddTransaction('income')}
            className="flex items-center justify-center gap-2 py-3 bg-[#52C293] text-white font-semibold rounded-xl shadow-md hover:bg-green-600 transition-colors"
          >
            <ArrowUpIcon /> Entrada
          </button>
          <button
            onClick={() => onAddTransaction('expense')}
            className="flex items-center justify-center gap-2 py-3 bg-red-400 text-white font-semibold rounded-xl shadow-md hover:bg-red-500 transition-colors"
          >
            <ArrowDownIcon /> Gasto
          </button>
        </div>

        {data.byProfile.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700">Comparativo por Perfil</h2>
            <div className="space-y-3">
              {data.byProfile.map(p => (
                <div key={p.profileId} className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.profileColor }} />
                    <h3 className="font-semibold text-gray-800">{p.profileName}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-emerald-600 text-xs">Receitas</p>
                      <p className="font-medium">{p.incomes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div>
                      <p className="text-red-600 text-xs">Despesas</p>
                      <p className="font-medium">{Math.abs(p.expenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs">Saldo</p>
                      <p className="font-medium">{(p.incomes - p.expenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {consolidatedExpensesByCategory.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-700">Gastos por Categoria (todos os perfis)</h2>
            <div className="w-full h-56 bg-white p-2 rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={consolidatedExpensesByCategory.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
                    formatter={(value: number) => [
                      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                      'Total',
                    ]}
                  />
                  <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                    {consolidatedExpensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={categoryColors[entry.name as Category] || '#8884d8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.byProfile.length === 0 && consolidatedExpensesByCategory.length === 0 && (
          <EmptyState
            icon="📊"
            title="Nenhum dado consolidado"
            description="Adicione transações em seus perfis para ver o resumo consolidado."
          />
        )}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center">
        {showToggle && (
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-full p-1 flex gap-1">
              <button
                onClick={() => setConsolidatedMode(false)}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-gray-800 shadow-sm transition-colors"
              >
                Perfil Atual
              </button>
              <button
                onClick={() => setConsolidatedMode(true)}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 transition-colors"
              >
                Consolidado
              </button>
            </div>
          </div>
        )}
        <EmptyState
          icon="💸"
          title="Nenhuma transação encontrada"
          description="Adicione um gasto ou receita para começar."
        />
        <div className="grid grid-cols-2 gap-4 text-center mt-8">
          <button
            onClick={() => onAddTransaction('income')}
            className="flex items-center justify-center gap-2 py-3 bg-[#52C293] text-white font-semibold rounded-xl shadow-md hover:bg-green-600 transition-colors"
          >
            <ArrowUpIcon /> Adicionar Entrada
          </button>
          <button
            onClick={() => onAddTransaction('expense')}
            className="flex items-center justify-center gap-2 py-3 bg-red-400 text-white font-semibold rounded-xl shadow-md hover:bg-red-500 transition-colors"
          >
            <ArrowDownIcon /> Adicionar Gasto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showToggle && (
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setConsolidatedMode(false)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-gray-800 shadow-sm transition-colors"
            >
              Perfil Atual
            </button>
            <button
              onClick={() => setConsolidatedMode(true)}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 transition-colors"
            >
              Consolidado
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-xl">
          <p className="text-sm text-emerald-700">Saldo do mês</p>
          <p className="text-2xl font-bold text-emerald-900">
            {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl">
          <p className="text-sm text-red-700">Gastos este mês</p>
          <p className="text-2xl font-bold text-red-900">
            {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center pt-2">
        <button
          onClick={() => onAddTransaction('income')}
          className="flex items-center justify-center gap-2 py-3 bg-[#52C293] text-white font-semibold rounded-xl shadow-md hover:bg-green-600 transition-colors"
        >
          <ArrowUpIcon /> Entrada
        </button>
        <button
          onClick={() => onAddTransaction('expense')}
          className="flex items-center justify-center gap-2 py-3 bg-red-400 text-white font-semibold rounded-xl shadow-md hover:bg-red-500 transition-colors"
        >
          <ArrowDownIcon /> Gasto
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-700">Gastos por Categoria (mês)</h2>
        <div className="w-full h-56 bg-white p-2 rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={expensesByCategory.slice(0, 5)}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }}
                formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Total',
                ]}
              />
              <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]}>
                {expensesByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[entry.name as Category] || '#8884d8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
