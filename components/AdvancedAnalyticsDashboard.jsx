// /components/AdvancedAnalyticsDashboard.jsx
function AdvancedFeedbackDashboard({ userEmail }) {
  const [analytics, setAnalytics] = useState(null);
  
  const skillTrends = {
    opening: calculateTrend(sessions, 'opening'),
    discovery: calculateTrend(sessions, 'discovery'),
    presentation: calculateTrend(sessions, 'presentation'),
    objection: calculateTrend(sessions, 'objection'),
    closing: calculateTrend(sessions, 'closing')
  };
  
  return (
    <div className="advanced-analytics">
      <SkillProgressionChart trends={skillTrends} />
      <CompetencyRadarChart currentScores={latestScores} />
      <ImprovementRecommendations based={analytics.weakestAreas} />
      <NextSessionSuggestions scenarios={recommendedScenarios} />
    </div>
  );
}

function calculateTrend(sessions, skill) {
  // Calculate skill progression over time
  const scores = sessions.map(s => s.feedback?.[skill] || 0);
  return {
    current: scores[scores.length - 1],
    trend: calculateLinearRegression(scores),
    improvement: scores[scores.length - 1] - scores[0]
  };
}
