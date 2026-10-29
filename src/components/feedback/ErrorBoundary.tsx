import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Obrazovka, která se zobrazí místo spadlé části aplikace. */
  fallback: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Změna klíče (např. adresy stránky) chybu automaticky resetuje. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Zachytí chybu při vykreslování a místo prázdné stránky ukáže
 * srozumitelnou chybovou obrazovku (obdoba error.js v Next.js).
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    // Prototyp nesbírá analytiku; chybu jen vypíšeme do konzole pro ladění.
    console.error('Chyba v aplikaci:', error, info.componentStack);
  }

  override componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) return this.props.fallback({ error: this.state.error, reset: this.reset });
    return this.props.children;
  }
}
