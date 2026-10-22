'use client';

import { useEffect, useState } from 'react';

import { getEntries } from '@/lib/api/entries';
import { ratingFields, ratingColors, getRatingIndex } from '@/lib/entry-ratings';
import type { EntryResponse } from '@/types/entry';

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');

  return `${day}/${month}/${year}`;
}

export default function EntryList() {
  const [entries, setEntries] = useState<EntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEntries() {
      try {
        const data = await getEntries();

        if (active) {
          setEntries(data);
        }
      } catch {
        if (active) {
          setError('No se han podido cargar los registros.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadEntries();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return <p className="text-maia-dark">Cargando registros...</p>;
  }

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }

  if (entries.length === 0) {
    return <p className="text-maia-dark">Todavía no tienes registros.</p>;
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {sortedEntries.map((entry) => (
        <article
          key={entry._id}
          className="rounded-2xl bg-maia-dark p-6 text-maia-light-2 shadow-sm"
        >
          <h4 className="mb-4 text-lg font-semibold">{formatDate(entry.date)}</h4>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ratingFields.map((field) => {
              const value = entry[field.key];
              const index = getRatingIndex(field.key, value);

              return (
                <div
                  key={field.key}
                  className={`
          rounded-xl border-2 p-4 text-center text-maia-dark
          ${ratingColors[index] ?? 'border-gray-200 bg-gray-100'}
        `}
                >
                  <p className="text-sm font-semibold">{field.label}</p>

                  <p className="my-3 text-3xl">{field.icons[index] ?? '—'}</p>

                  <p className="text-sm font-medium">{field.descriptions[index] ?? 'Sin datos'}</p>
                </div>
              );
            })}
          </div>

          {entry.symptoms.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Síntomas</p>

              <div className="flex flex-wrap gap-2">
                {entry.symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="rounded-full bg-maia-light px-3 py-1 text-sm text-maia-dark"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <div className="mt-4">
              <p className="text-sm font-semibold">Notas</p>
              <p className="mt-1 text-sm">{entry.notes}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
