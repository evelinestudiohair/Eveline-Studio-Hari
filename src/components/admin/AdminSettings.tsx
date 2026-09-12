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
  Database,
  Cloud,
} from 'lucide-react';
import {
  createWhatsAppLink,
  normalizeWhatsAppNumber,
  formatPhoneBR,
} from '../../utils/dateTime';
import { INITIAL_SETTINGS } from '../../data/initialData';
import { compressImageFile, compressBase64Image } from '../../utils/imageCompressor';

export const AdminSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    adminCredentials,
    updateAdminCredentials,
    firebaseStatus,
    syncWithFirebase,
    bootstrapFirebase,
  } = useSalon();

  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [firebaseActionFeedback, setFirebaseActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSyncFirebaseNow = async () => {
    setIsSyncingFirebase(true);
    setFirebaseActionFeedback(null);
    try {
      const res = await syncWithFirebase();
      if (res.success) {
        setFirebaseActionFeedback({
          type: 'success',
          message: res.message || 'Todas as coleções foram sincronizadas com o Firebase!',
        });
      } else {
        setFirebaseActionFeedback({
          type: 'error',
          message: res.message || 'Erro ao sincronizar com o Firebase.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro na sincronização';
      setFirebaseActionFeedback({ type: 'error', message: msg });
    } finally {
      setIsSyncingFirebase(false);
      setTimeout(() => setFirebaseActionFeedback(null), 5000);
    }
  };

  const handleBootstrapFirebaseNow = async () => {
    if (
      !window.confirm(
        'Deseja inicializar/recarregar todas as coleções base no Firestore (serviços, semanas, clientes e regras)?'
      )
    ) {
      return;
    }

    setIsSyncingFirebase(true);
    setFirebaseActionFeedback(null);
    try {
      const res = await bootstrapFirebase();
      if (res.success) {
        setFirebaseActionFeedback({
          type: 'success',
          message: res.message || 'Coleções inicializadas no Firebase Firestore com sucesso!',
        });
      } else {
        setFirebaseActionFeedback({
          type: 'error',
          message: res.message || 'Erro ao inicializar coleções no Firebase.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao inicializar';
      setFirebaseActionFeedback({ type: 'error', message: msg });
    } finally {
      setIsSyncingFirebase(false);
      setTimeout(() => setFirebaseActionFeedback(null), 5000);
    }
  };


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

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaFeedback('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      setMediaFeedback('Otimizando tamanho da imagem...');
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        maxSizeBytes: 100 * 1024,
      });

      setLogoUrl(compressed);
      updateSettings({ logoUrl: compressed });
      setMediaFeedback('Logo otimizada e salva com sucesso!');
      setTimeout(() => setMediaFeedback(null), 3500);
    } catch {
      setMediaFeedback('Erro ao processar imagem.');
      setTimeout(() => setMediaFeedback(null), 3500);
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMediaFeedback('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    try {
      setMediaFeedback('Otimizando foto de capa...');
      const compressed = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.75,
        maxSizeBytes: 150 * 1024,
      });

      setOwnerCoverUrl(compressed);
      updateSettings({ ownerCoverUrl: compressed });
      setMediaFeedback('Foto de capa otimizada e salva com sucesso!');
      setTimeout(() => setMediaFeedback(null), 3500);
    } catch {
      setMediaFeedback('Erro ao processar imagem.');
      setTimeout(() => setMediaFeedback(null), 3500);
    }
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMediaFeedback('Salvando identidade visual...');

    let optimizedLogo = logoUrl;
    let optimizedCover = ownerCoverUrl;

    try {
      if (optimizedLogo?.startsWith('data:image') && optimizedLogo.length > 130 * 1024) {
        optimizedLogo = await compressBase64Image(optimizedLogo, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeBytes: 100 * 1024,
        });
        setLogoUrl(optimizedLogo);
      }

      if (optimizedCover?.startsWith('data:image') && optimizedCover.length > 180 * 1024) {
        optimizedCover = await compressBase64Image(optimizedCover, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.75,
          maxSizeBytes: 150 * 1024,
        });
        setOwnerCoverUrl(optimizedCover);
      }
    } catch (err) {
      console.warn('Erro ao otimizar imagens da mídia:', err);
    }

    updateSettings({
      logoUrl: optimizedLogo,
      ownerCoverUrl: optimizedCover,
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
                Restaurar Dados Locais de Exemplo
              </h4>
              <p className="text-xs text-[#9E988F] mt-0.5">
                Recarrega as semanas, clientes (Maria, Joana), solicitações pendentes e grade completa no navegador.
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

          {/* ============================================================ */}
          {/* FIREBASE FIRESTORE INTEGRATION PANEL                         */}
          {/* ============================================================ */}
          <div
            id="admin-firebase-integration-panel"
            className="bg-[#16161B] rounded-3xl p-5 sm:p-6 border border-[#262630] shadow-2xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#22222D] border border-[#333342] flex items-center justify-center text-[#C5A059]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-serif font-bold text-[#E6CA85]">
                      Integração com Firebase Firestore
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        firebaseStatus.isConnected
                          ? 'bg-emerald-950/60 border border-emerald-900/60 text-emerald-400'
                          : firebaseStatus.error
                          ? 'bg-rose-950/60 border border-rose-900/60 text-rose-400'
                          : 'bg-amber-950/60 border border-amber-900/60 text-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          firebaseStatus.isConnected
                            ? 'bg-emerald-400 animate-pulse'
                            : firebaseStatus.error
                            ? 'bg-rose-400'
                            : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                      {firebaseStatus.isConnected
                        ? 'Conectado em Tempo Real'
                        : firebaseStatus.error
                        ? 'Erro de Conexão'
                        : 'Sincronizando...'}
                    </span>
                  </div>
                  <p className="text-xs text-[#9E988F] mt-0.5">
                    Banco de dados em nuvem ativo com sincronização bidirecional e regras de segurança configuradas.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-sync-all-firebase"
                  type="button"
                  disabled={isSyncingFirebase}
                  onClick={handleSyncFirebaseNow}
                  className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Sincroniza todos os registros locais para as coleções do Firebase"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isSyncingFirebase ? 'Sincronizando...' : 'Sincronizar Coleções'}
                  </span>
                </button>

                <button
                  id="btn-bootstrap-firebase"
                  type="button"
                  disabled={isSyncingFirebase}
                  onClick={handleBootstrapFirebaseNow}
                  className="px-3.5 py-2 rounded-full bg-[#22222D] border border-[#333342] text-[#D8D4CE] hover:bg-[#2A2A38] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Inicializa as coleções no Firebase com dados padrão completos"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Inicializar Nuvem</span>
                </button>
              </div>
            </div>

            {firebaseActionFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  firebaseActionFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-900/60 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-900/60 text-rose-300'
                }`}
              >
                {firebaseActionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{firebaseActionFeedback.message}</span>
              </div>
            )}

            {/* Firebase Metadata Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#262630]">
                <span className="text-[10px] uppercase tracking-wider text-[#9E988F] font-semibold block">
                  Projeto Firebase
                </span>
                <span className="text-xs font-mono font-bold text-[#E6CA85] mt-0.5 block truncate">
                  eveline-studio-hair
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#262630]">
                <span className="text-[10px] uppercase tracking-wider text-[#9E988F] font-semibold block">
                  Instância Firestore
                </span>
                <span className="text-xs font-mono font-bold text-[#D8D4CE] mt-0.5 block truncate" title="ai-studio-sistemadeagendam-a637c1d7-db76-4865-a5bc-7c2b2b2dbc00">
                  ai-studio-sistemadeagendam...
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#262630]">
                <span className="text-[10px] uppercase tracking-wider text-[#9E988F] font-semibold block">
                  Última Sincronização
                </span>
                <span className="text-xs font-medium text-[#9E988F] mt-0.5 block">
                  {firebaseStatus.lastSyncTime
                    ? new Date(firebaseStatus.lastSyncTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'Ativa em tempo real'}
                </span>
              </div>
            </div>

            {/* Collections Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#D8D4CE] uppercase tracking-wider">
                  Coleções Integradas no Firestore
                </span>
                <span className="text-[11px] text-[#9E988F]">
                  8 coleções mapeadas e monitoradas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">services</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.services}
                    </span>
                    <span className="text-[10px] text-emerald-400">ativos</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">appointments</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.appointments}
                    </span>
                    <span className="text-[10px] text-[#C5A059]">pedidos</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">clients</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.clients}
                    </span>
                    <span className="text-[10px] text-sky-400">clientes</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">availability</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.availability}
                    </span>
                    <span className="text-[10px] text-[#9E988F]">dias</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">weeks</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.weeks}
                    </span>
                    <span className="text-[10px] text-[#9E988F]">semanas</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">blocked_slots</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.blockedSlots}
                    </span>
                    <span className="text-[10px] text-amber-400">bloqueios</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">notifications</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.notifications}
                    </span>
                    <span className="text-[10px] text-purple-400">avisos</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#121216] border border-[#262630] flex flex-col justify-between">
                  <span className="text-[11px] font-medium text-[#9E988F]">settings</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-bold text-[#F5F3EF]">
                      {firebaseStatus.collectionsCount.settings}
                    </span>
                    <span className="text-[10px] text-emerald-400">perfil</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
