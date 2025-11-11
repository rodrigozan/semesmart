import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';

import { auth } from './firebaseConfig';
import api from './api';
import {
  Goal,
  Challenge,
  Transaction,
  Member,
  Card,
  FamilyProfile,
  UserData,
} from './types';
import { defaultUserData } from './constants/defaults';

import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/Transactions'; // Renomeado para evitar conflito de nome
import Reports from './components/Reports';
import Goals from './components/Goals';
import Profile from './components/Profile';
import OnboardingGuide from './components/OnboardingGuide';
// Importe o modal renomeado
import TransactionFormModal from './components/modals/TransactionFormModal'; // <-- IMPORTANTE: Novo nome!
import Auth from './components/Auth';
import PostOnboardingModal from './components/modals/PostOnboardingModal';
import ErrorModal from './components/modals/ErrorModal';

// Função utilitária para remover campos undefined (se ainda não estiver global)
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const newObj: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

type Screen = 'inicio' | 'historico' | 'relatorios' | 'metas' | 'perfil';

// ... FirebaseNotConfigured component ...

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isDataLoading, setDataLoading] = useState(false);

  // Estados para o modal de transação (agora pode ser para adicionar OU editar)
  const [isTransactionFormModalOpen, setTransactionFormModalOpen] = useState(false);
  const [transactionTypeForModal, setTransactionTypeForModal] = useState<'income' | 'expense'>('expense');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null); // NOVO: Transação sendo editada

  const [isOnboardingOpen, setOnboardingOpen] = useState(false);
  const [isPostOnboardingModalOpen, setPostOnboardingModalOpen] = useState(false);
  const [startMemberSetup, setStartMemberSetup] = useState(false);

  // Estados para o modal de erro
  const [isErrorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const showErrorMessage = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setErrorModalOpen(false);
    setErrorModalTitle('');
    setErrorModalMessage('');
  };

  const fetchUserData = useCallback(async (user: User) => {
  setDataLoading(true);
  try {
    const data = await api.getUserData(user.uid);
    const txs = await api.getUserTransactions(user.uid);

    console.log('✅ Dados do usuário:', data);
    console.log('💸 Transações carregadas (APÓS API):', txs.length);
    // --- NOVO LOG CRÍTICO AQUI ---
    console.log('DEBUG App.tsx: Conteúdo de txs (lista da API):', txs);
    // Verificar se a transação de salário está aqui
    const incomeTx = txs.find(t => t.id === 'D4uK8lTKVMQDHbTPaQ1C'); // Use o ID real da transação de salário
    if (incomeTx) console.log('DEBUG App.tsx: Transação de salário encontrada em txs:', incomeTx);
    else console.log('DEBUG App.tsx: Transação de salário NÃO encontrada em txs.');
    // --- FIM DO NOVO LOG CRÍTICO ---

    setUserData(data);
    setTransactions(txs);

    if (data && !data.hasSeenOnboarding) setOnboardingOpen(true);
    setActiveScreen('inicio');
  } catch (error: any) {
    console.error('❌ Falha ao carregar dados:', error);
    setUserData(null);
    showErrorMessage('Erro ao Carregar Dados', 'Não foi possível carregar os dados do usuário. Por favor, tente novamente mais tarde. ' + (error.message || ''));
  } finally {
    setDataLoading(false);
  }
}, []);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setCurrentUser(result.user);
          await fetchUserData(result.user);
          return;
        }
      } catch (error: any) {
        console.error('Erro no redirect:', error.code, error.message);
        showErrorMessage('Erro de Autenticação', 'Não foi possível completar o login. Por favor, tente novamente. ' + (error.message || ''));
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          await fetchUserData(user);
        } else {
          setCurrentUser(null);
          setUserData(null);
          setTransactions([]);
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    };

    initAuth();
  }, [fetchUserData]);

  const handleLogout = async () => {
    await api.logout();
  };

  const handleOnboardingFinish = async () => {
    if (currentUser && userData) {
      setOnboardingOpen(false);
      const updatedUserData = { ...userData, hasSeenOnboarding: true };
      await api.updateUserData(currentUser.uid, updatedUserData);
      setUserData(updatedUserData);
      setPostOnboardingModalOpen(true);
    }
  };

  // Funções para abrir o modal de transação em modo de criação
  const openAddTransactionModal = (type: 'income' | 'expense') => {
    console.log("App.tsx: openAddTransactionModal chamado com tipo:", type);
    setTransactionTypeForModal(type);
    setTransactionToEdit(null);
    setTransactionFormModalOpen(true);
  };

  // NOVO: Função para abrir o modal em modo de edição
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionTypeForModal(transaction.type);
    setTransactionToEdit(transaction); // Define a transação a ser editada
    setTransactionFormModalOpen(true);
  };

  // NOVO: Função para lidar com a submissão do formulário (criação ou edição)
  const handleTransactionFormSubmit = async (data: Omit<Transaction, 'id'>, transactionId?: string) => {
    if (!currentUser) {
      showErrorMessage('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      const finalAmount = Math.abs(data.amount);

      const rawTransactionToSave = {
        ...data,
        amount: finalAmount,
        userId: currentUser.uid,
      };

      const transactionToSave = removeUndefinedFields(rawTransactionToSave);

      if (transactionId) { // Estamos editando
        // Para update, o parâmetro updatedData da API espera Partial<Omit<Transaction, 'id'>>
        // Então transactionToSave (que já é Partial<...>) está correto aqui.
        await api.updateTransaction(currentUser.uid, transactionId, transactionToSave);
        setTransactions(prevTxs =>
          prevTxs.map(tx => (tx.id === transactionId ? { ...tx, ...transactionToSave, id: transactionId } : tx))
        );
        console.log('✅ Transação atualizada:', transactionId);
      } else { // Estamos criando
        // Para add, a API espera Omit<Transaction, 'id'>, então usamos a asserção de tipo.
        const savedTransaction = await api.addTransaction(currentUser.uid, transactionToSave as Omit<Transaction, 'id'>);
        setTransactions(prevTxs => [savedTransaction, ...prevTxs]);
        console.log('✅ Transação adicionada:', savedTransaction);
      }
      setTransactionFormModalOpen(false); // Fecha o modal
    } catch (error: any) {
      console.error('🔥 Erro ao salvar transação:', error);
      showErrorMessage('Erro ao Salvar Transação', error.message || 'Não foi possível salvar a transação. Verifique os dados e tente novamente.');
    }
  };

  // NOVO: Função para lidar com a exclusão de transações
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!currentUser) {
      showErrorMessage('Erro', 'Usuário não autenticado.');
      return;
    }

    if (window.confirm('Tem certeza que deseja deletar esta transação?')) {
      try {
        await api.deleteTransaction(currentUser.uid, transactionId);
        setTransactions(prevTxs => prevTxs.filter(tx => tx.id !== transactionId));
        console.log('✅ Transação deletada:', transactionId);
      } catch (error: any) {
        console.error('🔥 Erro ao deletar transação:', error);
        showErrorMessage('Erro ao Deletar Transação', error.message || 'Não foi possível deletar a transação. Tente novamente.');
      }
    }
  };


  if (isAuthLoading || (currentUser && isDataLoading)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-lg font-semibold animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!currentUser) return <Auth />;

  if (!userData && !isDataLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-lg font-semibold">Erro ao carregar os dados. Tente novamente.</p>
      </div>
    );
  }

  const loggedInUserMember = userData?.members?.[0];

  const renderScreen = () => {
    if (!userData) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Preparando dados do usuário...</p>
        </div>
      );
    }

    switch (activeScreen) {
      case 'inicio':
        return (
          <Dashboard
            transactions={transactions}
            members={userData.members}
            goals={userData.goals}
            challenges={userData.challenges}
            onUpdateChallengeStatus={() => {}}
            onAddTransaction={openAddTransactionModal} // Passa a nova função
          />
        );
      case 'historico':
        return (
          <TransactionsList // Usando o novo nome
            transactions={transactions}
            members={userData.members}
            onEditTransaction={handleEditTransaction}   // Passando para o componente de listagem
            onDeleteTransaction={handleDeleteTransaction} // Passando para o componente de listagem
          />
        );
      case 'relatorios':
        return <Reports transactions={transactions} />;
      case 'metas':
        return (
          <Goals
            goals={userData.goals}
            onCreateGoal={() => {}}
            onEditGoal={() => {}}
          />
        );
      case 'perfil':
        return (
          <Profile
            currentUser={loggedInUserMember}
            members={userData.members}
            cards={userData.cards}
            onAddMember={() => {}}
            onEditMember={() => {}}
            onAddCard={() => {}}
            onLogout={handleLogout}
            startWithAddMember={startMemberSetup}
            onSetupComplete={() => setStartMemberSetup(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-800">
      {isOnboardingOpen && <OnboardingGuide onFinish={() => setOnboardingOpen(false)} />}
      {isPostOnboardingModalOpen && (
        <PostOnboardingModal
          onConfirm={() => {}}
          onDecline={() => setPostOnboardingModalOpen(false)}
        />
      )}
      {isTransactionFormModalOpen && (
        <TransactionFormModal
          key={transactionTypeForModal + (transactionToEdit?.id || 'new')}
          onClose={() => {
            setTransactionFormModalOpen(false);
            setTransactionToEdit(null);
          }}
          onSubmit={handleTransactionFormSubmit}
          members={userData?.members || []}
          type={transactionTypeForModal}
          transactionToEdit={transactionToEdit}
        />
      )}

      <ErrorModal
        isOpen={isErrorModalOpen}
        title={errorModalTitle}
        message={errorModalMessage}
        onClose={closeErrorModal}
      />

      <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-lg bg-white">
        {userData && (
          <Header
            familyProfile={userData.familyProfile}
            onEditProfile={() => {}}
            isAdmin={loggedInUserMember?.role === 'Administrador'}
          />
        )}
        <main className="flex-grow p-4 pb-24">{renderScreen()}</main>
        {userData && (
          <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        )}
      </div>
    </div>
  );
};

export default App;
