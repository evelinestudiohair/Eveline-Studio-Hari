import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="bg-[#16161B] rounded-3xl p-8 border border-[#262630] shadow-2xs max-w-md text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/40 text-rose-400 border border-rose-900/50 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#E6CA85]">
              Ops! Ocorreu uma instabilidade na exibição
            </h3>
            <p className="text-xs text-[#9E988F]">
              Não se preocupe, seus dados e agendamentos estão salvos. Clique abaixo para recarregar esta seção.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B26F] text-[#0D0D10] text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
