'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { createEntry, getSymptoms } from '@/lib/api/entries';
import { ratingFields, ratingColors, type RatingField } from '@/lib/entry-ratings';
import type { CreateEntry } from '@/types/entry';

const initialEntry: CreateEntry = {
  date: '',
  wellbeing: 0,
  sleep: 0,
  energy: 0,
  stress: 0,
  symptoms: [],
  notes: '',
};

const DEFAULT_SYMPTOMS = [
  'Cansancio',
  'Dolor de cabeza',
  'Hinchazón',
];

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function EntryForm() {
  const [entry, setEntry] = useState<CreateEntry>(() => ({
    ...initialEntry,
    date: getTodayDate(),
  }));
  const [symptomInput, setSymptomInput] = useState('');
  const [knownSymptoms, setKnownSymptoms] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSymptoms()
      .then(setKnownSymptoms)
      .catch(() => {
        console.error('No se han podido cargar los síntomas');
      });
  }, []);

  function updateRating(field: RatingField, value: number) {
    setEntry((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleSymptom(symptom: string) {
    setEntry((previous) => {
      const selected = previous.symptoms.includes(symptom);

      return {
        ...previous,
        symptoms: selected
          ? previous.symptoms.filter((item) => item !== symptom)
          : [...previous.symptoms, symptom],
      };
    });
  }

  function addSymptom() {
    const symptom = symptomInput.trim();

    if (!symptom) return;

    const existing = [...knownSymptoms, ...entry.symptoms].find(
      (item) => item.toLowerCase() === symptom.toLowerCase(),
    );

    const normalizedSymptom = existing ?? symptom;

    setEntry((previous) => ({
      ...previous,
      symptoms: previous.symptoms.includes(normalizedSymptom)
        ? previous.symptoms
        : [...previous.symptoms, normalizedSymptom],
    }));

    setSymptomInput('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (ratingFields.some(({ key }) => entry[key] < 1)) {
      setError('Selecciona una opción para cada indicador.');
      return;
    }

    setIsSaving(true);

    try {
      await createEntry(entry);

      // Los síntomas nuevos pasan a formar parte de los habituales.
      setKnownSymptoms((previous) => {
        const result = [...previous];

        for (const symptom of entry.symptoms) {
          if (!result.includes(symptom)) {
            result.push(symptom);
          }
        }

        return result;
      });

      setEntry({
        ...initialEntry,
        date: getTodayDate(),
      });
      setSymptomInput('');
      setSuccess(true);
    } catch {
      setError('No se ha podido guardar el registro. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-maia-dark">
      {/* Fecha */}
      <div>
        <label htmlFor="date" className="mb-2 block font-semibold text-maia-light-2">
          Fecha del registro
        </label>

        <input
          id="date"
          type="date"
          required
          value={entry.date}
          onChange={(event) =>
            setEntry((previous) => ({
              ...previous,
              date: event.target.value,
            }))
          }
          className="rounded-xl border border-maia-light border-2 bg-white px-2 py-1"
        />
      </div>

      {/* Indicadores visuales */}
      <div className="space-y-2">
        {ratingFields.map((field) => (
          <div key={field.key}>
            <h4 className="mb-2 font-semibold text-maia-light-2">{field.label}</h4>

            <div role="group" aria-label={field.label} className="grid grid-cols-5 gap-2 sm:gap-3">
              {field.icons.map((icon, index) => {
                const value = field.inverted ? 5 - index : index + 1;
                const selected = entry[field.key] === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${field.label}: ${field.descriptions[index]}`}
                    aria-pressed={selected}
                    onClick={() => updateRating(field.key, value)}
                    className={`
                      flex min-w-0 flex-col items-center gap-2
                      rounded-2xl border-2 px-1 py-2
                      transition-all duration-150
                      ${ratingColors[index]}
                      ${
                        selected
                          ? 'scale-105 ring-2 ring-maia-dark ring-offset-2'
                          : 'opacity-75 hover:scale-105 hover:opacity-100'
                      }
                    `}
                  >
                    <span aria-hidden="true" className="text-2xl sm:text-xl">
                      {icon}
                    </span>

                    <span className="text-center text-xs font-medium sm:text-sm">
                      {field.descriptions[index]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Síntomas */}
      <div>
        <h4 className="font-semibold text-maia-light-2">Síntomas</h4>

        <div className="mt-1">
          <p className="mt-1 mb-2 text-sm font-medium text-maia-light-2">
            {knownSymptoms.length > 0 ? 'Tus síntomas habituales' : 'Sugerencias'}
          </p>

          <div className="flex flex-wrap gap-2">
            {(knownSymptoms.length > 0 ? knownSymptoms : DEFAULT_SYMPTOMS).map((symptom) => {
              const selected = entry.symptoms.includes(symptom);

              return (
                <button
                  key={symptom}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-full border px-4 py-1 text-sm transition-colors ${
                    selected
                      ? 'border-maia-dark bg-maia-dark text-maia-light'
                      : 'border-maia-dark/20 bg-white text-maia-dark hover:border-maia-dark'
                  }`}
                >
                  {symptom} {selected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <input
            type="text"
            aria-label="Nuevo síntoma"
            placeholder="Añadir un síntoma..."
            value={symptomInput}
            onChange={(event) => setSymptomInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSymptom();
              }
            }}
            className="min-w-0 flex-1 rounded-xl border border-maia-dark/20 bg-white px-4 py-1"
          />

          <button
            type="button"
            onClick={addSymptom}
            aria-label="Añadir síntoma"
            className="rounded-xl bg-maia-light px-5 text-m text-maia-dark"
          >
            Añadir
          </button>
        </div>

        {entry.symptoms.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-maia-light-2">Síntomas seleccionados</p>

            <div className="flex flex-wrap gap-2">
              {entry.symptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  aria-label={`Quitar ${symptom}`}
                  className="rounded-full bg-maia-light px-4 py-2 text-sm font-medium text-maia-dark"
                >
                  {symptom} ×
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="mb-3 block font-semibold text-maia-light-2">
          ¿Quieres añadir algo más?
        </label>

        <textarea
          id="notes"
          rows={3}
          maxLength={1000}
          value={entry.notes ?? ''}
          placeholder="Escribe aquí tus notas..."
          onChange={(event) =>
            setEntry((previous) => ({
              ...previous,
              notes: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-maia-dark/20 bg-white p-4"
        />
      </div>

      {/* Mensajes */}
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="font-medium text-maia-light-2">
          ¡Registro guardado correctamente!
        </p>
      )}

      {/* Guardar */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-full bg-maia-light px-7 py-4 font-semibold text-maia-dark transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {isSaving ? 'Guardando...' : 'Guardar registro'}
      </button>
    </form>
  );
}
