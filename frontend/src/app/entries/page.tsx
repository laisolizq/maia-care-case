import EntryList from '@/components/EntryList';
import Link from 'next/link';

// Componente de la página de registros, que muestra un historial de registros del usuario y un enlace para volver a la página de inicio.
export default function EntriesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="rounded-3xl bg-maia-light p-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-maia-dark">Mis registros</h1>

            <Link
              href="/"
              className="rounded-full bg-maia-dark px-6 py-3 font-semibold text-maia-light transition-opacity hover:opacity-85"
            >
              ← Volver al inicio
            </Link>
          </div>
          <p className="mb-8 text-maia-dark-2">Consulta cómo te has sentido en los últimos días.</p>
          <EntryList />
        </section>
      </div>
    </main>
  );
}
