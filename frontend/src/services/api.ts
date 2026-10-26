const API_BASE = '/api/v1';

export interface ProtectRequest {
  message: string;
  session_id?: string;
  enable_rag?: boolean;
  enable_ml?: boolean;
}

export interface ProtectResponse {
  request_id: string;
  verdict: 'ALLOW' | 'BLOCK' | 'REDACT';
  confidence: number;
  risk_level: string;
  attack_types: string[];
  reason: string;
  debate_triggered: boolean;
  processing_time_ms: number;
  assistant_response?: string;
  debate_id?: string;
  redacted_prompt?: string;
}

export interface DebateTranscript {
  request_id: string;
  prompt: string;
  triage: any;
  prosecutor: any;
  defender: any;
  verdict: any;
  rag_matches: number;
  processing_time_ms: number;
  created_at: string;
}

class APIClient {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async protect(request: ProtectRequest, token: string): Promise<ProtectResponse> {
    const response = await fetch(`${API_BASE}/protect`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Protection request failed');
    }

    return response.json();
  }

  async getDebate(debateId: string, token: string): Promise<DebateTranscript> {
    const response = await fetch(`${API_BASE}/debates/${debateId}`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch debate');
    }

    return response.json();
  }

  async getAnalytics(days: number, token: string): Promise<any> {
    const response = await fetch(`${API_BASE}/analytics?days=${days}`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  }

  async getIncidents(token: string, skip = 0, limit = 50): Promise<any[]> {
    const response = await fetch(`${API_BASE}/incidents?skip=${skip}&limit=${limit}`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch incidents');
    }

    return response.json();
  }

  async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  }
}

export const api = new APIClient();