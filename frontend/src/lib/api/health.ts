import { apiGet } from './client';

export interface HealthResponse {
  status: string;
  service: string;
}

// Función para obtener el estado del servicio desde la API, devolviendo un objeto HealthResponse.
export function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}
