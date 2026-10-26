import { apiGet, apiPost } from './client';
import type { Insight } from '../../types/insight';

// Función para obtener los insights desde la API, devolviendo un array de objetos Insight.
export function getInsights(): Promise<Insight[]> {
  return apiGet<Insight[]>('/insights');
}

// Función para generar un nuevo insight en la API, devolviendo el objeto Insight correspondiente.
export function generateInsight(): Promise<Insight> {
  return apiPost<Insight>('/insights');
}
