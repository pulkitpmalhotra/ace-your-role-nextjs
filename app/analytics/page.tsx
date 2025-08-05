// app/analytics/page.tsx - Updated role mappings for analytics

// Updated role emoji mapping for analytics
const getRoleEmoji = (role: string) => {
  const emojiMap: Record<string, string> = {
    'sales': '💼',
    'project-manager': '📋',
    'product-manager': '📱', 
    'leader': '👑',
    'manager': '👥',
    'strategy-lead': '🎯',
    'support-agent': '🎧',
    'data-analyst': '📊',
    'engineer': '👩‍💻',
    'nurse': '👩‍⚕️',
    'doctor': '🩺'
  };
  return emojiMap[role] || '💬';
};

// Updated role descriptions for analytics
const getRoleDescription = (role: string) => {
  const descriptions: Record<string, string> = {
    'sales': 'Practice consultative selling and customer relationship building',
    'project-manager': 'Master project coordination, timeline management, and stakeholder communication',
    'product-manager': 'Develop product strategy, roadmap planning, and cross-functional leadership',
    'leader': 'Practice vision communication, strategic thinking, and organizational influence',
    'manager': 'Develop team management, performance coaching, and people leadership skills',
    'strategy-lead': 'Practice strategic planning, market analysis, and executive communication',
    'support-agent': 'Master customer service, problem resolution, and technical support skills',
    'data-analyst': 'Practice data presentation, insights communication, and analytical thinking',
    'engineer': 'Develop technical communication, code reviews, and solution architecture discussions',
    'nurse': 'Practice patient care communication, medical procedures, and healthcare team collaboration',
    'doctor': 'Master patient consultation, diagnosis communication, and treatment planning discussions'
  };
  return descriptions[role] || 'Professional communication practice';
};

// In the Role Progress section, update the mapping:
{userProgress.map((progress) => (
  <div key={progress.role} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/20">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getRoleEmoji(progress.role)}</div>
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">
            {progress.role.replace('-', ' ')} {/* Format hyphenated role names */}
          </h3>
          <p className="text-sm text-gray-600">Last practiced: {formatDate(progress.last_session_date)}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${getScoreColor(progress.average_score)}`}>
          {progress.average_score ? progress.average_score.toFixed(1) : '0.0'}/5.0
        </div>
        <div className="text-xs text-gray-500">Average Score</div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-lg font-semibold text-gray-900">{progress.total_sessions}</div>
        <div className="text-xs text-gray-600">Sessions</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-gray-900">{progress.total_minutes}m</div>
        <div className="text-xs text-gray-600">Time</div>
      </div>
      <div>
        <div className={`text-lg font-semibold ${getScoreColor(progress.best_score)}`}>
          {progress.best_score ? progress.best_score.toFixed(1) : '0.0'}
        </div>
        <div className="text-xs text-gray-600">Best Score</div>
      </div>
    </div>
  </div>
))}

// Updated insights section for new roles
{analyticsData.summary.total_sessions > 0 && (
  <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
      <span className="text-xl mr-3">💡</span>
      Insights & Recommendations
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Performance Insights */}
      <div className="bg-white rounded-xl p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Performance Insights</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            You've practiced {analyticsData.summary.total_sessions} sessions across {analyticsData.summary.total_roles} professional roles
          </li>
          {analyticsData.summary.best_role && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Your strongest area is <strong>{analyticsData.summary.best_role.role.replace('-', ' ')}</strong> with {analyticsData.summary.best_role.best_score.toFixed(1)}/5.0
            </li>
          )}
          {analyticsData.summary.streak_days > 0 && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Great job maintaining a {analyticsData.summary.streak_days}-day practice streak!
            </li>
          )}
        </ul>
      </div>

      {/* Next Steps with role-specific recommendations */}
      <div className="bg-white rounded-xl p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Recommended Next Steps</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Practice daily to maintain your momentum across different roles
          </li>
          {analyticsData.summary.overall_average_score < 3.5 && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Focus on fundamental communication skills with beginner scenarios
            </li>
          )}
          {analyticsData.summary.overall_average_score >= 4 && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Try advanced scenarios to challenge yourself in new professional roles
            </li>
          )}
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Explore new roles like {getUnpracticedRoles(userProgress).slice(0, 2).join(' and ')} to build diverse skills
          </li>
        </ul>
      </div>
    </div>
  </div>
)}

// Helper function to suggest unpracticed roles
const getUnpracticedRoles = (userProgress: UserProgress[]): string[] => {
  const allRoles = ['sales', 'project-manager', 'product-manager', 'leader', 'manager', 'strategy-lead', 'support-agent', 'data-analyst', 'engineer', 'nurse', 'doctor'];
  const practicedRoles = userProgress.map(p => p.role);
  const unpracticed = allRoles.filter(role => !practicedRoles.includes(role));
  
  return unpracticed.map(role => role.replace('-', ' '));
};
