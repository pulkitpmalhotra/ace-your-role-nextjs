// /__tests__/components/ScenarioCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScenarioCard from '@/components/ScenarioCard';
import { Scenario } from '@/types';

describe('ScenarioCard', () => {
  const mockScenario: Scenario = {
    id: '1',
    title: 'Cold Call Champion',
    character_name: 'Sarah Chen',
    character_role: 'VP of Operations',
    difficulty: 'intermediate',
    category: 'sales',
    description: 'Practice your cold calling skills',
    industry: 'SaaS'
  };
  
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders scenario information correctly', () => {
    render(<ScenarioCard scenario={mockScenario} onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Cold Call Champion')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('VP of Operations')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
  });
  
  it('calls onSelect when clicked', () => {
    render(<ScenarioCard scenario={mockScenario} onSelect={mockOnSelect} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockScenario);
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });
  
  it('shows selected state when isSelected is true', () => {
    render(
      <ScenarioCard 
        scenario={mockScenario} 
        onSelect={mockOnSelect} 
        isSelected={true} 
      />
    );
    
    expect(screen.getByText('✓ Selected')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-selected', 'true');
  });
  
  it('disables interaction when isLoading is true', () => {
    render(
      <ScenarioCard 
        scenario={mockScenario} 
        onSelect={mockOnSelect} 
        isLoading={true} 
      />
    );
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(card).toHaveClass('opacity-50');
  });
  
  it('handles keyboard navigation', () => {
    render(<ScenarioCard scenario={mockScenario} onSelect={mockOnSelect} />);
    
    const card = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyPress(card, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyPress(card, { key: ' ', code: 'Space', charCode: 32 });
    expect(mockOnSelect).toHaveBeenCalledTimes(2);
  });
});
