// types/index.ts - Complete TypeScript definitions

export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: string;
  created_at: string;
  updated_at?: string;
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

export interface Session {
  id: string;
  scenario_id: string;
  user_email: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  conversation: ConversationMessage[];
  overall_score?: number;
  detailed_feedback?: string; // JSON string
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
  message?: string;
  meta?: {
    total?: number;
    filters?: any;
    timestamp?: string;
  };
}

export interface ScenarioFilters {
  category?: string;
  difficulty?: string;
  subcategory?: string;
  search?: string;
  tags?: string;
  limit?: number;
}

export interface AIResponseData {
  response: string;
  character: string;
  emotion: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: WordTiming[];
}

export interface WordTiming {
  word: string;
  startTime: string;
  endTime: string;
  confidence: number;
}

export interface SpeechSynthesisOptions {
  text: string;
  emotion?: string;
  gender?: 'male' | 'female' | 'neutral';
  character_name?: string;
  character_role?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface GoogleSpeechConfig {
  encoding: string;
  sampleRateHertz: number;
  languageCode: string;
  model?: string;
  useEnhanced?: boolean;
  enableAutomaticPunctuation?: boolean;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
}

// Component Props Types
export interface LoginProps {
  onLogin?: (email: string) => void;
  onShowPrivacy?: () => void;
}

export interface DashboardProps {
  userEmail: string;
  onStartSession: (scenario: Scenario) => void;
  onViewFeedbackDashboard: (tab?: string) => void;
  initialTab?: string;
  isMobile?: boolean;
  onShowPrivacy?: () => void;
}

export interface RoleplaySessionProps {
  scenario: Scenario;
  userEmail: string;
  onEndSession: (targetTab?: string) => void;
  isMobile?: boolean;
}

export interface EnhancedFeedbackProps {
  sessionId: string;
  basicFeedback: {
    performance: string;
    exchanges: number;
    duration: number;
    scenario: string;
    userEmail?: string;
  };
  onContinue: () => void;
  onViewDashboard: (tab?: string) => void;
}

// API Route Types
export interface NextAPIRequest extends Request {
  json(): Promise<any>;
}

export interface NextAPIResponse {
  status(code: number): NextAPIResponse;
  json(body: any): Response;
}

// Database Types (for Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      scenarios: {
        Row: Scenario;
        Insert: Omit<Scenario, 'id' | 'created_at'>;
        Update: Partial<Omit<Scenario, 'id'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id'>;
        Update: Partial<Omit<Session, 'id'>>;
      };
    };
  };
}
