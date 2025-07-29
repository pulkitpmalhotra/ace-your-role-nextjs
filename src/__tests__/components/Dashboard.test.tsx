import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../components/Dashboard';
import { apiService } from '../../services/api';
import { Scenario } from '../../types';

// Mock the API service
jest.mock('../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  User: () => <div data-testid="user-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Loader: () => <div data-testid="loader-icon" />
}));

const mockScenarios: Scenario[] = [
  {
    id: '1',
    title: 'Sales Cold Call',
    description: 'Practice making effective cold calls',
    character_name: 'John Smith',
    character_role: 'Business Owner',
    character_personality: 'Skeptical but fair',
    difficulty: 'beginner',
    category: 'sales',
    subcategory: 'cold-calling',
    tags: ['sales', 'communication'],
    learning_objectives: ['Build rapport', 'Handle objections'],
    estimated_duration_minutes: 10,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockSessions = [
  {
    id: '1',
    scenario_id: '1',
    user_email: 'test@example.com',
    start_time: '2024-01-01T10:00:00Z',
    end_time: '2024-01-01T10:10:00Z',
    duration_minutes: 10,
    conversation: [],
    overall_score: 4.2,
    scenarios: mockScenarios[0]
  }
];

describe('Dashboard', () => {
  const defaultProps = {
    userEmail: 'test@example.com',
    onStartSession: jest.fn(),
    onViewFeedbackDashboard: jest.fn(),
    initialTab: 'scenarios',
    isMobile: false,
    onShowPrivacy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getScenariosWithFilters.mockResolvedValue({
      success: true,
      data: mockScenarios,
      meta: { total: 1 }
    });
    mockedApiService.getUserSessions.mockResolvedValue(mockSessions);
  });

  it('renders dashboard with scenarios tab active by default', async () => {
    render(<Dashboard {...defaultProps} />);
    
    expect(screen.getByText('🎯 Ace Your Role')).toBeInTheDocument();
    expect(screen.getByText('Practice Scenarios')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Sales Cold Call')).toBeInTheDocument();
    });
  });

  it('loads scenarios on mount', async () => {
    render(<Dashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockedApiService.getScenariosWithFilters).toHaveBeenCalledWith({});
    });
  });

  it('loads user sessions on mount', async () => {
    render(<Dashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockedApiService.getUserSessions).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('calls onStartSession when scenario start button is clicked', async () => {
    const onStartSession = jest.fn();
    render(<Dashboard {...defaultProps} onStartSession={onStartSession} />);
    
    await waitFor(() => {
      expect(screen.getByText('Sales Cold Call')).toBeInTheDocument();
    });
    
    const startButton = screen.getByText('Start Practice Session');
    fireEvent.click(startButton);
    
    expect(onStartSession).toHaveBeenCalledWith(mockScenarios[0]);
  });

  it('switches to progress tab when clicked', async () => {
    render(<Dashboard {...defaultProps} />);
    
    const progressTab = screen.getByText('Progress Dashboard');
    fireEvent.click(progressTab);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    mockedApiService.getScenariosWithFilters.mockRejectedValue(new Error('API Error'));
    
    render(<Dashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Dashboard {...defaultProps} />);
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('handles scenario filtering', async () => {
    render(<Dashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Sales Cold Call')).toBeInTheDocument();
    });
    
    // Simulate filter change (you would need to interact with ScenarioFilters component)
    // This would require more complex testing setup for the filters component
  });

  it('displays session statistics in progress tab', async () => {
    render(<Dashboard {...defaultProps} />);
    
    const progressTab = screen.getByText('Progress Dashboard');
    fireEvent.click(progressTab);
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('10m')).toBeInTheDocument(); // Practice time
    });
  });
});
