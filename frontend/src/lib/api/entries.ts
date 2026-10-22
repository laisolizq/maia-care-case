import { apiGet, apiPost } from './client';

import type { CreateEntry, EntryResponse } from '@/types/entry';

export function getEntries(): Promise<EntryResponse[]> {
  return apiGet<EntryResponse[]>('/entries');
}

export function getSymptoms(): Promise<string[]> {
  return apiGet<string[]>('/entries/symptoms');
}

export function createEntry(entry: CreateEntry): Promise<EntryResponse> {
  return apiPost<EntryResponse>('/entries', entry);
}
