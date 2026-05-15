import React, { useState } from 'react';
import type { Investment } from '../../types';
import { CloseIcon } from '../common/Icons';

interface InvestmentFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Investment, 'id' | 'profile' | 'createdBy'>, invId?: string) => Promise<void>;
  investmentToEdit?: Investment | null;
}

const assetTypes = [
  { value: 'stock', label: 'Ações' },
  { value: 'fii', label: 'FIIs' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'other', label: 'Outros' },
];

const InvestmentFormModal: React.FC<InvestmentFormModalProps> = ({ onClose, onSubmit, investmentToEdit }) => {
  const isEditing = !!investmentToEdit;
  const [type, setType] = useState(investmentToEdit?.type || 'stock');
  const [ticker, setTicker] = useState(investmentToEdit?.ticker || '');
  const [name, setName] = useState(investmentToEdit?.name || '');
  const [quantity, setQuantity] = useState(investmentToEdit?.quantity?.toString() || '');
  const [averagePrice, setAveragePrice] = useState(investmentToEdit?.averagePrice?.toString() || '');
  const [currentPrice, setCurrentPrice] = useState(investmentToEdit?.currentPrice?.toString() || '');
  const [broker, setBroker] = useState(investmentToEdit?.broker || '');
  const [purchaseDate, setPurchaseDate] = useState(
    investmentToEdit?.purchaseDate ? investmentToEdit.purchaseDate.split('T')[0] : ''
  );
  const [notes, setNotes] = useState(investmentToEdit?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !quantity || !averagePrice || !currentPrice) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const data = {
      type: type as Investment['type'],
      ticker: ticker.trim().toUpperCase(),
      name: name.trim(),
      quantity: parseFloat(quantity),
      averagePrice: parseFloat(averagePrice),
      currentPrice: parseFloat(currentPrice),
      broker: broker.trim() || undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    await onSubmit(data, investmentToEdit?.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Editar Investimento' : 'Adicionar Investimento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Ativo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {assetTypes.map((at) => (
                <option key={at.value} value={at.value}>{at.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="EX: PETR4"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantidade</label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Ativo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Petrobras PN"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Preço Médio (R$)</label>
              <input
                type="number"
                step="0.01"
                value={averagePrice}
                onChange={(e) => setAveragePrice(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preço Atual (R$)</label>
              <input
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Corretora</label>
            <input
              type="text"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Clear, XP, Rico"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data da Compra</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700">
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvestmentFormModal;
