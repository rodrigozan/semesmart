import React, { useState, useEffect } from 'react';
import { Category, PaymentMethod, Transaction } from '../../types';
import { CloseIcon } from '../common/Icons';

interface TransactionFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id'>, transactionId?: string) => Promise<void>;
  type: 'income' | 'expense';
  transactionToEdit?: Transaction | null;
}

const expenseCategories = [
  Category.Mercado, Category.Transporte, Category.Lazer, Category.Educacao,
  Category.Contas, Category.Saude, Category.Dizimo, Category.Investimento,
  Category.IA, Category.Marketing, Category.Ferramentas, Category.Outros,
];

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ onClose, onSubmit, type, transactionToEdit }) => {
  const [description, setDescription] = useState(transactionToEdit?.description || '');
  const [amount, setAmount] = useState(transactionToEdit?.amount ? String(Math.abs(transactionToEdit.amount)) : '');
  const [date, setDate] = useState(transactionToEdit?.date ? transactionToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(
    transactionToEdit?.category || (type === 'income' ? Category.Entrada : Category.Mercado)
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transactionToEdit?.paymentMethod || PaymentMethod.PIX
  );
  const [location, setLocation] = useState(transactionToEdit?.location || '');
  const [locations, setLocations] = useState<string[]>([]);
  const [incomeSource, setIncomeSource] = useState(transactionToEdit?.incomeSource || '');
  const [incomeSources, setIncomeSources] = useState<string[]>([]);

  const isEditing = !!transactionToEdit;

  useEffect(() => {
    if (type === 'expense') {
      const stored = localStorage.getItem('transactionLocations');
      if (stored) setLocations(JSON.parse(stored));
    } else {
      const stored = localStorage.getItem('incomeSources');
      if (stored) setIncomeSources(JSON.parse(stored));
    }
  }, [type]);

  const handleAddLocation = () => {
    const trimmed = location.trim();
    if (trimmed && !locations.includes(trimmed)) {
      const newLocations = [...locations, trimmed].sort();
      setLocations(newLocations);
      localStorage.setItem('transactionLocations', JSON.stringify(newLocations));
    }
  };

  const handleAddIncomeSource = () => {
    const trimmed = incomeSource.trim();
    if (trimmed && !incomeSources.includes(trimmed)) {
      const newSources = [...incomeSources, trimmed].sort();
      setIncomeSources(newSources);
      localStorage.setItem('incomeSources', JSON.stringify(newSources));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount.trim() || !date) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    if (isNaN(parseFloat(amount))) {
      alert('Valor inválido.');
      return;
    }

    const parsedDateUTC = new Date(date + 'T12:00:00Z');
    const txMonth = parsedDateUTC.getUTCMonth() + 1;
    const txYear = parsedDateUTC.getUTCFullYear();

    const baseData: Omit<Transaction, 'id'> = {
      description: description.trim(),
      amount: parseFloat(amount),
      date: parsedDateUTC.toISOString(),
      month: txMonth,
      year: txYear,
      type,
      category: type === 'expense' ? category : Category.Entrada,
      paymentMethod: type === 'expense' ? paymentMethod : undefined,
      location: type === 'expense' ? location.trim() || undefined : undefined,
      incomeSource: type === 'income' ? incomeSource.trim() || undefined : undefined,
      source: transactionToEdit?.source || 'manual',
      createdAt: transactionToEdit?.createdAt || new Date().toISOString(),
      profile: '',
      createdBy: '',
    };

    await onSubmit(baseData, transactionToEdit?.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? `Editar ${type === 'income' ? 'Entrada' : 'Gasto'}` : `Adicionar ${type === 'income' ? 'Entrada' : 'Gasto'}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Local</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" list="locations-list" placeholder="Ex: Padaria do João" />
                <datalist id="locations-list">
                  {locations.map((loc, i) => <option key={i} value={loc} />)}
                </datalist>
                <button type="button" onClick={handleAddLocation} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold">Salvar</button>
              </div>
            </div>
          )}

          {type === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Fonte da Renda</label>
              <div className="mt-1 flex items-center gap-2">
                <input type="text" value={incomeSource} onChange={e => setIncomeSource(e.target.value)} className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" list="sources-list" placeholder="Ex: Salário" />
                <datalist id="sources-list">
                  {incomeSources.map((src, i) => <option key={i} value={src} />)}
                </datalist>
                <button type="button" onClick={handleAddIncomeSource} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold">Salvar</button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value as Category)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" disabled={type === 'income'}>
              {type === 'income'
                ? <option value={Category.Entrada}>Entrada</option>
                : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" className={`px-4 py-2 text-white rounded-lg ${type === 'income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
