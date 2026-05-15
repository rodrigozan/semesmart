import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import EmptyState from './common/EmptyState';
import { EditIcon, DeleteIcon } from './common/Icons';

interface TransactionsProps {
  transactions?: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

const categoryDetails: { [key in Category]?: { icon: string; color: string } } = {
  [Category.Mercado]: { icon: '🛒', color: 'bg-amber-100 text-amber-800' },
  [Category.Transporte]: { icon: '🚗', color: 'bg-blue-100 text-blue-800' },
  [Category.Lazer]: { icon: '🎉', color: 'bg-pink-100 text-pink-800' },
  [Category.Educacao]: { icon: '🎓', color: 'bg-violet-100 text-violet-800' },
  [Category.Contas]: { icon: '🧾', color: 'bg-red-100 text-red-800' },
  [Category.Saude]: { icon: '❤️‍🩹', color: 'bg-emerald-100 text-emerald-800' },
  [Category.Dizimo]: { icon: '🙏', color: 'bg-teal-100 text-teal-800' },
  [Category.Investimento]: { icon: '📈', color: 'bg-indigo-100 text-indigo-800' },
  [Category.IA]: { icon: '🤖', color: 'bg-purple-100 text-purple-800' },
  [Category.Marketing]: { icon: '📢', color: 'bg-orange-100 text-orange-800' },
  [Category.Ferramentas]: { icon: '🔧', color: 'bg-slate-100 text-slate-800' },
  [Category.Outros]: { icon: '📦', color: 'bg-gray-100 text-gray-800' },
  [Category.Entrada]: { icon: '💰', color: 'bg-green-100 text-green-800' },
};

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  const details = categoryDetails[isIncome ? Category.Entrada : (transaction.category || Category.Outros)] || {
    icon: '❓',
    color: 'bg-gray-100 text-gray-600',
  };

  const amountTextColor = isExpense ? 'text-red-500' : 'text-green-500';

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-4 flex-grow">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${details.color}`}>
          {details.icon}
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-gray-800">{transaction.description || 'Sem descrição'}</p>
          {transaction.location && (
            <p className="text-sm text-gray-500">{transaction.location}</p>
          )}
          {transaction.incomeSource && (
            <p className="text-sm text-gray-500">{transaction.incomeSource}</p>
          )}
          <p className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className={`font-bold text-lg ${amountTextColor}`}>
          {transaction.amount?.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }) || 'R$ 0,00'}
        </p>
        <button
          onClick={() => onEdit(transaction)}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          title="Editar transação"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Deletar transação"
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
};

const Transactions: React.FC<TransactionsProps> = ({
  transactions = [],
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="Nenhum registro encontrado"
        description="Quando você adicionar gastos ou receitas, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-100">
        {filteredTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
          />
        ))}
      </div>
    </div>
  );
};

export default Transactions;
