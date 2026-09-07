import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { Service } from '../../types';
import { formatCurrency } from '../../utils/dateTime';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminServices: React.FC = () => {
  const { services, addService, updateService, deleteService, toggleServiceActive } =
    useSalon();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(60);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);

  const handleOpenNew = () => {
    setEditingService(null);
    setName('');
    setDurationMinutes(45);
    setPrice(60);
    setDescription('');
    setCategory('Cabelo');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price);
    setDescription(service.description || '');
    setCategory(service.category || 'Cabelo');
    setActive(service.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingService) {
      updateService(editingService.id, {
        name,
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        description,
        category,
        active,
      });
    } else {
      addService({
        name,
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        description,
        category,
        active,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, sName: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${sName}"?`)) {
      deleteService(id);
    }
  };

  return (
    <div id="admin-services-page" className="space-y-6">
      {/* Header */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
              Procedimentos & Serviços
            </h2>
            <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
              Gerencie a lista de procedimentos disponíveis para agendamento, preços e tempo estimado.
            </p>
          </div>

          <button
            id="btn-add-service-modal"
            type="button"
            onClick={handleOpenNew}
            className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Procedimento</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            id={`service-card-${service.id}`}
            className={`bg-[#16161B] rounded-3xl p-5 border transition-all flex flex-col justify-between ${
              service.active
                ? 'border-[#262630] shadow-2xs hover:border-[#C5A059]/40'
                : 'border-[#262630] opacity-60 bg-[#121216]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E6CA85] bg-[#22222D] px-2.5 py-0.5 rounded-md border border-[#C5A059]/30">
                    {service.category || 'Serviço'}
                  </span>
                  <h3 className="text-base font-bold text-[#F5F3EF] mt-2">
                    {service.name}
                  </h3>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    service.active
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
                      : 'bg-[#22222D] text-[#9E988F] border border-[#262630]'
                  }`}
                >
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {service.description && (
                <p className="text-xs text-[#9E988F] mt-2 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#262630] text-xs">
                <div className="flex items-center gap-1.5 text-[#D8D4CE]">
                  <Clock className="w-4 h-4 text-[#9E988F]" />
                  <span>{service.durationMinutes} minutos</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#E6CA85] font-bold justify-end font-mono">
                  <span>{formatCurrency(service.price)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#262630] flex items-center justify-between">
              <button
                id={`btn-toggle-service-${service.id}`}
                type="button"
                onClick={() => toggleServiceActive(service.id)}
                className="text-xs font-semibold text-[#9E988F] hover:text-[#F5F3EF] cursor-pointer"
              >
                {service.active ? 'Desativar' : 'Ativar'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  id={`btn-edit-service-${service.id}`}
                  type="button"
                  onClick={() => handleOpenEdit(service)}
                  className="p-1.5 text-[#9E988F] hover:text-[#E6CA85] rounded-lg hover:bg-[#22222D] transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  id={`btn-delete-service-${service.id}`}
                  type="button"
                  onClick={() => handleDelete(service.id, service.name)}
                  className="p-1.5 text-[#9E988F] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Service Modal */}
      {isModalOpen && (
        <div
          id="service-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-[#16161B] rounded-3xl shadow-2xl border border-[#262630] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262630] bg-[#121216]">
              <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                {editingService ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h3>
              <button
                id="btn-close-service-modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9E988F] hover:text-[#F5F3EF] rounded-lg hover:bg-[#22222D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  id="input-service-name"
                  type="text"
                  required
                  placeholder="Ex: Corte e Escova Modelada"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                    Duração (minutos) *
                  </label>
                  <input
                    id="input-service-duration"
                    type="number"
                    min={15}
                    step={15}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    id="input-service-price"
                    type="number"
                    min={0}
                    step={5}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <input
                  id="input-service-category"
                  type="text"
                  placeholder="Ex: Cabelo, Unhas, Estética, Sobrancelha"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="textarea-service-desc"
                  rows={2}
                  placeholder="Breve explicação sobre os passos do atendimento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="checkbox-service-active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] accent-[#C5A059] rounded-sm"
                />
                <label htmlFor="checkbox-service-active" className="text-xs font-semibold text-[#D8D4CE]">
                  Disponível para agendamento online
                </label>
              </div>

              <div className="pt-3 border-t border-[#262630] flex gap-2.5">
                <button
                  id="btn-save-service"
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Salvar Procedimento
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#D8D4CE] border border-[#262630] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
