// Key sections to update in app/feedback/page.tsx - Clear User Performance Focus

// FIXED: Updated header section to emphasize USER performance analysis
const FeedbackHeader = () => (
  <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
      <span className="text-3xl text-white">
        {error ? '💭' : feedback?.analysis_type === 'user-performance-focused' ? '🎯' : '📋'}
      </span>
    </div>
    <h1 className="text-4xl font-bold text-gray-900 mb-3">Your Performance Analysis</h1>
    <p className="text-xl text-gray-600">
      Here's how you performed in your professional role practice
    </p>
    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl mx-auto">
      <p className="text-blue-800 text-sm">
        <strong>📊 Analysis Focus:</strong> This feedback analyzes YOUR performance as the {getUserRoleFromScenario(sessionData?.scenario)} 
        practicing with {sessionData?.scenario?.character_name}. The AI character's responses are not evaluated.
      </p>
    </div>
  </div>
);

// Helper function to get user's practiced role
const getUserRoleFromScenario = (scenario: any) => {
  if (!scenario) return 'professional';
  
  const roleMap: Record<string, string> = {
    'sales': 'salesperson',
    'project-manager': 'project manager',
    'product-manager': 'product manager', 
    'leader': 'leader',
    'manager': 'manager',
    'strategy-lead': 'strategy lead',
    'support-agent': 'customer service representative',
    'data-analyst': 'data analyst',
    'engineer': 'engineer',
    'nurse': 'healthcare provider',
    'doctor': 'healthcare provider'
  };
  return roleMap[scenario.role] || 'professional';
};

// FIXED: Updated session overview to focus on USER performance
const SessionOverviewFixed = () => (
  <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="text-4xl">{getRoleEmoji(sessionData.scenario.role)}</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{sessionData.scenario.title}</h2>
          <p className="text-gray-600">
            You practiced as a <strong>{getUserRoleFromScenario(sessionData.scenario)}</strong> • 
            Conversing with {sessionData.scenario.character_name} • {sessionData.scenario.difficulty} level
          </p>
          <p className="text-sm text-blue-600 mt-1">
            💡 This analysis focuses on YOUR communication skills and performance
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.overall_score)}`}>
          {getScoreEmoji(feedback.overall_score)} {feedback.overall_score.toFixed(1)}
        </div>
        <p className="text-sm text-gray-600">Your Performance Score</p>
        <p className="text-xs text-gray-500 mt-1">Based on your {getUserRoleFromScenario(sessionData.scenario)} skills</p>
      </div>
    </div>

    {/* Session Stats - Updated labels */}
    <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{feedback.conversation_stats.total_exchanges}</div>
        <div className="text-sm text-gray-600">Conversation Exchanges</div>
        <div className="text-xs text-gray-500">Your engagement level</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{sessionData.duration}m</div>
        <div className="text-sm text-gray-600">Practice Duration</div>
        <div className="text-xs text-gray-500">Time you invested</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{feedback.conversation_stats.user_messages}</div>
        <div className="text-sm text-gray-600">Your Messages</div>
        <div className="text-xs text-gray-500">Your contributions</div>
      </div>
    </div>
  </div>
);

// FIXED: Coach feedback section with clearer USER focus
const CoachFeedbackFixed = () => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border border-blue-200">
    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
      <span className="text-2xl mr-3">👨‍🏫</span>
      Your Coach's Assessment of YOUR Performance
    </h3>
    <div className="bg-white rounded-lg p-6 border border-blue-200">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>📋 Evaluation Focus:</strong> Your coach analyzed how well YOU performed as a {getUserRoleFromScenario(sessionData?.scenario)} 
          in this practice scenario. The feedback below is specifically about your communication skills and professional approach.
        </p>
      </div>
      <p className="text-gray-800 text-lg leading-relaxed italic">
        "{feedback.human_feedback.overall_impression}"
      </p>
    </div>
  </div>
);

// FIXED: Performance sections with USER-focused headers
const PerformanceSectionsFixed = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    
    {/* Your Strengths */}
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
      <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center">
        <span className="text-2xl mr-3">✨</span>
        Your {getUserRoleFromScenario(sessionData?.scenario)} Strengths
      </h3>
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-green-800 text-sm">
          <strong>🎯 What YOU did well:</strong> These are the specific {getUserRoleFromScenario(sessionData?.scenario)} skills you demonstrated effectively.
        </p>
      </div>
      <div className="space-y-4">
        {feedback.human_feedback.what_worked_well.map((strength, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{strength}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Your Growth Areas */}
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-200">
      <h3 className="text-xl font-bold text-orange-800 mb-6 flex items-center">
        <span className="text-2xl mr-3">🎯</span>
        Your Growth Opportunities
      </h3>
      <div className="mb-4 p-3 bg-orange-50 rounded-lg">
        <p className="text-orange-800 text-sm">
          <strong>📈 Areas for YOU to develop:</strong> These are specific {getUserRoleFromScenario(sessionData?.scenario)} skills to focus on in future practice.
        </p>
      </div>
      <div className="space-y-4">
        {feedback.human_feedback.areas_to_improve.map((improvement, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-orange-600 text-sm">→</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{improvement}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// FIXED: Coaching advice section
const CoachingAdviceFixed = () => (
  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-200">
    <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
      <span className="text-2xl mr-3">🎓</span>
      Personal Coaching Advice for YOUR Development
    </h3>
    <div className="bg-white rounded-lg p-6 border border-purple-200">
      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-purple-800 text-sm">
          <strong>💡 Tailored for YOU:</strong> This advice is specifically designed to help you improve your {getUserRoleFromScenario(sessionData?.scenario)} skills.
        </p>
      </div>
      <p className="text-gray-800 text-lg leading-relaxed">
        {feedback.human_feedback.coaching_advice}
      </p>
    </div>
  </div>
);

// FIXED: Conversation preview with clearer labeling
const ConversationPreviewFixed = () => (
  <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-white/20">
    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
      <span className="text-2xl mr-3">💬</span>
      Your Practice Conversation
    </h3>
    
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-700 text-sm">
        <strong>📝 Conversation Overview:</strong> You practiced as a <strong>{getUserRoleFromScenario(sessionData?.scenario)}</strong> 
        while {sessionData.scenario.character_name} played the role of {sessionData.scenario.character_role}. 
        The analysis focuses on YOUR contributions to the conversation.
      </p>
    </div>
    
    <div className="space-y-4 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
      {sessionData.conversation.slice(0, 6).map((message, index) => (
        <div
          key={index}
          className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-md px-4 py-2 rounded-lg text-sm ${
              message.speaker === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <div className={`text-xs mb-1 ${message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
              {message.speaker === 'user' ? 
                `You (${getUserRoleFromScenario(sessionData.scenario)})` : 
                `${sessionData.scenario.character_name} (${sessionData.scenario.character_role})`
              }
            </div>
            {message.message}
          </div>
        </div>
      ))}
      {sessionData.conversation.length > 6 && (
        <p className="text-center text-gray-500 text-sm">
          ... and {sessionData.conversation.length - 6} more exchanges where YOU practiced your {getUserRoleFromScenario(sessionData.scenario)} skills
        </p>
      )}
    </div>
  </div>
);

// FIXED: AI Analysis badge with user focus
const AIAnalysisBadgeFixed = () => (
  feedback.analysis_type === 'user-performance-focused' && (
    <div className="text-center mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <h4 className="text-lg font-semibold text-green-800 mb-2">
        🤖 Advanced AI Performance Analysis
      </h4>
      <p className="text-green-700 text-sm">
        This personalized feedback was generated by analyzing YOUR specific performance as a {getUserRoleFromScenario(sessionData?.scenario)} 
        in this conversation. Every insight is tailored to help YOU improve your professional communication skills!
      </p>
    </div>
  )
);
