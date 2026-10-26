import { CalendarCheck, MessageCircle, Video } from 'lucide-react';

export function ConsultationSteps() {
  const steps = [
    {
      icon: <CalendarCheck aria-hidden />,
      title: 'Před konzultací',
      text: 'Rezervace je zdarma. Nepotřebuješ diagnózu ani doporučení a nemusíš předem popisovat, co řešíš.',
    },
    {
      icon: <Video aria-hidden />,
      title: 'Konzultace online',
      text: 'Konzultace trvá 30 nebo 50 minut a probíhá přes videohovor. V prototypu se hovor jen simuluje.',
    },
    {
      icon: <MessageCircle aria-hidden />,
      title: 'Po konzultaci',
      text: 'Společně se domluvíte, co dává smysl dál. Jedna konzultace nemusí stačit a nikdo neslibuje konkrétní výsledek.',
    },
  ];
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-brand-800 [&_svg]:size-5">{s.icon}</span>
          <div>
            <p className="font-medium text-ink">
              <span className="sr-only">Krok {i + 1}: </span>
              {s.title}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
