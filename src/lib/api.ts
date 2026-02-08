/**
 * API Client for CallPilot Backend
 * Connects frontend to FastAPI backend endpoints
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  ready_for_frontend?: boolean;
  [key: string]: any;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('callpilot_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('callpilot_token', token);
      } else {
        localStorage.removeItem('callpilot_token');
      }
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication
  async register(email: string, password: string, name?: string, business_name?: string) {
    const response = await this.request<{ access_token: string; token_type: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, name, business_name }),
      }
    );
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Demo Mode
  async getDemoCalls(sessionId?: string, userId?: number) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId.toString());
    return this.request(`/demo/calls?${params.toString()}`);
  }

  async getDemoUsage(sessionId?: string, userId?: number) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId.toString());
    return this.request(`/demo/usage?${params.toString()}`);
  }

  async incrementDemoUsage(featureName: string, sessionId?: string, userId?: number) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId.toString());
    const query = params.toString();
    const url = query ? `/demo/usage/${featureName}?${query}` : `/demo/usage/${featureName}`;
    return this.request(url, {
      method: 'PATCH',
    });
  }

  async getDemoVoice(sessionId?: string, userId?: number) {
    const params = new URLSearchParams();
    if (sessionId) params.append('session_id', sessionId);
    if (userId) params.append('user_id', userId.toString());
    return this.request(`/demo/voice?${params.toString()}`);
  }

  // Voice
  async previewVoice(data: {
    voice_id: string;
    sample_text?: string;
    tone?: number;
    speed?: number;
    energy?: number;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    save_preferences?: boolean;
  }, sessionId?: string) {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    return this.request(`/voice/preview${params}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listVoices(userId?: number, operatorId?: number, sessionId?: string, includeSaved = true) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (operatorId) params.append('operator_id', operatorId.toString());
    if (sessionId) params.append('session_id', sessionId);
    params.append('include_saved', includeSaved.toString());
    return this.request(`/voice/list?${params.toString()}`);
  }

  async saveVoice(data: {
    voice_id: string;
    voice_name: string;
    audio_sample_paths?: string[];
    cloned_voice_reference?: string;
    tone?: number;
    speed?: number;
    energy?: number;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    is_demo?: boolean;
  }, userId?: number, sessionId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (sessionId) params.append('session_id', sessionId);
    return this.request(`/voice/save?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavedVoices(userId?: number, sessionId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (sessionId) params.append('session_id', sessionId);
    return this.request(`/voice/saved?${params.toString()}`);
  }

  async applyVoiceToScript(scriptText: string, savedVoiceId: string, userId?: number, sessionId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (sessionId) params.append('session_id', sessionId);
    return this.request(`/voice/apply_to_script?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify({ script_text: scriptText, saved_voice_id: savedVoiceId }),
    });
  }

  // Dashboard & Insights
  async getOperatorInsights(days = 30) {
    return this.request(`/operator/insights?days=${days}`);
  }

  // Call Drafts
  async saveDraft(
    callLogId: number,
    data: {
      raw_transcript?: string;
      structured_intake?: any;
      agent_decisions?: any;
      voice_persona_id?: string;
      saved_voice_id?: string;
      call_outcome?: string;
      status?: string;
    },
    sessionId?: string
  ) {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    return this.request(`/call/save_draft?call_log_id=${callLogId}${params}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDraft(callLogId: number) {
    return this.request(`/call/draft/${callLogId}`);
  }

  async listCallsByOperator(limit = 50, offset = 0, includeDrafts = true) {
    return this.request(`/call/list_by_operator?limit=${limit}&offset=${offset}&include_drafts=${includeDrafts}`);
  }

  // Custom Scripts
  async saveCustomScript(data: {
    name: string;
    script_flow: any;
    is_active?: boolean;
    saved_voice_id?: string;
  }) {
    return this.request('/operator/custom_script/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async loadCustomScript(scriptId?: number) {
    const params = scriptId ? `?script_id=${scriptId}` : '';
    return this.request(`/operator/custom_script/load${params}`);
  }

  async deleteCustomScript(scriptId: number) {
    return this.request(`/operator/custom_script?script_id=${scriptId}`, {
      method: 'DELETE',
    });
  }

  // Industry Presets
  async setIndustryPreset(presetName: string) {
    return this.request('/operator/set_industry_preset', {
      method: 'POST',
      body: JSON.stringify({ preset_name: presetName }),
    });
  }

  async getCurrentPreset() {
    return this.request('/operator/current_preset');
  }

  // Scheduling
  async suggestOptimalSlots(userId?: number, preferredDate?: string, daysAhead = 7) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (preferredDate) params.append('preferred_date', preferredDate);
    params.append('days_ahead', daysAhead.toString());
    return this.request(`/schedule/suggest?${params.toString()}`);
  }

  // Context-Aware
  async getCallContext(userId: number) {
    return this.request(`/call/context/${userId}`);
  }

  // Recovery
  async getPendingRecoveries() {
    return this.request('/recovery/pending');
  }

  async triggerRecovery(callLogId: number) {
    return this.request(`/recovery/trigger/${callLogId}`, {
      method: 'POST',
    });
  }

  // Simulation
  async runSimulation(data: {
    num_calls?: number;
    industry_preset?: string;
    scenarios?: any[];
  }, sessionId?: string) {
    const params = sessionId ? `?session_id=${sessionId}` : '';
    return this.request(`/simulation/run${params}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feedback
  async submitFeedback(data: {
    rating: number;
    call_log_id?: number;
    comment?: string;
    feedback_type?: string;
  }) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFeedbackSummary(days = 30) {
    return this.request(`/feedback/summary?days=${days}`);
  }

  // Voice Input (Live Call)
  async processVoiceInput(data: {
    transcript: string;
    session_id?: string;
    user_id?: number;
  }) {
    return this.request('/voice/input', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Calendar
  async getCalendarEvents(start: string, end: string) {
    return this.request(`/calendar/events?start=${start}&end=${end}`);
  }

  // Explainable AI
  async getCallReasoning(callLogId: number) {
    return this.request(`/call/reason/${callLogId}`);
  }

  // Triage
  async performTriage(callLogId: number, data: {
    collected_data: any;
    industry_preset?: string;
  }) {
    return this.request(`/call/triage/${callLogId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);
export default api;
