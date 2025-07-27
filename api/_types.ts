// api/_types.ts
export interface Scenario {
  id: string;
  title: string;
  description: string;
  character_name: string;
  character_role: string;
  character_personality: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  scenario_id: string;
  user_email: string;
  start_time: string;
  end_time?: string;
  conversation: ConversationMessage[];
  feedback?: string;
  duration_minutes: number;
}

export interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
