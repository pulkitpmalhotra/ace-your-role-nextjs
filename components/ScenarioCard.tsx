// /components/ScenarioCard.tsx
import React from 'react';
import { Scenario } from '@/types';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

const difficultyColors: Record<Scenario['difficulty'], string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

const ScenarioCard: React.FC<ScenarioCardProps> = ({ 
  scenario, 
  onSelect, 
  isSelected = false,
  isLoading = false 
}) => {
  const handleClick = () => {
    if (!isLoading) {
      onSelect(scenario);
    }
  };

  return (
    <div
      className={`scenario-card ${isSelected ? 'selected' : ''} ${isLoading ? 'opacity-50' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-selected={isSelected}
      aria-label={`${scenario.title} - ${scenario.character_name}, ${scenario.difficulty} level`}
    >
      <div className="scenario-header">
        <h3 className="scenario-title">{scenario.title}</h3>
        <span className={`difficulty-badge ${difficultyColors[scenario.difficulty]}`}>
          {scenario.difficulty}
        </span>
      </div>
      
      <div className="scenario-body">
        <p className="character-info">
          <strong>{scenario.character_name}</strong> - {scenario.character_role}
        </p>
        {scenario.description && (
          <p className="scenario-description">{scenario.description}</p>
        )}
        <div className="scenario-meta">
          <span className="category-tag">{scenario.category}</span>
          {scenario.industry && (
            <span className="industry-tag">{scenario.industry}</span>
          )}
        </div>
      </div>
      
      {isSelected && (
        <div className="selected-indicator">
          <span>✓ Selected</span>
        </div>
      )}
    </div>
  );
};

export default ScenarioCard;
