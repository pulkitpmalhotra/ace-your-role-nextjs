// Create new file: src/components/ScenarioFilters.js
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

function ScenarioFilters({ onFiltersChange, metadata = {} }) {
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    subcategory: 'all',
    search: '',
    tags: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Category options with display names
  const categoryOptions = {
    all: 'All Categories',
    sales: 'Sales Training',
    leadership: 'Leadership & Management',
    healthcare: 'Healthcare Training',
    support: 'Customer Support',
    legal: 'Legal & Compliance'
  };

  // Difficulty options
  const difficultyOptions = {
    all: 'All Levels',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  };

  // Subcategory options based on selected category
  const getSubcategoryOptions = (category) => {
    const options = { all: 'All Subcategories' };
    
    if (metadata.availableSubcategories?.length > 0) {
      metadata.availableSubcategories.forEach(sub => {
        options[sub] = sub.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      });
    } else {
      // Fallback options based on category
      switch (category) {
        case 'sales':
          Object.assign(options, {
            'google-ads': 'Google Ads',
            'amazon-ads': 'Amazon Ads',
            'meta-ads': 'Meta Ads',
            'aws': 'AWS Sales',
            'google-cloud': 'Google Cloud',
            'saas': 'SaaS Sales'
          });
          break;
        case 'leadership':
          Object.assign(options, {
            'team-management': 'Team Management',
            'executive-coaching': 'Executive Coaching',
            'performance-management': 'Performance Management'
          });
          break;
        case 'healthcare':
          Object.assign(options, {
            'patient-communication': 'Patient Communication',
            'medical-consultation': 'Medical Consultation'
          });
          break;
        case 'support':
          Object.assign(options, {
            'customer-service': 'Customer Service',
            'escalation-handling': 'Escalation Handling'
          });
          break;
      }
    }
    
    return options;
  };

  // Update filters and notify parent with debounce for search
  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset subcategory when category changes
    if (key === 'category' && value !== filters.category) {
      newFilters.subcategory = 'all';
    }
    
    setFilters(newFilters);
    
    // Debounce search input
    if (key === 'search') {
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        onFiltersChange(newFilters);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      onFiltersChange(newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters = {
      category: 'all',
      difficulty: 'all',
      subcategory: 'all',
      search: '',
      tags: ''
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== ''
  );

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '16px'
      }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af'
        }}>
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search scenarios by title, description, or character..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.3s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Quick Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Category Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {Object.entries(categoryOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => updateFilter('difficulty', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {Object.entries(difficultyOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter (only show if category is selected) */}
        {filters.category !== 'all' && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Subcategory
            </label>
            <select
              value={filters.subcategory}
              onChange={(e) => updateFilter('subcategory', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              {Object.entries(getSubcategoryOptions(filters.category)).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: showAdvanced ? '16px' : '0'
      }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '4px 0'
          }}
        >
          <Filter size={16} />
          Advanced Filters
          <ChevronDown 
            size={16} 
            style={{
              transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.875rem',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. google-ads, enterprise, roi"
              value={filters.tags}
              onChange={(e) => updateFilter('tags', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}>
              Enter tags separated by commas to find specific types of scenarios
            </p>
          </div>
        </div>
      )}

      {/* Results Count */}
      {metadata.total !== undefined && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {metadata.total === 0 ? (
            <span>No scenarios found matching your criteria</span>
          ) : (
            <span>
              Found <strong>{metadata.total}</strong> scenario{metadata.total !== 1 ? 's' : ''}
              {hasActiveFilters && ' matching your filters'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ScenarioFilters;
