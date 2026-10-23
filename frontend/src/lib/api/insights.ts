import { apiGet, apiPost } from './client';
import type { Insight } from '../../types/insight';

export function getInsights(): Promise<Insight[]> {
  return apiGet<Insight[]>('/insights');
}

export function generateInsight(): Promise<Insight> {
  return apiPost<Insight>('/insights');
}
