import React, { useState, useEffect } from 'react';
import { Member, Category, PaymentMethod, Transaction } from '../../types';
import { CloseIcon } from '../common/Icons';

interface TransactionFormModalProps {
  onClose: () => void;
  // A função onSubmit agora pode receber o ID da transação se for uma edição
  onSubmit: (data: Omit<Transaction, 'id'>, transactionId?: string) => Promise<void>;
  members: Member[];
  type: 'income' | 'expense';
  transactionToEdit?: Transaction | null; // Novo: transação para editar (opcional)
}

const expenseCategories = [
    Category.Mercado, Category.Transporte, Category.Lazer, Category.Educacao, Category.Contas, Category.Saude, Category.Dizimo, Category.Outros
];

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ onClose, onSubmit, members, type, transactionToEdit }) => {
    console.log("TransactionFormModal: Renderizado com prop 'type':", type);
    const [description, setDescription] = useState(transactionToEdit?.description || '');
    const [amount, setAmount] = useState(transactionToEdit?.amount ? String(Math.abs(transactionToEdit.amount)) : ''); // Sempre positivo para o input
    const [date, setDate] = useState(transactionToEdit?.date ? transactionToEdit.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [memberId, setMemberId] = useState(transactionToEdit?.memberId || members[0]?.id || '');
    const [category, setCategory] = useState<Category>(
        transactionToEdit?.category || (type === 'income' ? Category.Entrada : Category.Mercado)
    );
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
        transactionToEdit?.paymentMethod || PaymentMethod.Debito
    );
    const [location, setLocation] = useState(transactionToEdit?.location || '');
    const [locations, setLocations] = useState<string[]>([]);
    const [incomeSource, setIncomeSource] = useState(transactionToEdit?.incomeSource || '');
    const [incomeSources, setIncomeSources] = useState<string[]>([]);

    const isEditing = !!transactionToEdit; // Determina se estamos editando

    useEffect(() => {
        if (type === 'expense') {
            const storedLocations = localStorage.getItem('transactionLocations');
            if (storedLocations) setLocations(JSON.parse(storedLocations));
            if (!isEditing) setCategory(Category.Mercado); // Só define padrão se não estiver editando
        } else {
            const storedSources = localStorage.getItem('incomeSources');
            if (storedSources) setIncomeSources(JSON.parse(storedSources));
            if (!isEditing) setCategory(Category.Entrada); // Só define padrão se não estiver editando
        }
    }, [type, isEditing]);

    useEffect(() => {
        if (type === 'income' && memberId) {
            const selectedMember = members.find(m => m.id === memberId);
            if (selectedMember?.incomeSource && !isEditing) { // Só preenche padrão se não estiver editando
                setIncomeSource(`${selectedMember.incomeSource || 'Salário'} (${selectedMember.name})`);
            } else if (!isEditing) {
                setIncomeSource('');
            }
        }
    }, [memberId, type, members, isEditing]);

    const handleAddLocation = () => {
        const trimmedLocation = location.trim();
        if (trimmedLocation && !locations.includes(trimmedLocation)) {
            const newLocations = [...locations, trimmedLocation].sort();
            setLocations(newLocations);
            localStorage.setItem('transactionLocations', JSON.stringify(newLocations));
        }
    };

    const handleAddIncomeSource = () => {
        const trimmedSource = incomeSource.trim();
        if (trimmedSource && !incomeSources.includes(trimmedSource)) {
            const newSources = [...incomeSources, trimmedSource].sort();
            setIncomeSources(newSources);
            localStorage.setItem('incomeSources', JSON.stringify(newSources));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !amount.trim() || !date || !memberId) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        if (isNaN(parseFloat(amount))) {
            alert('Valor inválido. Por favor, insira um número.');
            return;
        }

        const selectedMember = members.find(m => m.id === memberId);
        const memberName = selectedMember ? selectedMember.name : 'Membro Desconhecido';
       const parsedDateUTC = new Date(date + 'T12:00:00Z');

        const transactionMonth = parsedDateUTC.getUTCMonth() + 1;
        const transactionYear = parsedDateUTC.getUTCFullYear();

        const dateISOStringForFirestore = parsedDateUTC.toISOString();

        const baseTransactionData: Omit<Transaction, 'id'> = {
            description: description.trim(),
            amount: parseFloat(amount), // Será tratado em App.tsx
            date: dateISOStringForFirestore,
            memberId,
            memberName,
            month: transactionMonth,
            year: transactionYear,
            type,
            createdAt: transactionToEdit?.createdAt || new Date().toISOString(), // Mantém o createdAt original na edição
            source: transactionToEdit?.source || 'manual', // Mantém o source original na edição
            userId: '', // Será preenchido em App.tsx
        };

        const specificFields = type === 'expense'
            ? {
                category: category,
                paymentMethod: paymentMethod,
                location: location.trim() || undefined,
                incomeSource: undefined,
            }
            : { // type === 'income'
                category: Category.Entrada,
                paymentMethod: undefined,
                location: undefined,
                incomeSource: incomeSource.trim() || undefined,
            };

        const finalTransactionData = { ...baseTransactionData, ...specificFields };

        await onSubmit(finalTransactionData, transactionToEdit?.id); // Passa o ID se estiver editando
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {isEditing ? `Editar ${type === 'income' ? 'Entrada 💰' : 'Gasto 💸'}` : `Adicionar ${type === 'income' ? 'Entrada 💰' : 'Gasto 💸'}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos Condicionais: Local / Fonte da Renda (mesmo código de antes) */}
                    {type === 'expense' && (
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Local</label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    id="location"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    list="locations-list"
                                    placeholder="Ex: Padaria do João"
                                />
                                <datalist id="locations-list">
                                    {locations.map((loc, index) => <option key={index} value={loc} />)}
                                </datalist>
                                <button
                                    type="button"
                                    onClick={handleAddLocation}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold whitespace-nowrap"
                                    title="Salvar este local na lista para uso futuro"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    )}
                    {type === 'income' && (
                         <div>
                            <label htmlFor="incomeSource" className="block text-sm font-medium text-gray-700">Fonte da Renda</label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    id="incomeSource"
                                    value={incomeSource}
                                    onChange={e => setIncomeSource(e.target.value)}
                                    className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    list="sources-list"
                                    placeholder="Ex: Salário, Adiantamento"
                                />
                                <datalist id="sources-list">
                                    {incomeSources.map((src, index) => <option key={index} value={src} />)}
                                </datalist>
                                <button
                                    type="button"
                                    onClick={handleAddIncomeSource}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold whitespace-nowrap"
                                    title="Salvar esta fonte na lista para uso futuro"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Campos comuns a ambos os tipos (restante do seu formulário) */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                        <input type="number" step="0.01" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" disabled={type === 'income'}>
                            {type === 'income'
                                ? <option value={Category.Entrada}>Entrada</option>
                                : expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                            }
                        </select>
                    </div>
                    {type === 'expense' && (
                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                            <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="member" className="block text-sm font-medium text-gray-700">Membro da Família</label>
                        <select id="member" value={memberId} onChange={e => setMemberId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
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
