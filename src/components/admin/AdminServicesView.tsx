import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarberService } from '../../types';
import { Scissors, Plus, Edit2, Trash2, Clock, Check, X } from 'lucide-react';

export const AdminServicesView: React.FC = () => {
  const { services, addService, updateService, deleteService } = useApp();

  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BarberService['category']>('Cabelo');
  const [price, setPrice] = useState<number>(45);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setName('');
    setCategory('Cabelo');
    setPrice(45);
    setDurationMinutes(30);
    setDescription('');
    setIsActive(true);
    setIsCreating(true);
    setEditingService(null);
  };

  const openEditModal = (service: BarberService) => {
    setEditingService(service);
    setName(service.name);
    setCategory(service.category);
    setPrice(service.price);
    setDurationMinutes(service.durationMinutes);
    setDescription(service.description);
    setIsActive(service.isActive);
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreating) {
      addService({
        name: name.trim(),
        category,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        description: description.trim(),
        isActive,
      });
      setIsCreating(false);
    } else if (editingService) {
      updateService(editingService.id, {
        name: name.trim(),
        category,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        description: description.trim(),
        isActive,
      });
      setEditingService(null);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            Catálogo de Serviços da Barbearia
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os procedimentos, tempo médio de cadeira e valores praticados no atendimento.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Novo Serviço</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between transition ${
              service.isActive
                ? 'bg-[#1e293b] border-slate-800 hover:border-slate-700'
                : 'bg-slate-950/60 border-slate-900 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {service.category}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    title="Editar serviço"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir serviço "${service.name}"?`)) {
                        deleteService(service.id);
                      }
                    }}
                    title="Excluir serviço"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{service.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">{service.description}</p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-base font-extrabold text-amber-400">
                  R$ {service.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{service.durationMinutes} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {(isCreating || editingService) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingService(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              {isCreating ? 'Novo Serviço da Barbearia' : 'Editar Serviço'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome do Procedimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê Navalhado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Barba">Barba</option>
                    <option value="Combo">Combo</option>
                    <option value="Tratamento">Tratamento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tempo Médio (min)</label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição do Serviço</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes do que está incluso no procedimento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-amber-500"
                />
                <label htmlFor="isActive" className="text-xs text-slate-300 cursor-pointer">
                  Disponível para agendamento na área pública
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingService(null);
                  }}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
