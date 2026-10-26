import { apiGet, apiPost } from './client';

import type { CreateEntry, EntryResponse } from '@/types/entry';

// Función para obtener todos los registros desde la API, devolviendo un array de objetos EntryResponse.
export function getEntries(): Promise<EntryResponse[]> {
  return apiGet<EntryResponse[]>('/entries');
}

// Función para obtener los síntomas desde la API, devolviendo un array de strings.
export function getSymptoms(): Promise<string[]> {
  return apiGet<string[]>('/entries/symptoms');
}

// Función para crear un nuevo registro en la API, enviando un objeto CreateEntry y devolviendo el objeto EntryResponse correspondiente.
export function createEntry(entry: CreateEntry): Promise<EntryResponse> {
  return apiPost<EntryResponse>('/entries', entry);
}
