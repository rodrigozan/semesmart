// src/components/Transactions.tsx

import React, { useState, useMemo } from 'react';
import { Transaction, Member, Category } from '../types';
import EmptyState from './common/EmptyState';
import { EditIcon, DeleteIcon } from './common/Icons'; // Assumindo que você tem ícones de editar/deletar

interface TransactionsProps {
  transactions?: Transaction[];
  members?: Member[];
  onEditTransaction: (transaction: Transaction) => void; // Novo: para editar
  onDeleteTransaction: (transactionId: string) => void; // Novo: para deletar
}

const categoryDetails: { [key in Category]?: { icon: string; color: string } } = {
  [Category.Mercado]: { icon: '🛒', color: 'bg-amber-100 text-amber-800' },
  [Category.Transporte]: { icon: '🚗', color: 'bg-blue-100 text-blue-800' },
  [Category.Lazer]: { icon: '🎉', color: 'bg-pink-100 text-pink-800' },
  [Category.Educacao]: { icon: '🎓', color: 'bg-violet-100 text-violet-800' },
  [Category.Contas]: { icon: '🧾', color: 'bg-red-100 text-red-800' },
  [Category.Saude]: { icon: '❤️‍🩹', color: 'bg-emerald-100 text-emerald-800' },
  [Category.Dizimo]: { icon: '🙏', color: 'bg-teal-100 text-teal-800' },
  [Category.Outros]: { icon: '📦', color: 'bg-gray-100 text-gray-800' },
  [Category.Entrada]: { icon: '💰', color: 'bg-green-100 text-green-800' },
};

// Adicione as novas props ao TransactionItem
interface TransactionItemProps {
  transaction: Transaction;
  member?: Member;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  member,
  onEdit,   // Novo
  onDelete, // Novo
}) => {
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';

  const details = categoryDetails[isIncome ? Category.Entrada : (transaction.category || Category.Outros)] || {
    icon: '❓',
    color: 'bg-gray-100 text-gray-600',
  };

  let subtitleDetail = '';
  if (isExpense && transaction.location) {
    subtitleDetail = transaction.location;
  } else if (isIncome && transaction.incomeSource) {
    subtitleDetail = transaction.incomeSource;
  }

  // A cor do texto do valor é definida pelo tipo da transação
  const amountTextColor = isExpense ? 'text-red-500' : 'text-green-500';

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-4 flex-grow"> {/* Flex-grow para ocupar espaço */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${details.color}`}
        >
          {details.icon}
        </div>
        <div className="flex-grow"> {/* Permite que o texto cresça */}
          <p className="font-semibold text-gray-800">{transaction.location || 'Sem local'}</p>
          <p className="font-semibold text-gray-600">{transaction.description || 'Sem descrição'}</p>
          <p className="text-sm text-gray-500">
            {member?.name || transaction.memberName || 'Família'}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
          <p className="text-sm text-gray-500">
            {isExpense && transaction.paymentMethod ? `${transaction.paymentMethod}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2"> {/* Container para valor e botões */}
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
          <EditIcon className="w-5 h-5" /> {/* Use um ícone adequado */}
        </button>
        <button
          onClick={() => onDelete(transaction.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Deletar transação"
        >
          <DeleteIcon className="w-5 h-5" /> {/* Use um ícone adequado */}
        </button>
      </div>
    </div>
  );
};

const Transactions: React.FC<TransactionsProps> = ({
  transactions = [],
  members = [],
  onEditTransaction, // Novo
  onDeleteTransaction, // Novo
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];

    return transactions
      .filter((t) => activeFilter === 'todos' || t.memberId === activeFilter)
      .sort((a, b) => {
        const dateA = new Date(a.date || '');
        const dateB = new Date(b.date || '');

        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime();
      });
  }, [transactions, activeFilter]);

  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="Nenhum registro encontrado"
        description="Quando você adicionar gastos ou receitas, eles aparecerão aqui. Que tal começar?"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFilter('todos')}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            activeFilter === 'todos'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Todos
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => setActiveFilter(member.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              activeFilter === member.id
                ? 'bg-[#3B82F6] text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {member.name}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {filteredTransactions.map((tx) => {
          const member = members.find((m) => m.id === tx.memberId);
          return (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              member={member}
              onEdit={onEditTransaction}   // Passando a função de edição
              onDelete={onDeleteTransaction} // Passando a função de deleção
            />
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-rose-50 text-rose-800 rounded-xl text-center">
        💡{' '}
        <span className="font-semibold">Dica do mês:</span> Tente cozinhar em casa
        2x por semana — vocês podem economizar em média R$ 200!
      </div>
    </div>
  );
};

export default Transactions;
