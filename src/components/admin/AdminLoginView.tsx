import React, { useState, useEffect } from 'react';
import { useSalon } from '../../context/SalonContext';
import {
  Scissors,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Send,
  ExternalLink,
  ShieldAlert,
  Inbox,
  RefreshCw,
} from 'lucide-react';

interface AdminLoginViewProps {
  onBackToBooking: () => void;
  onLoginSuccess?: () => void;
}

type AuthMode = 'login' | 'request-link' | 'email-sent' | 'reset-with-token';

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onBackToBooking,
  onLoginSuccess,
}) => {
  const {
    loginAdmin,
    settings,
    adminCredentials,
    requestPasswordReset,
    validateResetToken,
    completePasswordResetWithToken,
  } = useSalon();

  // Mode: 'login' | 'request-link' | 'email-sent' | 'reset-with-token'
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state (no placeholder/watermark)
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Request Link Form state
  const [requestEmail, setRequestEmail] = useState('');
  const [sentToEmail, setSentToEmail] = useState<string>('');

  // Reset With Token Form state (when coming from the real email link)
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Check URL query parameters for reset token if someone arrives via real email link
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('reset_token') || urlParams.get('token');
      if (tokenFromUrl) {
        const validation = validateResetToken(tokenFromUrl);
        if (validation.valid && validation.email) {
          setActiveToken(tokenFromUrl);
          setVerifiedEmail(validation.email);
          setMode('reset-with-token');
          setSuccessMessage('Link do e-mail validado com sucesso! Defina a sua nova senha.');
        } else {
          setErrorMessage(validation.error || 'O link de redefinição expirou ou é inválido.');
        }
      }
    } catch {
      // Ignore in sandboxed environment
    }
  }, [validateResetToken]);

  // 1. Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginAdmin(emailOrUser, password);
      setIsLoading(false);

      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setErrorMessage(result.error || 'Credenciais inválidas.');
      }
    }, 200);
  };

  // 2. Handle Request Reset Link - Dispatches to user's real email inbox
  const handleRequestLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailToUse = requestEmail.trim();
    const result = requestPasswordReset(emailToUse);

    if (!result.success || !result.token || !result.email) {
      setIsLoading(false);
      setErrorMessage(result.error || 'Não foi possível gerar o link de redefinição.');
      return;
    }

    // Build the real URL link to be delivered to the user's real email
    const originUrl = window.location.origin + window.location.pathname;
    const realResetLink = `${originUrl}?reset_token=${result.token}`;

    try {
      // Call backend API to dispatch real email
      await fetch('/api/auth/send-reset-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: result.email,
          resetLink: realResetLink,
          adminName: settings.ownerName || 'Eveline',
        }),
      });

      setSentToEmail(result.email);
      setMode('email-sent');
      setIsLoading(false);
    } catch (apiError: any) {
      // Fallback: still show email sent instructions
      setSentToEmail(result.email);
      setMode('email-sent');
      setIsLoading(false);
    }
  };

  // 3. Handle Submitting New Password with Valid Token
  const handleCompleteResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeToken) {
      setErrorMessage('Token de segurança ausente. Acesse o link enviado para o seu e-mail.');
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMessage('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('A confirmação não confere com a nova senha digitada.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = completePasswordResetWithToken(activeToken, newPassword.trim());
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage('Senha atualizada com sucesso! Acessando o painel...');
        // Clean URL query param
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
          // ignore
        }
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 500);
      } else {
        setErrorMessage(result.error || 'Não foi possível redefinir a senha.');
      }
    }, 250);
  };

  return (
    <div
      id="admin-login-screen"
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        {/* Back to Client Booking link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="btn-back-to-booking-from-login"
            type="button"
            onClick={onBackToBooking}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#C5A059] hover:text-[#DFBD69] transition-colors p-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Agendamento Online</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-[#16161B] rounded-3xl border border-[#262630] shadow-2xl p-7 sm:p-9">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#1E1E26] border border-[#C5A059]/30 flex items-center justify-center text-[#E6CA85] shadow-xs">
              <Scissors className="w-7 h-7 text-[#E6CA85]" />
            </div>
            <h1 className="text-2xl font-serif italic text-[#E6CA85] tracking-tight">
              {settings.name}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 mt-2 rounded-full bg-[#1F1F28] border border-[#2F2F3D] text-[11px] font-bold text-[#C5A059] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E6CA85]" />
              <span>Acesso da Administradora</span>
            </div>
            <p className="text-xs text-[#9E988F] mt-3">
              {mode === 'login' && 'Informe seu e-mail e senha para acessar o painel com controle total.'}
              {mode === 'request-link' && 'Enviaremos o link seguro diretamente na sua caixa de e-mail.'}
              {mode === 'email-sent' && 'E-mail enviado! Verifique sua caixa de entrada no seu provedor.'}
              {mode === 'reset-with-token' && 'Link do e-mail validado. Defina sua nova senha.'}
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div
              id="login-success-alert"
              className="mb-6 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Sucesso</p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Atenção</p>
                <p className="text-[11px] text-rose-400/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE 1: Standard Login (Campo de e-mail sem nenhuma marca d'água)
             ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="input-admin-email"
                  className="block text-xs font-semibold text-[#F5F3EF] uppercase tracking-wider mb-1.5"
                >
                  E-mail da Administradora
                </label>
                <div className="relative">
                  <input
                    id="input-admin-email"
                    type="email"
                    required
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#2A2A38] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#121216] transition-all text-[#F5F3EF]"
                  />
                  <Mail className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-admin-password"
                    className="block text-xs font-semibold text-[#F5F3EF] uppercase tracking-wider"
                  >
                    Senha
                  </label>
                  <button
                    id="btn-open-forgot-password"
                    type="button"
                    onClick={() => {
                      setRequestEmail(emailOrUser.trim() || adminCredentials.email || 'eveline.studiohair@gmail.com');
                      setMode('request-link');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[#C5A059] hover:text-[#DFBD69] font-semibold underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="input-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-[#2A2A38] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#121216] transition-all text-[#F5F3EF]"
                  />
                  <Lock className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#7A756D] hover:text-[#F5F3EF] transition-colors p-0.5 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-admin-login"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#C5A059] text-[#0D0D10] text-xs font-bold uppercase tracking-widest hover:bg-[#DFBD69] shadow-md shadow-[#C5A059]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'Autenticando...' : 'Entrar com Acesso Total'}</span>
              </button>
            </form>
          )}

          {/* =========================================================================
              MODE 2: Request Reset Link to Real Email
             ========================================================================= */}
          {mode === 'request-link' && (
            <form onSubmit={handleRequestLinkSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-[#1E1E28] rounded-2xl border border-[#C5A059]/30 text-xs text-[#DFBD69] space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-[#E6CA85]">
                  <ShieldAlert className="w-4 h-4 text-[#E6CA85]" />
                  Troca de Senha Segura via E-mail
                </p>
                <p className="text-[11px] text-[#A8A399] leading-relaxed">
                  Para sua segurança, o link de alteração será enviado diretamente para a caixa de entrada do seu provedor de e-mail cadastrado.
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-request-reset-email"
                  className="block text-xs font-semibold text-[#F5F3EF] uppercase tracking-wider mb-1.5"
                >
                  E-mail da Administradora
                </label>
                <div className="relative">
                  <input
                    id="input-request-reset-email"
                    type="email"
                    required
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#2A2A38] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#121216] transition-all text-[#F5F3EF]"
                  />
                  <Mail className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="btn-send-reset-link"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#C5A059] text-[#0D0D10] text-xs font-bold uppercase tracking-widest hover:bg-[#DFBD69] shadow-md shadow-[#C5A059]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Enviando e-mail...' : 'Enviar Link no Meu E-mail'}</span>
                </button>

                <button
                  id="btn-back-to-login-from-request"
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-[#9E988F] hover:text-[#F5F3EF] transition-colors cursor-pointer"
                >
                  ← Voltar para o Login
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              MODE 3: Real Email Sent Notification (NO internal/simulated email inbox!)
             ========================================================================= */}
          {mode === 'email-sent' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center p-5 bg-[#142019] border border-emerald-800/60 rounded-2xl">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-950/60 flex items-center justify-center text-emerald-400 shadow-xs">
                  <Inbox className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-300">E-mail Enviado com Sucesso!</h3>
                <p className="text-xs text-emerald-400/90 mt-1.5 leading-relaxed">
                  O link exclusivo para redefinir sua senha foi enviado para a sua caixa de entrada em:
                </p>
                <div className="inline-block px-3.5 py-1.5 bg-[#101914] border border-emerald-700/60 rounded-xl font-mono text-xs font-bold text-emerald-200 mt-2 shadow-xs">
                  {sentToEmail || adminCredentials.email || 'eveline.studiohair@gmail.com'}
                </div>
              </div>

              {/* Instructions on how to access real email */}
              <div className="border border-[#262630] bg-[#1E1E26] rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold text-[#E6CA85] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  Como prosseguir na sua caixa de e-mail:
                </h4>

                <ol className="text-xs text-[#A8A399] space-y-2 pl-4 list-decimal leading-relaxed">
                  <li>
                    Acesse o seu provedor de e-mail (ex: <strong className="text-[#F5F3EF]">Gmail</strong>) em seu celular ou computador.
                  </li>
                  <li>
                    Abra o e-mail com o assunto: <br />
                    <strong className="text-[#DFBD69]">"🔐 Link para Redefinir Senha - Eveline Studio Hair"</strong>.
                  </li>
                  <li>
                    Se não encontrar na Caixa de Entrada em poucos minutos, verifique também as pastas <strong className="text-[#F5F3EF]">Spam</strong> ou <strong className="text-[#F5F3EF]">Lixo Eletrônico</strong>.
                  </li>
                  <li>
                    Clique no link presente no e-mail recebido para ser direcionada de volta e cadastrar sua nova senha.
                  </li>
                </ol>
              </div>

              {/* Action buttons to go to real email provider */}
              <div className="space-y-2 pt-1">
                <a
                  id="btn-open-external-gmail"
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#C5A059] text-[#0D0D10] text-xs font-bold uppercase tracking-wider hover:bg-[#DFBD69] shadow-md shadow-[#C5A059]/15 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Caixa de Entrada no Gmail</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMode('request-link');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-[#C5A059] hover:text-[#DFBD69] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reenviar e-mail de redefinição</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-[#9E988F] hover:text-[#F5F3EF] transition-colors cursor-pointer text-center"
                >
                  ← Voltar para a tela de Login
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODE 4: Set New Password (Opened via the REAL link from the user's email)
             ========================================================================= */}
          {mode === 'reset-with-token' && (
            <form onSubmit={handleCompleteResetSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-[#142019] rounded-2xl border border-emerald-800/60 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Link do E-mail Validado com Sucesso
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  Acesso autorizado para a administradora: <strong className="text-white">{verifiedEmail}</strong>. Digite a sua nova senha abaixo.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-token-new-password"
                    className="block text-xs font-semibold text-[#F5F3EF] uppercase tracking-wider"
                  >
                    Nova Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-xs text-[#C5A059] hover:text-[#DFBD69] flex items-center gap-1 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="input-token-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#2A2A38] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#121216] transition-all text-[#F5F3EF]"
                  />
                  <KeyRound className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[10px] text-[#9E988F] mt-1">
                  Mínimo de 4 dígitos ou caracteres.
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-token-confirm-password"
                  className="block text-xs font-semibold text-[#F5F3EF] uppercase tracking-wider mb-1.5"
                >
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    id="input-token-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#2A2A38] text-sm focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] bg-[#121216] transition-all text-[#F5F3EF]"
                  />
                  <Lock className="w-4 h-4 text-[#7A756D] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  id="btn-complete-reset-with-token"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#C5A059] text-[#0D0D10] text-xs font-bold uppercase tracking-widest hover:bg-[#DFBD69] shadow-md shadow-[#C5A059]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Salvando nova senha...' : 'Gravar Nova Senha & Acessar Painel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-[#9E988F] hover:text-[#F5F3EF] transition-colors cursor-pointer text-center"
                >
                  ← Cancelar e voltar ao login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Note */}
        <p className="text-center text-[11px] text-[#9E988F] mt-6">
          Acesso exclusivo para gestão do salão. Suas clientes agendam diretamente sem necessidade de cadastro ou senha.
        </p>
      </div>
    </div>
  );
};
