import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Play, User, TrendingUp, BarChart3, Target, Calendar, Loader } from 'lucide-react';
import ScenarioFilters from './ScenarioFilters';
import { Scenario, Session, ScenarioFilters as Filters, APIResponse } from '../types';

interface DashboardProps {
  userEmail: string;
  onStartSession: (scenario: Scenario) => void;
  onViewFeedbackDashboard: (tab?: string) => void;
  initialTab: string;
  isMobile: boolean;
  onShowPrivacy: () => void;
}

interface DashboardState {
  scenarios: Scenario[];
  filteredScenarios: Scenario[];
  sessions: Session[];
  loading: boolean;
  scenariosLoading: boolean;
  error: string;
  activeTab: string;
  metadata: {
    total?: number;
    availableCategories?: string[];
    availableSubcategories?: string[];
    availableDifficulties?: string[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  onStartSession,
  onViewFeedbackDashboard,
  initialTab,
  isMobile,
  onShowPrivacy
}) => {
  const [state, setState] = useState<DashboardState>({
    scenarios: [],
    filteredScenarios: [],
    sessions: [],
    loading: true,
    scenariosLoading: false,
    error: '',
    activeTab: 'scenarios',
    metadata: {}
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setState(prev => ({ ...prev, activeTab: initialTab }));
    }
  }, [initialTab]);

  const loadInitialData = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await loadScenarios();
      
      try {
        const sessionsData = await apiService.getUserSessions(userEmail);
        setState(prev => ({ ...prev, sessions: sessionsData }));
      } catch (sessionError) {
        console.error('Failed to load sessions:', sessionError);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadScenarios = async (filters: Filters = {} as Filters): Promise<void> => {
    try {
      setState(prev => ({ ...prev, scenariosLoading: true }));
      console.log('Loading scenarios with filters:', filters);
      
      const response: APIResponse<Scenario[]> = await apiService.getScenariosWithFilters(filters);
      
      console.log('Scenarios loaded:', response);
      setState(prev => ({
        ...prev,
        scenarios: response.data || [],
        filteredScenarios: response.data || [],
        metadata: response.meta || {}
      }));
      
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scenarios';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, scenariosLoading: false }));
    }
  };

  const handleFiltersChange = (filters: Filters): void => {
    console.log('Filters changed:', filters);
    loadScenarios(filters);
  };

  const handleStartSession = (scenario: Scenario): void => {
    console.log('Dashboard: Start session button clicked for:', scenario.title);
    
    if (!scenario || !scenario.id) {
      console.error('Invalid scenario data');
      return;
    }
    
    onStartSession(scenario);
  };

  const handleDownloadReport = async (sessionId: string): Promise<void> => {
    try {
      console.log('Starting PDF download for session:', sessionId);
      await apiService.downloadFeedbackReport(sessionId, userEmail);
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  // ... rest of component implementation with proper TypeScript types
  
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Component JSX remains the same */}
    </div>
  );
};

export default Dashboard;
