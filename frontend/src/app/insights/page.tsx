import Link from 'next/link';

import InsightList from '@/components/InsightList';

export default function InsightsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="mb-2 text-3xl font-semibold text-maia-dark">Historial de insights</h1>
        <Link
          href="/"
          className="rounded-full bg-maia-dark px-6 py-3 font-semibold text-maia-light transition-opacity hover:opacity-85"
        >
          ← Volver al inicio
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-maia-dark/70">
          Consulta tus análisis anteriores y descubre cómo ha evolucionado tu bienestar.
        </p>
      </div>

      <InsightList />
    </main>
  );
}
