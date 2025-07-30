// types/index.ts - Minimal types for basic functionality
export interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  character_personality?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  subcategory?: string;
  tags?: string[];
  learning_objectives?: string[];
  estimated_duration_minutes?: number;
  is_active: boolean;
  created_at: string;
  industry?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    timestamp?: string;
    availableCategories?: string[];
    availableDifficulties?: string[];
    availableSubcategories?: string[];
  };
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: string;
  created_at: string;
}

export interface Session {
  id: string;
  scenario_id: string;
  user_email: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  conversation: ConversationMessage[];
  overall_score?: number;
  detailed_feedback?: string;
}

export interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
}
