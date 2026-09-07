import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { Client, Appointment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatDateShort,
  formatDateBR,
  createWhatsAppLink,
} from '../../utils/dateTime';
import {
  User,
  Phone,
  MessageSquare,
  Search,
  Calendar,
  Sparkles,
  Edit3,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

export const AdminClients: React.FC = () => {
  const { clients, appointments, updateClientNotes, settings } = useSalon();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleOpenClient = (client: Client) => {
    setSelectedClient(client);
    setEditingNotes(client.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedClient) {
      updateClientNotes(selectedClient.id, editingNotes);
      setSelectedClient({ ...selectedClient, notes: editingNotes });
      setIsSavingNotes(true);
      setTimeout(() => setIsSavingNotes(false), 2000);
    }
  };

  // Appointments of selected client
  const clientAppointments = selectedClient
    ? appointments.filter(
        (a) =>
          a.clientId === selectedClient.id ||
          a.clientPhone.replace(/\D/g, '') === selectedClient.phone.replace(/\D/g, '')
      )
    : [];

  return (
    <div id="admin-clients-page" className="space-y-6">
      {/* Header & Search */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
              Histórico & Cadastro de Clientes
            </h2>
            <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
              Visualize histórico de atendimentos, frequência, observações e contato rápido via WhatsApp.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              id="input-search-clients"
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-xs sm:text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientApts = appointments.filter(
            (a) =>
              a.clientId === client.id ||
              a.clientPhone.replace(/\D/g, '') === client.phone.replace(/\D/g, '')
          );
          const completedCount = clientApts.filter((a) => a.status === 'FINALIZADO').length;

          return (
            <div
              key={client.id}
              id={`client-card-${client.id}`}
              onClick={() => handleOpenClient(client)}
              className="bg-[#16161B] rounded-3xl p-5 border border-[#262630] shadow-2xs hover:border-[#C5A059]/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#22222D] border border-[#C5A059]/30 text-[#E6CA85] font-bold flex items-center justify-center shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#F5F3EF] group-hover:text-[#E6CA85] transition-colors leading-tight">
                        {client.name}
                      </h3>
                      <p className="text-xs text-[#9E988F] mt-0.5">
                        {client.phone}
                      </p>
                    </div>
                  </div>

                  <a
                    href={createWhatsAppLink(
                      client.whatsapp,
                      `Olá, ${client.name}! Tudo bem? Falamos do ${settings.name}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/30 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#262630] text-xs">
                  <div className="p-2.5 rounded-xl bg-[#121216] border border-[#22222D]">
                    <span className="text-[#9E988F] block text-[10px] uppercase font-semibold">
                      Atendimentos
                    </span>
                    <span className="font-bold text-[#F5F3EF]">
                      {completedCount} concluídos
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#121216] border border-[#22222D]">
                    <span className="text-[#9E988F] block text-[10px] uppercase font-semibold">
                      Última Visita
                    </span>
                    <span className="font-bold text-[#F5F3EF]">
                      {client.lastVisit ? formatDateShort(client.lastVisit) : 'Recente'}
                    </span>
                  </div>
                </div>

                {client.notes && (
                  <p className="text-xs italic text-[#D8D4CE] bg-[#121216] p-2.5 rounded-xl mt-3 line-clamp-2 border border-[#262630]">
                    &ldquo;{client.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-[#262630] flex items-center justify-between text-xs text-[#E6CA85] font-semibold">
                <span>Ver histórico completo</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div
          id="client-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl bg-[#16161B] rounded-3xl shadow-2xl border border-[#262630] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262630] bg-[#121216] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#22222D] border border-[#C5A059]/30 text-[#E6CA85] font-bold text-lg flex items-center justify-center">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                    {selectedClient.name}
                  </h3>
                  <p className="text-xs text-[#9E988F] flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#9E988F]" />
                    <span>{selectedClient.phone}</span>
                    <span>•</span>
                    <a
                      href={createWhatsAppLink(
                        selectedClient.whatsapp,
                        `Olá, ${selectedClient.name}!`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Falar no WhatsApp
                    </a>
                  </p>
                </div>
              </div>

              <button
                id="btn-close-client-modal"
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-[#9E988F] hover:text-[#F5F3EF] rounded-lg hover:bg-[#22222D] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Professional Notes Editor */}
              <div className="p-4 rounded-2xl bg-[#121216] border border-[#262630] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#D8D4CE] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#C5A059]" />
                    Observações da Profissional
                  </label>
                  {isSavingNotes && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvo!
                    </span>
                  )}
                </div>

                <textarea
                  id="textarea-client-notes"
                  rows={2}
                  placeholder="Ex: Prefere atendimento rápido, não gosta de secador muito quente, café com leite..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] text-xs bg-[#16161B] text-[#F5F3EF] placeholder-[#6E6A62] focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                />

                <div className="text-right">
                  <button
                    id="btn-save-client-notes"
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Salvar Observações
                  </button>
                </div>
              </div>

              {/* Appointments History List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8D4CE] mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C5A059]" />
                  Histórico de Agendamentos ({clientAppointments.length})
                </h4>

                {clientAppointments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#9E988F] bg-[#121216] rounded-2xl border border-dashed border-[#262630]">
                    Nenhum agendamento registrado para esta cliente ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-[#262630] border border-[#262630] rounded-2xl overflow-hidden bg-[#16161B]">
                    {clientAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#1A1A22] transition-colors text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F5F3EF]">
                              {formatDateBR(apt.date)} às {apt.time}
                            </span>
                            <StatusBadge status={apt.status} size="sm" />
                          </div>
                          <p className="text-[#9E988F] mt-0.5">
                            Procedimento: <strong className="text-[#D8D4CE]">{apt.serviceName}</strong> (R$ {apt.servicePrice})
                          </p>
                          {apt.clientNotes && (
                            <p className="text-[#6E6A62] italic mt-0.5">
                              Nota da cliente: {apt.clientNotes}
                            </p>
                          )}
                        </div>

                        <span className="text-[11px] text-[#9E988F]">
                          {apt.serviceDuration} minutos
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#262630] bg-[#121216] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2 rounded-full bg-[#22222D] hover:bg-[#2A2A38] text-[#D8D4CE] border border-[#262630] text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
