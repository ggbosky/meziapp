import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, Info, X } from 'lucide-react';
import { cn } from './cn';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'info';
}

const ToastContext = createContext<(text: string, tone?: ToastMessage['tone']) => void>(() => {});

/** Krátká potvrzení akcí. Obsah se oznamuje čtečkám přes aria-live. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setMessages((list) => list.filter((m) => m.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success') => {
      const id = ++counter.current;
      setMessages((list) => [...list.slice(-2), { id, text, tone }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), 5000));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-md animate-enter items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-raised',
              m.tone === 'success' ? 'border-brand-700 bg-brand-900 text-white' : 'border-line bg-surface text-ink',
            )}
          >
            {m.tone === 'success' ? <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" /> : <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />}
            <p className="flex-1 leading-relaxed">{m.text}</p>
            <button type="button" onClick={() => dismiss(m.id)} className="-m-1.5 inline-flex size-8 items-center justify-center rounded-full opacity-80 hover:opacity-100" aria-label="Zavřít oznámení">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
