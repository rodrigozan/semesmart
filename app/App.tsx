import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import api from './api';
import { Transaction, Goal } from './types';

import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/Transactions';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Investments from './components/Investments';
import Profile from './components/Profile';
import ConsolidatedView from './components/ConsolidatedView';
import TransactionFormModal from './components/modals/TransactionFormModal';
import ErrorModal from './components/modals/ErrorModal';
import Login from './pages/Login';
import ProfileSelector from './pages/ProfileSelector';

type Screen = 'inicio' | 'historico' | 'relatorios' | 'metas' | 'investimentos' | 'perfil' | 'consolidado';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, profiles, setActiveProfile, loading: profileLoading, refreshProfiles } = useProfile();

  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isDataLoading, setDataLoading] = useState(false);

  const [isTransactionFormModalOpen, setTransactionFormModalOpen] = useState(false);
  const [transactionTypeForModal, setTransactionTypeForModal] = useState<'income' | 'expense'>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalOpen(true);
  };

  useEffect(() => {
    if (user && !activeProfile) {
      refreshProfiles();
    }
  }, [user, activeProfile, refreshProfiles]);

  useEffect(() => {
    if (profiles.length === 1 && !activeProfile) {
      setActiveProfile(profiles[0]);
    }
  }, [profiles, activeProfile, setActiveProfile]);

  const fetchTransactions = useCallback(async () => {
    if (!activeProfile) return;
    setDataLoading(true);
    try {
      const res = await api.getTransactions(activeProfile.id);
      const txs = res.data || [];
      setTransactions(txs);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setTransactions([]);
    } finally {
      setDataLoading(false);
    }
  }, [activeProfile]);

  const fetchGoals = useCallback(async () => {
    if (!activeProfile) return;
    try {
      const res = await api.getGoals(activeProfile.id);
      setGoals(res.data || []);
    } catch (err: any) {
      console.error('Failed to load goals:', err);
      setGoals([]);
    }
  }, [activeProfile]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleTransactionFormSubmit = async (data: Omit<Transaction, 'id'>, transactionId?: string) => {
    if (!user || !activeProfile) {
      showError('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const normalizedAmount = Math.abs(data.amount);

      const payload = {
        ...data,
        amount: normalizedAmount,
        profile: activeProfile.id,
        createdBy: user.id,
      };

      if (transactionId) {
        await api.updateTransaction(activeProfile.id, transactionId, payload);
        setTransactions(prev => prev.map(tx => (tx.id === transactionId ? { ...tx, ...payload, id: transactionId } : tx)));
      } else {
        const res = await api.addTransaction(activeProfile.id, payload);
        setTransactions(prev => [res.data, ...prev]);
      }
      setTransactionFormModalOpen(false);
      setTransactionToEdit(null);
    } catch (err: any) {
      showError('Erro ao Salvar Transação', err.message || 'Não foi possível salvar a transação.');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!activeProfile) return;
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) return;
    try {
      await api.deleteTransaction(activeProfile.id, transactionId);
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    } catch (err: any) {
      showError('Erro ao Deletar', err.message || 'Não foi possível deletar a transação.');
    }
  };

  const handleCreateGoal = async (data: Omit<Goal, 'id' | 'currentAmount'>) => {
    if (!activeProfile) return;
    try {
      const res = await api.createGoal(activeProfile.id, data);
      setGoals(prev => [res.data, ...prev]);
    } catch (err: any) {
      showError('Erro ao Criar Meta', err.message || 'Não foi possível criar a meta.');
    }
  };

  const handleEditGoal = async (goal: Goal) => {
    if (!activeProfile) return;
    try {
      await api.updateGoal(activeProfile.id, goal.id, goal);
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    } catch (err: any) {
      showError('Erro ao Editar Meta', err.message || 'Não foi possível editar a meta.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!activeProfile) return;
    if (!window.confirm('Tem certeza que deseja deletar esta meta?')) return;
    try {
      await api.deleteGoal(activeProfile.id, goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err: any) {
      showError('Erro ao Deletar Meta', err.message || 'Não foi possível deletar a meta.');
    }
  };

  const openAddTransactionModal = (type: 'income' | 'expense') => {
    setTransactionTypeForModal(type);
    setTransactionToEdit(null);
    setTransactionFormModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionTypeForModal(transaction.type);
    setTransactionToEdit(transaction);
    setTransactionFormModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-lg font-semibold animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  if (!activeProfile && profiles.length > 1) return <ProfileSelector />;
  if (!activeProfile && profileLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-lg font-semibold animate-pulse">Carregando...</p>
      </div>
    );
  }
  if (!activeProfile) return null;

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <Dashboard
            transactions={transactions}
            onAddTransaction={openAddTransactionModal}
            isOwner={user.role === 'owner'}
            profiles={profiles}
          />
        );
      case 'historico':
        return (
          <TransactionsList
            transactions={transactions}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'relatorios':
        return <Reports transactions={transactions} />;
      case 'metas':
        return (
          <Goals
            goals={goals}
            onCreateGoal={handleCreateGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'investimentos':
        return <Investments />;
      case 'perfil':
        return <Profile />;
      case 'consolidado':
        return <ConsolidatedView onBack={() => setActiveScreen('inicio')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-800">
      {isTransactionFormModalOpen && (
        <TransactionFormModal
          key={transactionTypeForModal + (transactionToEdit?.id || 'new')}
          onClose={() => { setTransactionFormModalOpen(false); setTransactionToEdit(null); }}
          onSubmit={handleTransactionFormSubmit}
          type={transactionTypeForModal}
          transactionToEdit={transactionToEdit}
        />
      )}

      <ErrorModal
        isOpen={isErrorModalOpen}
        title={errorModalTitle}
        message={errorModalMessage}
        onClose={() => setErrorModalOpen(false)}
      />

      <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-lg bg-white">
        <Header onViewConsolidated={() => setActiveScreen('consolidado')} />
        <main className="flex-grow p-4 pb-24">
          {isDataLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="animate-pulse text-gray-500">Carregando...</p>
            </div>
          ) : (
            renderScreen()
          )}
        </main>
        <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  </AuthProvider>
);

export default App;
