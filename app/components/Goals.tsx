import React, { useState } from 'react';
import { Goal } from '../types';
import { CalendarIcon, CloseIcon, EditIcon } from './common/Icons';
import EmptyState from './common/EmptyState';

interface GoalsProps {
  goals: Goal[];
  onCreateGoal: (newGoalData: Omit<Goal, 'id' | 'currentAmount'>) => void;
  onEditGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const GoalModal: React.FC<{
    onClose: () => void;
    onSave: (data: Goal | Omit<Goal, 'id' | 'currentAmount'>) => void;
    goalToEdit?: Goal | null;
}> = ({ onClose, onSave, goalToEdit }) => {
    const isEditing = !!goalToEdit;
    const [name, setName] = useState(goalToEdit?.name || '');
    const [targetAmount, setTargetAmount] = useState(goalToEdit?.targetAmount.toString() || '');
    const [deadline, setDeadline] = useState(goalToEdit?.deadline?.split('T')[0] || '');
    const [illustration, setIllustration] = useState(goalToEdit?.illustration || '🎯');
    const [status, setStatus] = useState(goalToEdit?.status || 'active');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && targetAmount) {
            const goalData = { name, targetAmount: parseFloat(targetAmount), deadline, illustration, status };
            if (isEditing) {
                onSave({ ...goalToEdit, ...goalData } as Goal);
            } else {
                onSave(goalData);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Meta' : 'Criar um novo sonho ✨'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da meta</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor total (R$)</label>
                        <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Prazo final</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ícone (emoji)</label>
                        <input type="text" value={illustration} onChange={e => setIllustration(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" maxLength={2} />
                    </div>
                    {isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                <option value="active">Ativa</option>
                                <option value="completed">Concluída</option>
                                <option value="paused">Pausada</option>
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-700">
                            {isEditing ? 'Salvar Alterações' : 'Criar Meta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GoalCard: React.FC<{ goal: Goal, onEdit: (goal: Goal) => void, onDelete: (id: string) => void }> = ({ goal, onEdit, onDelete }) => {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm transition-transform hover:scale-105 relative group">
       <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onEdit(goal)}
          className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100"
          aria-label="Editar meta"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
          aria-label="Deletar meta"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl">{goal.illustration}</p>
          <h3 className="font-bold text-lg text-gray-800 mt-2">{goal.name}</h3>
          {goal.deadline && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                  <CalendarIcon />
                  <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
              </div>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
          goal.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
          goal.status === 'paused' ? 'bg-gray-100 text-gray-600' :
          'bg-blue-100 text-blue-800'
        }`}>
          {goal.status === 'completed' ? 'Concluída' : goal.status === 'paused' ? 'Pausada' : `${progress.toFixed(0)}%`}
        </span>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-emerald-400 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{goal.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span>{goal.targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>
    </div>
  );
};

const Goals: React.FC<GoalsProps> = ({ goals, onCreateGoal, onEditGoal, onDeleteGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const openCreateModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleSaveGoal = (goalData: Goal | Omit<Goal, 'id' | 'currentAmount'>) => {
    if ('id' in goalData) {
        onEditGoal(goalData as Goal);
    } else {
        onCreateGoal(goalData as Omit<Goal, 'id' | 'currentAmount'>);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Metas & Sonhos</h2>
        <p className="text-gray-500">Planejando o futuro, um passo de cada vez.</p>
      </div>

      {goals.length === 0 ? (
          <EmptyState
              icon="🎯"
              title="Crie sua primeira meta"
              description="Defina um objetivo e acompanhe o progresso."
          />
      ) : (
        <div className="space-y-4">
            {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEditModal} onDelete={onDeleteGoal} />
            ))}
        </div>
      )}

      <div className="pt-4">
        <button onClick={openCreateModal} className="w-full py-3 bg-[#3B82F6] text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          Criar nova meta 💭
        </button>
      </div>

      {isModalOpen && <GoalModal onClose={() => setIsModalOpen(false)} onSave={handleSaveGoal} goalToEdit={editingGoal} />}
    </div>
  );
};

export default Goals;
