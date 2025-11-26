/**
 * 🚀 SERVICIO CENTRALIZADO DE API DASHBOARD
 * Manejo de todas las llamadas API relacionadas con el dashboard
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  performance?: {
    processing_time_ms: number;
    optimal: boolean;
    cache_hit: boolean;
  };
  timestamp: string;
}

export class DashboardApiService {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
    };


    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      

      return data;
    } catch (error) {
      throw error;
    }
  }

  // 📊 Obtener métricas básicas
  async getBasicStats() {
    return this.makeRequest('/dashboard/basic-stats');
  }

  // 🎯 Obtener métricas completas
  async getCompleteMetrics(scope: string = 'complete') {
    return this.makeRequest(`/dashboard/complete-metrics?scope=${scope}`);
  }

  // 📱 Obtener datos en tiempo real
  async getRealTimeData() {
    return this.makeRequest('/dashboard/real-time');
  }

  // 📤 Exportar métricas
  async exportMetrics(format: string, metrics: string[] = ['all'], dateRange: string = 'last_30_days') {
    return this.makeRequest('/dashboard/export', {
      method: 'POST',
      body: JSON.stringify({
        format,
        metrics,
        dateRange
      })
    });
  }

  // 🔄 Establecer conexión SSE para tiempo real
  establishSSEConnection(onMessage: (data: any) => void, onError: (error: any) => void) {
    const eventSource = new EventSource(`${this.baseUrl}/dashboard/real-time`, {
      // Note: EventSource doesn't support custom headers directly
      // Would need to use a different approach for authenticated SSE
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
        onError(error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      onError(error);
    };

    return eventSource;
  }

  // 🔧 Actualizar token de autenticación
  updateToken(newToken: string) {
    this.token = newToken;
    localStorage.setItem('token', newToken);
  }

  // 🗑️ Limpiar token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

// Instancia singleton
export const dashboardApi = new DashboardApiService();