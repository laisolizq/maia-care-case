import EntryForm from '@/components/EntryForm';
import InsightGenerator from '@/components/InsightGenerator';
import Link from 'next/link';

import { Suspense } from 'react';

// Componente principal de la página de inicio, que muestra un formulario para registrar el estado de ánimo del usuario y un generador de insights.
export default async function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-12">
          <h2 className="mb-4 text-4xl font-semibold">¿Cómo te encuentras hoy?</h2>
        </section>

        <section className="mb-8 rounded-3xl border bg-maia-light p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-maia-dark">Nuevo registro</h3>

            <Link
              href="/entries"
              className="rounded-full bg-maia-dark px-6 py-3 font-semibold text-maia-light transition-opacity hover:opacity-85"
            >
              Ver mis registros →
            </Link>
          </div>

          <p className="mb-6">Cuéntanos cómo te has sentido.</p>

          <div className="rounded-2xl bg-maia-dark p-8 text-center text-maia-light-2">
            <Suspense fallback={<div>Cargando formulario...</div>}>
              <EntryForm />
            </Suspense>
          </div>
        </section>

        <section className="rounded-3xl bg-maia-dark p-8">
          <h2 className="mb-4 text-xl font-semibold text-maia-light">Descubre tus patrones</h2>

          <InsightGenerator />
        </section>
      </div>
    </main>
  );
}
