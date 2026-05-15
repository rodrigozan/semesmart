import React, { useState, useEffect } from 'react';
import api from '../api';
import type { ConsolidatedDashboard } from '../types';

interface Props {
  onBack: () => void;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ConsolidatedView: React.FC<Props> = ({ onBack }) => {
  const [data, setData] = useState<ConsolidatedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    api
      .getConsolidatedDashboard({ month: String(month), year: String(year) })
      .then((res) => setData(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const years = Array.from({ length: 3 }, (_, i) => year - 1 + i);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Voltar"
        >
          ←
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gastos Consolidados</h2>
          <p className="text-xs text-gray-400">Todos os perfis</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400 animate-pulse">Carregando...</p>
        </div>
      ) : !data ? (
        <div className="text-center text-gray-400 py-10">Nenhum dado encontrado.</div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Receitas</p>
              <p className="text-base font-bold text-emerald-700 leading-tight">{fmt(data.totalIncomes)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-red-600 font-medium mb-1">Gastos</p>
              <p className="text-base font-bold text-red-700 leading-tight">{fmt(data.totalExpenses)}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${data.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-xs font-medium mb-1 ${data.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo</p>
              <p className={`text-base font-bold leading-tight ${data.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(data.balance)}</p>
            </div>
          </div>

          {/* Per profile */}
          {data.byProfile.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Por Perfil</h3>
              <div className="space-y-3">
                {data.byProfile.map((p) => {
                  const totalForBar = data.totalExpenses || 1;
                  const pct = Math.min((p.expenses / totalForBar) * 100, 100);
                  return (
                    <div key={p.profileId} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                          style={{ backgroundColor: p.profileColor || '#3B82F6' }}
                        >
                          {p.profileName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{p.profileName}</span>
                        <span className={`ml-auto text-sm font-bold ${p.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(p.balance)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Receitas</p>
                          <p className="font-semibold text-emerald-600">{fmt(p.incomes)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Gastos</p>
                          <p className="font-semibold text-red-600">{fmt(p.expenses)}</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: p.profileColor || '#3B82F6' }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% dos gastos totais</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By category */}
          {data.byCategory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Por Categoria</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                {data.byCategory
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 8)
                  .map((cat, i) => {
                    const maxVal = data.byCategory[0]?.value || 1;
                    const pct = (cat.value / maxVal) * 100;
                    return (
                      <div
                        key={`${cat.name}-${i}`}
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm text-gray-700 w-28 truncate">{cat.name}</span>
                        <div className="flex-grow bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 text-right w-24 flex-shrink-0">{fmt(cat.value)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConsolidatedView;
