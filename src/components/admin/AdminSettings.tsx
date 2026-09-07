import React, { useState, useRef } from 'react';
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
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  Trash2,
  RefreshCw,
  Scissors,
} from 'lucide-react';
import {
  createWhatsAppLink,
  normalizeWhatsAppNumber,
  formatPhoneBR,
} from '../../utils/dateTime';
import { INITIAL_SETTINGS } from '../../data/initialData';

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

  // Visual Identity: Logo & Cover
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [ownerCoverUrl, setOwnerCoverUrl] = useState(settings.ownerCoverUrl || '');
  const [ownerRole, setOwnerRole] = useState(settings.ownerRole || 'Master Hair Stylist & Visagista');
  const [ownerBio, setOwnerBio] = useState(
    settings.ownerBio ||
      'Especialista em mechas personalizadas, visagismo e saúde capilar de alto padrão. Atendimento exclusivo e hora marcada.'
  );
  const [isLogoUrlInputVisible, setIsLogoUrlInputVisible] = useState(false);
  const [isCoverUrlInputVisible, setIsCoverUrlInputVisible] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState<string | null>(null);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaFeedback('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        updateSettings({ logoUrl: result });
        setMediaFeedback('Logo atualizada com sucesso!');
        setTimeout(() => setMediaFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaFeedback('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setOwnerCoverUrl(result);
        updateSettings({ ownerCoverUrl: result });
        setMediaFeedback('Foto de capa da dona atualizada com sucesso!');
        setTimeout(() => setMediaFeedback(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      logoUrl,
      ownerCoverUrl,
      ownerRole,
      ownerBio,
    });
    setMediaFeedback('Identidade visual salva e sincronizada em todo o sistema!');
    setTimeout(() => setMediaFeedback(null), 3500);
  };

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
      logoUrl,
      ownerCoverUrl,
      ownerRole,
      ownerBio,
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
      setName(INITIAL_SETTINGS.name);
      setOwnerName(INITIAL_SETTINGS.ownerName);
      setPhone(INITIAL_SETTINGS.phone);
      setWhatsapp(INITIAL_SETTINGS.whatsapp);
      setAddress(INITIAL_SETTINGS.address);
      setCancellationPolicy(INITIAL_SETTINGS.cancellationPolicyNotice);
      setLogoUrl(INITIAL_SETTINGS.logoUrl || '');
      setOwnerCoverUrl(INITIAL_SETTINGS.ownerCoverUrl || '');
      setOwnerRole(INITIAL_SETTINGS.ownerRole || '');
      setOwnerBio(INITIAL_SETTINGS.ownerBio || '');
      setFeedback('Dados de demonstração restaurados!');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div id="admin-settings-page" className="space-y-6">
      {/* Header */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#E6CA85]">
          Configurações do Salão & Identidade Visual
        </h2>
        <p className="text-xs sm:text-sm text-[#9E988F] mt-1">
          Gerencie a identidade visual (logo estilo Instagram, foto de capa com a dona), dados cadastrais e mensagens automáticas.
        </p>

        {feedback && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* IDENTIDADE VISUAL & MÍDIA DO SALÃO (LOGO & CAPA DA DONA)     */}
      {/* ============================================================ */}
      <div className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A059]" />
              <h3 className="text-lg font-serif font-bold text-[#E6CA85]">
                Identidade Visual do Studio & Mídia
              </h3>
            </div>
            <p className="text-xs text-[#9E988F] mt-0.5">
              Personalize a logo (como alterar uma foto de perfil do Instagram) e a foto de capa oficial da dona para elevar o profissionalismo percebido pelos clientes.
            </p>
          </div>

          {mediaFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{mediaFeedback}</span>
            </div>
          )}
        </div>

        {/* Hidden inputs for direct file picker */}
        <input
          id="file-upload-logo"
          type="file"
          ref={logoFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleLogoFileUpload}
        />
        <input
          id="file-upload-cover"
          type="file"
          ref={coverFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileUpload}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Logo / Instagram-Style Profile (4 cols on lg) */}
          <div className="lg:col-span-4 bg-[#121216] rounded-2xl p-5 border border-[#2A2A38] flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                Logo do Salão
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F1F28] border border-[#333342] text-[#9E988F]">
                Estilo Instagram
              </span>
            </div>

            {/* Circular Instagram-like profile container */}
            <div
              id="admin-logo-preview-avatar"
              onClick={() => logoFileInputRef.current?.click()}
              className="relative group cursor-pointer my-2"
              title="Clique para alterar a logo / foto de perfil"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#C5A059] via-[#E6CA85] to-[#8C6D34] shadow-xl">
                <div className="w-full h-full rounded-full bg-[#16161B] overflow-hidden flex items-center justify-center border-2 border-[#121216] relative">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo do Studio"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Scissors className="w-10 h-10 text-[#E6CA85]" />
                  )}

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-semibold gap-1 p-2">
                    <Camera className="w-5 h-5 text-[#E6CA85]" />
                    <span>Trocar Foto</span>
                  </div>
                </div>
              </div>

              {/* Camera icon badge */}
              <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#C5A059] text-[#0D0D10] border-2 border-[#121216] flex items-center justify-center shadow-md group-hover:bg-[#E6CA85] transition-colors">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-[#9E988F] mt-3">
              Clique no círculo acima para carregar uma imagem do seu dispositivo.
            </p>

            <div className="w-full mt-4 flex flex-col gap-2">
              <button
                id="btn-upload-logo-file"
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-[#22222D] hover:bg-[#2A2A38] border border-[#333342] text-[#E6CA85] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Imagem do Aparelho</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogoUrlInputVisible(!isLogoUrlInputVisible)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-[#2A2A38] hover:border-[#3A3A4A] text-[11px] text-[#9E988F] hover:text-[#D8D4CE] transition-colors cursor-pointer"
                >
                  {isLogoUrlInputVisible ? 'Ocultar URL' : 'Inserir Link URL'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultLogo = INITIAL_SETTINGS.logoUrl || '';
                    setLogoUrl(defaultLogo);
                    updateSettings({ logoUrl: defaultLogo });
                    setMediaFeedback('Logo padrão restaurada!');
                    setTimeout(() => setMediaFeedback(null), 3000);
                  }}
                  className="py-1.5 px-2.5 rounded-xl border border-[#2A2A38] hover:border-[#3A3A4A] text-[11px] text-[#9E988F] hover:text-[#D8D4CE] transition-colors cursor-pointer"
                  title="Restaurar logo padrão dourada"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {isLogoUrlInputVisible && (
                <div className="mt-1">
                  <input
                    id="input-logo-url"
                    type="url"
                    placeholder="https://...link-da-imagem.png"
                    value={logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value);
                      updateSettings({ logoUrl: e.target.value });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] bg-[#16161B] text-[#F5F3EF] text-xs focus:ring-1 focus:ring-[#C5A059] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Cover Photo & Studio Owner Presentation (8 cols on lg) */}
          <div className="lg:col-span-8 bg-[#121216] rounded-2xl p-5 border border-[#2A2A38] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                  Capa do Studio & Foto Profissional da Dona
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F1F28] border border-[#333342] text-[#9E988F]">
                  Destaque na Área do Cliente
                </span>
              </div>

              {/* 16:9 Cover preview */}
              <div
                id="admin-cover-preview-banner"
                onClick={() => coverFileInputRef.current?.click()}
                className="relative aspect-21/9 sm:aspect-16/7 w-full rounded-2xl overflow-hidden border border-[#2A2A38] group cursor-pointer bg-[#16161B] shadow-lg"
                title="Clique para alterar a foto de capa"
              >
                {ownerCoverUrl ? (
                  <img
                    src={ownerCoverUrl}
                    alt="Foto de Capa do Studio"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9E988F]">
                    <ImageIcon className="w-8 h-8 text-[#C5A059]/40 mb-1" />
                    <span className="text-xs">Nenhuma foto de capa definida</span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D10]/80 via-transparent to-transparent pointer-events-none" />

                {/* Cover badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#E6CA85] text-[10px] font-semibold border border-[#C5A059]/30">
                    Visualização da Capa
                  </span>
                </div>

                {/* Hover overlay with Change action */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5 p-4">
                  <Camera className="w-6 h-6 text-[#E6CA85]" />
                  <span>Clique para alterar a Foto de Capa</span>
                  <span className="text-[11px] text-[#D8D4CE] font-normal">
                    Recomendado: foto profissional da dona no studio (formato paisagem)
                  </span>
                </div>
              </div>

              {/* Cover action buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  id="btn-upload-cover-file"
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="py-2 px-3.5 rounded-xl bg-[#22222D] hover:bg-[#2A2A38] border border-[#333342] text-[#E6CA85] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Foto da Capa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCoverUrlInputVisible(!isCoverUrlInputVisible)}
                  className="py-2 px-3 rounded-xl border border-[#2A2A38] hover:border-[#3A3A4A] text-xs text-[#9E988F] hover:text-[#D8D4CE] transition-colors cursor-pointer"
                >
                  {isCoverUrlInputVisible ? 'Ocultar Link' : 'Colar Link URL'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultCover = INITIAL_SETTINGS.ownerCoverUrl || '';
                    setOwnerCoverUrl(defaultCover);
                    updateSettings({ ownerCoverUrl: defaultCover });
                    setMediaFeedback('Capa padrão restaurada!');
                    setTimeout(() => setMediaFeedback(null), 3000);
                  }}
                  className="py-2 px-3 rounded-xl border border-[#2A2A38] hover:border-[#3A3A4A] text-xs text-[#9E988F] hover:text-[#D8D4CE] transition-colors cursor-pointer"
                  title="Restaurar capa padrão da dona"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>

              {isCoverUrlInputVisible && (
                <div className="mt-2">
                  <input
                    id="input-cover-url"
                    type="url"
                    placeholder="https://...link-da-capa.jpg"
                    value={ownerCoverUrl}
                    onChange={(e) => {
                      setOwnerCoverUrl(e.target.value);
                      updateSettings({ ownerCoverUrl: e.target.value });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#2A2A38] bg-[#16161B] text-[#F5F3EF] text-xs focus:ring-1 focus:ring-[#C5A059] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Sub-fields for Owner Role and Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#22222D]">
                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                    Título / Especialidade da Dona
                  </label>
                  <input
                    id="input-settings-owner-role"
                    type="text"
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value)}
                    placeholder="Ex: Master Hair Stylist & Visagista"
                    className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] bg-[#16161B] text-[#F5F3EF] text-xs focus:ring-1 focus:ring-[#C5A059] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D8D4CE] mb-1">
                    Apresentação / Mini Bio do Studio
                  </label>
                  <input
                    id="input-settings-owner-bio"
                    type="text"
                    value={ownerBio}
                    onChange={(e) => setOwnerBio(e.target.value)}
                    placeholder="Ex: Especialista em mechas, visagismo e saúde capilar..."
                    className="w-full px-3 py-2 rounded-xl border border-[#2A2A38] bg-[#16161B] text-[#F5F3EF] text-xs focus:ring-1 focus:ring-[#C5A059] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Save Media CTA */}
            <div className="mt-4 pt-3 flex justify-end">
              <button
                id="btn-save-media-settings"
                type="button"
                onClick={handleSaveMedia}
                className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#DFBD69] text-[#0D0D10] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Identidade Visual</span>
              </button>
            </div>
          </div>
        </div>
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
