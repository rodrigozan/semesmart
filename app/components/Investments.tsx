import React, { useState, useEffect, useMemo } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import api from '../api';
import type { Investment } from '../types';
import EmptyState from './common/EmptyState';
import InvestmentFormModal from './modals/InvestmentFormModal';

const typeLabels: Record<string, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  fixed_income: 'Renda Fixa',
  crypto: 'Cripto',
  other: 'Outros',
};

const typeColors: Record<string, string> = {
  stock: 'bg-blue-100 text-blue-800',
  fii: 'bg-green-100 text-green-800',
  fixed_income: 'bg-purple-100 text-purple-800',
  crypto: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

const Investments: React.FC = () => {
  const { activeProfile } = useProfile();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(null);

  const fetchInvestments = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const res = await api.getInvestments(activeProfile.id);
      setInvestments(res.data || []);
    } catch (err) {
      console.error('Failed to load investments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [activeProfile]);

  const summary = useMemo(() => {
    if (!investments.length) return null;
    const totalInvested = investments.reduce((acc, inv) => acc + inv.averagePrice * inv.quantity, 0);
    const totalCurrent = investments.reduce((acc, inv) => acc + inv.currentPrice * inv.quantity, 0);
    const profitability = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

    const byType: Record<string, { invested: number; current: number }> = {};
    investments.forEach((inv) => {
      if (!byType[inv.type]) byType[inv.type] = { invested: 0, current: 0 };
      byType[inv.type].invested += inv.averagePrice * inv.quantity;
      byType[inv.type].current += inv.currentPrice * inv.quantity;
    });

    return { totalInvested, totalCurrent, profitability, byType };
  }, [investments]);

  const handleAdd = () => {
    setInvestmentToEdit(null);
    setModalOpen(true);
  };

  const handleEdit = (inv: Investment) => {
    setInvestmentToEdit(inv);
    setModalOpen(true);
  };

  const handleDelete = async (invId: string) => {
    if (!activeProfile) return;
    if (!window.confirm('Tem certeza que deseja excluir este investimento?')) return;
    try {
      await api.deleteInvestment(activeProfile.id, invId);
      setInvestments((prev) => prev.filter((i) => i.id !== invId));
    } catch (err) {
      console.error('Failed to delete investment:', err);
    }
  };

  const handleSubmit = async (data: Omit<Investment, 'id' | 'profile' | 'createdBy'>, invId?: string) => {
    if (!activeProfile) return;
    try {
      if (invId) {
        const res = await api.updateInvestment(activeProfile.id, invId, data);
        setInvestments(prev => prev.map(i => i.id === invId ? res.data : i));
      } else {
        const res = await api.addInvestment(activeProfile.id, data);
        setInvestments(prev => [...prev, res.data]);
      }
      setModalOpen(false);
      setInvestmentToEdit(null);
    } catch (err) {
      console.error('Failed to save investment:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="animate-pulse text-gray-500">Carregando investimentos...</p>
      </div>
    );
  }

  if (!investments.length) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Investimentos</h2>
          <p className="text-gray-500">Acompanhe sua carteira de investimentos</p>
        </div>
        <EmptyState
          icon="📈"
          title="Nenhum investimento cadastrado"
          description="Adicione seus ativos para acompanhar o desempenho da sua carteira."
        />
        <button
          onClick={handleAdd}
          className="w-full py-3 bg-[#3B82F6] text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Adicionar investimento +
        </button>
        {isModalOpen && (
          <InvestmentFormModal
            onClose={() => { setModalOpen(false); setInvestmentToEdit(null); }}
            onSubmit={handleSubmit}
            investmentToEdit={investmentToEdit}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Investimentos</h2>
        <p className="text-gray-500">Acompanhe sua carteira de investimentos</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-700">Total Investido</p>
            <p className="text-xl font-bold text-blue-900">
              {summary.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl">
            <p className="text-sm text-emerald-700">Valor Atual</p>
            <p className="text-xl font-bold text-emerald-900">
              {summary.totalCurrent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className={`col-span-2 p-4 rounded-xl ${summary.profitability >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className="text-sm text-gray-700">Rentabilidade Total</p>
            <p className={`text-2xl font-bold ${summary.profitability >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {summary.profitability >= 0 ? '+' : ''}{summary.profitability.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {summary && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Distribuição por Tipo</h3>
          <div className="space-y-2">
            {(Object.entries(summary.byType) as [string, { invested: number; current: number }][]).map(([type, val]) => {
              const pct = summary.totalInvested > 0 ? (val.invested / summary.totalInvested) * 100 : 0;
              return (
                <div key={type} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
                      {typeLabels[type] || type}
                    </span>
                    <span className="text-sm text-gray-500">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {val.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Carteira</h3>
        <div className="space-y-3">
          {investments.map((inv) => {
            const variation = inv.averagePrice > 0 ? ((inv.currentPrice - inv.averagePrice) / inv.averagePrice) * 100 : 0;
            return (
              <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${typeColors[inv.type] || ''}`}>
                      {typeLabels[inv.type] || inv.type}
                    </span>
                    <span className="font-bold text-gray-800">{inv.ticker}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(inv)}
                      className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Qtd</p>
                    <p className="font-semibold text-gray-800">{inv.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">P.Médio</p>
                    <p className="font-semibold text-gray-800">{inv.averagePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Atual</p>
                    <p className="font-semibold text-gray-800">{inv.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-sm font-semibold ${variation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {variation >= 0 ? '+' : ''}{variation.toFixed(2)}%
                  </span>
                  <div className="flex-grow bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${variation >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(variation), 100)}%` }}
                    />
                  </div>
                </div>
                {inv.broker && (
                  <p className="text-xs text-gray-400 mt-1">Corretora: {inv.broker}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-3 bg-[#3B82F6] text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
      >
        Adicionar investimento +
      </button>

      {isModalOpen && (
        <InvestmentFormModal
          onClose={() => { setModalOpen(false); setInvestmentToEdit(null); }}
          onSubmit={handleSubmit}
          investmentToEdit={investmentToEdit}
        />
      )}
    </div>
  );
};

export default Investments;
