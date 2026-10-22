import EntryForm from '@/components/EntryForm';
import EntryList from '@/components/EntryList';
import Link from 'next/link';

import { Suspense } from 'react';

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
          <h3 className="mb-2 text-2xl font-semibold text-maia-light">Descubre tus patrones</h3>

          <p className="mb-6 max-w-2xl text-maia-light-2">
            Utiliza tus registros para descubrir posibles relaciones entre tu descanso, energía,
            estrés y bienestar.
          </p>

          <button
            type="button"
            disabled
            className="rounded-full bg-maia-light px-7 py-3 font-medium text-maia-dark font-semibold"
          >
            Generar un nuevo insight
          </button>

          <p className="mt-3 text-sm text-maia-light-2">
            Disponible cuando conectemos la generación de insights.
          </p>
        </section>
      </div>
    </main>
  );
}
