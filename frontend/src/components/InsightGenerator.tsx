'use client';

import { useState } from 'react';
import Link from 'next/link';

import { generateInsight, getInsights } from '@/lib/api/insights';
import { ApiError } from '@/lib/api/client';
import type { Insight } from '@/types/insight';

export default function InsightGenerator() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const previousInsights = await getInsights();

      const result = await generateInsight();

      setInsight(result);

      const alreadyExisted = previousInsights.some((previous) => previous._id === result._id);

      if (alreadyExisted) {
        setMessage('✓ Este análisis ya estaba actualizado.');
      } else {
        setMessage('✨ Nuevo análisis generado correctamente.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('No se ha podido generar el insight. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-full bg-maia-light px-6 py-3 font-medium text-maia-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analizando...' : 'Generar insight'}
        </button>

        <Link
          href="/insights"
          className="rounded-full bg-maia-light px-6 py-3 font-semibold text-maia-dark transition-opacity hover:opacity-85"
        >
          Ver historial de insights →
        </Link>
      </div>

      {message && <p className="mb-4 text-sm font-medium text-maia-light">{message}</p>}

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {insight && (
        <div className="space-y-5 rounded-2xl bg-maia-light p-5">
          <section>
            <h3 className="mb-2 font-semibold text-maia-dark">Tu análisis de bienestar</h3>

            <p className="text-sm leading-relaxed text-maia-dark">{insight.summary}</p>
          </section>

          {insight.patterns.length > 0 && (
            <section>
              <h3 className="mb-2 font-semibold text-maia-dark">Patrones identificados</h3>

              <ul className="list-disc space-y-2 pl-5 text-sm text-maia-dark">
                {insight.patterns.map((pattern, index) => (
                  <li key={index}>{pattern}</li>
                ))}
              </ul>
            </section>
          )}

          {insight.topicsToDiscuss.length > 0 && (
            <section>
              <h3 className="mb-2 font-semibold text-maia-dark">
                Temas para comentar con un profesional
              </h3>

              <ul className="list-disc space-y-2 pl-5 text-sm text-maia-dark">
                {insight.topicsToDiscuss.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-maia-dark/60">
            Este análisis es orientativo y no sustituye el consejo de un profesional sanitario.
          </p>
        </div>
      )}
    </div>
  );
}
