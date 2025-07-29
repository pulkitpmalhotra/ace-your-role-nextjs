// Core type definitions
export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
  privacy_level: 'basic' | 'enhanced';
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  character_name: string;
  character_role: string;
  character_personality: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  subcategory?: string;
  tags?: string[];
  learning_objectives?: string[];
  estimated_duration_minutes?: number;
  is_active: boolean;
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
  scenarios?: Scenario;
}

export interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export interface FeedbackCategory {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface DetailedFeedback {
  overallScore: number;
  categories: {
    opening: FeedbackCategory;
    discovery: FeedbackCategory;
    presentation: FeedbackCategory;
    objection: FeedbackCategory;
    closing: FeedbackCategory;
  };
  overall: {
    strengths: string[];
    improvements: string[];
    nextFocus: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    filters?: Record<string, any>;
    [key: string]: any;
  };
}

// Component Props
export interface ScenarioFiltersProps {
  onFiltersChange: (filters: ScenarioFilters) => void;
  metadata?: {
    total?: number;
    availableCategories?: string[];
    availableSubcategories?: string[];
    availableDifficulties?: string[];
  };
}

export interface ScenarioFilters {
  category: string;
  difficulty: string;
  subcategory: string;
  search: string;
  tags: string;
  limit?: number;
}

export interface RoleplaySessionProps {
  scenario: Scenario;
  userEmail: string;
  onEndSession: (targetTab?: string) => void;
  isMobile: boolean;
}

export interface EnhancedFeedbackProps {
  sessionId: string;
  basicFeedback: {
    performance: string;
    exchanges: number;
    duration: number;
    scenario: string;
    userEmail: string;
  };
  onContinue: () => void;
  onViewDashboard: (tab?: string) => void;
}

// API Service Types
export interface CreateSessionRequest {
  scenarioId: string;
  userEmail: string;
}

export interface UpdateSessionRequest {
  sessionId: string;
  conversation?: ConversationMessage[];
  feedback?: string;
  durationMinutes?: number;
  endSession?: boolean;
}

export interface AIResponseRequest {
  scenarioId: string;
  userMessage: string;
  conversationHistory: ConversationMessage[];
}

export interface AIResponseData {
  response: string;
  character: string;
  emotion: string;
  gender: string;
}
