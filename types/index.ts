// /types/index.ts

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  google_id?: string;
  created_at: string;
  updated_at?: string;
}

// Scenario types
export interface Scenario {
  id: string;
  title: string;
  character_name: string;
  character_role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  description?: string;
  industry?: string;
}

// Session types
export interface Session {
  id: string;
  user_email: string;
  scenario_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  conversation: ConversationMessage[];
  overall_score?: number;
  detailed_feedback?: DetailedFeedback;
}

export interface ConversationMessage {
  speaker: 'user' | 'character';
  message: string;
  timestamp: string;
  emotion?: string;
  confidence?: number;
}

export interface DetailedFeedback {
  opening: FeedbackItem;
  discovery: FeedbackItem;
  presentation: FeedbackItem;
  objection_handling: FeedbackItem;
  closing: FeedbackItem;
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  next_steps: string[];
}

export interface FeedbackItem {
  score: number;
  feedback: string;
  examples?: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Speech types
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

// Component props types
export interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
  isSelected?: boolean;
}

export interface ChatInterfaceProps {
  scenario: Scenario;
  userEmail: string;
  onEnd: (sessionId: string) => void;
}

export interface FeedbackDisplayProps {
  feedback: DetailedFeedback;
  sessionId: string;
  onClose: () => void;
}

// Form types
export interface LoginFormData {
  email: string;
  consent: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
}

// Analytics types
export interface UserAnalytics {
  totalSessions: number;
  averageScore: number;
  skillProgression: SkillProgression;
  recentSessions: Session[];
  recommendedScenarios: Scenario[];
}

export interface SkillProgression {
  opening: ProgressData;
  discovery: ProgressData;
  presentation: ProgressData;
  objection: ProgressData;
  closing: ProgressData;
}

export interface ProgressData {
  current: number;
  trend: 'improving' | 'stable' | 'declining';
  improvement: number;
  history: number[];
}

// Filter types
export interface ScenarioFilters {
  category?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
