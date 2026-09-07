import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  Settings,
  MessageSquare,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Lock,
  Key,
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  createWhatsAppLink,
  normalizeWhatsAppNumber,
  formatPhoneBR,
} from '../../utils/dateTime';

export const AdminSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    adminCredentials,
    updateAdminCredentials,
  } = useSalon();

  const [name, setName] = useState(settings.name);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [address, setAddress] = useState(settings.address);
  const [cancellationPolicy, setCancellationPolicy] = useState(settings.cancellationPolicyNotice || '');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Admin Auth Settings
  const [adminEmail, setAdminEmail] = useState(
    adminCredentials.email || settings.ownerEmail || 'eveline.studiohair@gmail.com'
  );
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSaveAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim();

    if (!cleanEmail) {
      setAuthFeedback({
        type: 'error',
        message: 'Informe o e-mail de acesso da administradora.',
      });
      return;
    }

    if (newAdminPass.trim()) {
      if (newAdminPass.trim().length < 4) {
        setAuthFeedback({
          type: 'error',
          message: 'A nova senha deve possuir pelo menos 4 caracteres.',
        });
        return;
      }
      if (newAdminPass.trim() !== confirmAdminPass.trim()) {
        setAuthFeedback({
          type: 'error',
          message: 'A confirmação de senha não confere com a nova senha digitada.',
        });
        return;
      }
    }

    const finalPass = newAdminPass.trim()
      ? newAdminPass.trim()
      : adminCredentials.password || 'admin123';

    updateAdminCredentials(cleanEmail, finalPass);
    setNewAdminPass('');
    setConfirmAdminPass('');
    setAuthFeedback({
      type: 'success',
      message: 'Acesso e senha da administradora atualizados com sucesso!',
    });
    setTimeout(() => setAuthFeedback(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWa = normalizeWhatsAppNumber(whatsapp);
    updateSettings({
      name,
      ownerName,
      phone,
      whatsapp: cleanWa,
      address,
      cancellationPolicyNotice: cancellationPolicy,
    });
    setWhatsapp(cleanWa);
    setFeedback('Dados do salão atualizados com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Deseja restaurar todos os dados de demonstração (solicitações da Maria, Joana, agenda semanal e serviços)?'
      )
    ) {
      resetToSampleData();
      setFeedback('Dados de demonstração restaurados!');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div id="admin-settings-page" className="space-y-6">
      {/* Header */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
          Configurações do Salão & WhatsApp
        </h2>
        <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
          Dados do estabelecimento, número de contato e modelos de mensagens automáticas para as clientes.
        </p>

        {feedback && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salon Profile Form */}
        <form onSubmit={handleSave} className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-4">
          <h3 className="text-base font-serif font-bold text-[#E6CA85] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#C5A059]" />
            <span>Dados do Estabelecimento</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Nome do Salão
            </label>
            <input
              id="input-settings-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                Nome da Profissional
              </label>
              <input
                id="input-settings-owner"
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
                WhatsApp de Atendimento (com DDD)
              </label>
              <input
                id="input-settings-wa"
                type="text"
                required
                placeholder="Ex: (11) 99999-8888 ou 11999998888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#9E988F]">
                <span>
                  Link: <strong className="text-[#E6CA85] font-mono">wa.me/{normalizeWhatsAppNumber(whatsapp) || '55...'}</strong>
                </span>
                {normalizeWhatsAppNumber(whatsapp) && (
                  <a
                    id="btn-test-wa-settings"
                    href={createWhatsAppLink(whatsapp, 'Olá! Teste de WhatsApp do salão.')}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#E6CA85] hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Testar WhatsApp
                  </a>
                )}
              </div>
              <p className="text-[10px] text-[#6E6A62] mt-1">
                O código <strong>+55</strong> é aplicado automaticamente sem duplicações.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Telefone de Contato Visível
            </label>
            <input
              id="input-settings-phone"
              type="text"
              placeholder="(11) 99999-8888"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Endereço Completo
            </label>
            <input
              id="input-settings-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1">
              Regras e Política de Cancelamento
            </label>
            <textarea
              id="textarea-settings-policy"
              rows={2}
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-xs focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-save-settings"
              type="submit"
              className="w-full px-4 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>

        {/* WhatsApp Templates Preview */}
        <div className="space-y-6">
          <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                  Modelos de Mensagens WhatsApp
                </h3>
                <p className="text-xs text-[#9E988F]">
                  Prontas para envio rápido com um clique no botão &ldquo;Falar no WhatsApp&rdquo;.
                </p>
              </div>
            </div>

            {/* Template 1: Confirmação */}
            <div className="p-4 rounded-2xl bg-[#121216] border border-[#262630] text-xs space-y-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                1. Confirmação de Horário
              </span>
              <p className="text-[#D8D4CE] bg-[#16161B] p-2.5 rounded-xl border border-[#262630] font-mono text-[11px] leading-relaxed">
                &ldquo;Olá, <strong>[NOME]</strong>! Seu agendamento para <strong>[PROCEDIMENTO]</strong> no dia <strong>[DATA]</strong> às <strong>[HORA]</strong> foi CONFIRMADO com sucesso. Te esperamos no {settings.name}! Endereço: {settings.address}&rdquo;
              </p>
            </div>

            {/* Template 2: Oferecer outro horário */}
            <div className="p-4 rounded-2xl bg-[#121216] border border-[#262630] text-xs space-y-1.5">
              <span className="font-bold text-[#E6CA85] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                2. Oferta de Horário Alternativo
              </span>
              <p className="text-[#D8D4CE] bg-[#16161B] p-2.5 rounded-xl border border-[#262630] font-mono text-[11px] leading-relaxed">
                &ldquo;Olá, <strong>[NOME]</strong>! O horário solicitado não está mais disponível. Temos estas opções: <strong>[HORÁRIOS]</strong>. Qual delas fica melhor para você?&rdquo;
              </p>
            </div>

            {/* Template 3: Lembrete */}
            <div className="p-4 rounded-2xl bg-[#121216] border border-[#262630] text-xs space-y-1.5">
              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                3. Lembrete de Atendimento
              </span>
              <p className="text-[#D8D4CE] bg-[#16161B] p-2.5 rounded-xl border border-[#262630] font-mono text-[11px] leading-relaxed">
                &ldquo;Olá, <strong>[NOME]</strong>! Passando para lembrar do seu horário agendado para <strong>[PROCEDIMENTO]</strong> às <strong>[HORA]</strong> no {settings.name}. Até breve!&rdquo;
              </p>
            </div>
          </div>

          {/* Admin Credentials Security Card */}
          <div className="bg-[#16161B] rounded-3xl p-5 border border-[#262630] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#22222D] border border-[#C5A059]/30 flex items-center justify-center text-[#E6CA85] shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-[#E6CA85]">
                    Acesso Total & Senha da Administradora
                  </h4>
                  <p className="text-xs text-[#9E988F]">
                    Configure o e-mail de login e altere a senha de acesso a qualquer momento.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 text-[11px] font-bold uppercase tracking-wider self-start sm:self-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Acesso Total Habilitado
              </span>
            </div>

            {authFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  authFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400'
                    : 'bg-rose-950/50 border-rose-800/50 text-rose-400'
                }`}
              >
                {authFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{authFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveAuth} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label
                    htmlFor="input-setting-admin-email"
                    className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1"
                  >
                    E-mail de Acesso Total
                  </label>
                  <div className="relative">
                    <input
                      id="input-setting-admin-email"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                    />
                    <Mail className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-[#6E6A62] mt-1">
                    Utilizado para fazer login na área restrita.
                  </p>
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="input-setting-admin-new-pass"
                      className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider"
                    >
                      Nova Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="text-[#9E988F] hover:text-[#E6CA85] transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                    >
                      {showAdminPass ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-setting-admin-new-pass"
                      type={showAdminPass ? 'text' : 'password'}
                      placeholder="Deixe vazio para manter atual"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                    />
                    <KeyRound className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-[#6E6A62] mt-1">
                    Mínimo 4 dígitos para alterar.
                  </p>
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor="input-setting-admin-confirm-pass"
                    className="block text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider mb-1"
                  >
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="input-setting-admin-confirm-pass"
                      type={showAdminPass ? 'text' : 'password'}
                      placeholder="Repita a nova senha"
                      value={confirmAdminPass}
                      onChange={(e) => setConfirmAdminPass(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#2A2A38] bg-[#121216] text-[#F5F3EF] placeholder-[#6E6A62] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] focus:outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-[#9E988F] absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-[#6E6A62] mt-1">
                    Confirmação de segurança.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#262630]">
                <span className="text-[11px] text-[#9E988F] font-mono">
                  Credencial atual ativa: <strong className="text-[#E6CA85]">{adminCredentials.email || 'eveline.studiohair@gmail.com'}</strong>
                </span>

                <button
                  id="btn-save-admin-credentials"
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#C5A059] text-[#0D0D10] hover:bg-[#D4B26F] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações de Acesso</span>
                </button>
              </div>
            </form>
          </div>

          {/* Reset Demo Data Card */}
          <div className="bg-[#16161B] rounded-3xl p-5 border border-[#262630] flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-serif font-bold text-[#E6CA85]">
                Restaurar Dados de Exemplo
              </h4>
              <p className="text-xs text-[#9E988F] mt-0.5">
                Recarrega as semanas, clientes (Maria, Joana), solicitações pendentes e grade completa de exemplo.
              </p>
            </div>

            <button
              id="btn-reset-demo-data"
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 rounded-full bg-[#22222D] border border-[#262630] text-[#D8D4CE] hover:bg-[#2A2A38] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
