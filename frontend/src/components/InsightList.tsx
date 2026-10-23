'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { getInsights } from '@/lib/api/insights';
import { getEntries } from '@/lib/api/entries';
import { ratingColors, getRatingIndex } from '@/lib/entry-ratings';

import type { Insight } from '@/types/insight';
import type { EntryResponse } from '@/types/entry';

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatInsightDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function InsightList() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [entries, setEntries] = useState<EntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [insightsData, entriesData] = await Promise.all([getInsights(), getEntries()]);

        if (active) {
          setInsights(insightsData);
          setEntries(entriesData);
        }
      } catch {
        if (active) {
          setError('No se ha podido cargar el historial de insights.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return <p className="text-maia-dark">Cargando insights...</p>;
  }

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }

  if (insights.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-maia-dark">Todavía no has generado ningún insight.</p>

        <Link href="/" className="inline-block text-sm font-medium text-maia-dark underline">
          Volver al inicio para generar uno →
        </Link>
      </div>
    );
  }

  const sortedInsights = [...insights].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const entriesById = new Map(entries.map((entry) => [entry._id, entry]));

  return (
    <div className="space-y-4">
      {sortedInsights.map((insight) => {
        const sourceEntries = insight.entryIds
          .map((id) => entriesById.get(id))
          .filter((entry): entry is EntryResponse => entry !== undefined)
          .sort((a, b) => b.date.localeCompare(a.date));

        return (
          <article
            key={insight._id}
            className="rounded-2xl bg-maia-light p-6 text-maia-dark shadow-sm"
          >
            {/* Fecha */}
            <h4 className="mb-5 text-lg font-semibold">{formatInsightDate(insight.createdAt)}</h4>

            {/* Resumen */}
            <section className="mb-6">
              <h5 className="mb-2 font-semibold">Resumen</h5>

              <p className="text-sm leading-relaxed">{insight.summary}</p>
            </section>

            {/* Patrones */}
            {insight.patterns.length > 0 && (
              <section className="mb-6">
                <h5 className="mb-3 font-semibold">Patrones identificados</h5>

                <div className="flex flex-col gap-2">
                  {insight.patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-maia-dark p-4 text-sm text-maia-light-2"
                    >
                      <span className="mr-2 text-maia-light">✦</span>
                      {pattern}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Temas para comentar */}
            {insight.topicsToDiscuss.length > 0 && (
              <section className="mb-6">
                <h5 className="mb-3 font-semibold">Temas para comentar con un profesional</h5>

                <div className="flex flex-col gap-2">
                  {insight.topicsToDiscuss.map((topic, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-maia-dark p-4 text-sm text-maia-light-2"
                    >
                      <span className="mr-2 text-maia-light">💬</span>
                      {topic}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Registros utilizados */}
            <details className="rounded-xl border border-maia-light/30 p-4">
              <summary className="cursor-pointer font-semibold text-maia-dark">
                Registros analizados ({insight.entryIds.length})
              </summary>

              <div className="mt-5 space-y-4">
                {sourceEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="rounded-xl bg-maia-dark p-4 text-sm text-maia-light-2"
                  >
                    <p className="mb-2 font-semibold">{formatDate(entry.date)}</p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'wellbeing', label: 'Bienestar', value: entry.wellbeing },
                        { key: 'sleep', label: 'Sueño', value: entry.sleep },
                        { key: 'energy', label: 'Energía', value: entry.energy },
                        { key: 'stress', label: 'Estrés', value: entry.stress },
                      ].map((rating) => {
                        const index = getRatingIndex(
                          rating.key as 'wellbeing' | 'sleep' | 'energy' | 'stress',
                          rating.value,
                        );

                        return (
                          <span
                            key={rating.key}
                            className={`
                                rounded-full border-2 px-3 py-1 text-sm font-medium text-maia-dark
                                ${ratingColors[index]}
                                `}
                          >
                            {rating.label}: {rating.value}/5
                          </span>
                        );
                      })}
                    </div>

                    {entry.symptoms.length > 0 && (
                      <p className="mt-3">
                        <span className="font-semibold">Síntomas:</span> {entry.symptoms.join(', ')}
                      </p>
                    )}

                    {entry.notes && (
                      <p className="mt-2">
                        <span className="font-semibold">Notas:</span> {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>

            {/* Aviso */}
            <p className="mt-5 text-xs text-maia-dark/70">
              Este análisis es orientativo y no sustituye la valoración de un profesional sanitario.
            </p>
          </article>
        );
      })}
    </div>
  );
}
