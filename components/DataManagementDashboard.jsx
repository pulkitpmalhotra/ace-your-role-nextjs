// /components/DataManagementDashboard.jsx
function DataManagementDashboard({ userEmail }) {
  const [dataOverview, setDataOverview] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const [deletionStatus, setDeletionStatus] = useState('idle');
  
  const dataCategories = {
    profile: {
      name: 'Account Profile',
      description: 'Your account information, preferences, and settings',
      icon: '👤',
      records: dataOverview?.profile?.recordCount || 0,
      size: dataOverview?.profile?.dataSize || '0 KB',
      retention: 'Until account deletion'
    },
    conversations: {
      name: 'Practice Sessions',
      description: 'Voice conversations, transcripts, and session data',
      icon: '🎙️',
      records: dataOverview?.conversations?.recordCount || 0,
      size: dataOverview?.conversations?.dataSize || '0 KB',
      retention: '90 days (auto-delete)'
    },
    analytics: {
      name: 'Performance Data',
      description: 'Skill assessments, progress tracking, and feedback',
      icon: '📊',
      records: dataOverview?.analytics?.recordCount || 0,
      size: dataOverview?.analytics?.dataSize || '0 KB',
      retention: '2 years'
    },
    technical: {
      name: 'Technical Logs',
      description: 'Error logs, performance data, and system information',
      icon: '⚙️',
      records: dataOverview?.technical?.recordCount || 0,
      size: dataOverview?.technical?.dataSize || '0 KB',
      retention: '30 days'
    }
  };
  
  const handleExportData = async (category) => {
    setExportStatus('processing');
    try {
      const response = await fetch(`/api/data/export?category=${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ace-your-role-${category}-${Date.now()}.json`;
      a.click();
      
      setExportStatus('completed');
    } catch (error) {
      setExportStatus('failed');
    }
  };
  
  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete all ${category} data? This cannot be undone.`)) return;
    
    setDeletionStatus('processing');
    try {
      await fetch(`/api/data/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, category })
      });
      
      setDeletionStatus('completed');
      // Refresh data overview
      fetchDataOverview();
    } catch (error) {
      setDeletionStatus('failed');
    }
  };
  
  return (
    <div className="data-management-dashboard">
      <DataOverviewCards categories={dataCategories} />
      <CategoryExportControls onExport={handleExportData} />
      <RealTimeDataOverview data={dataOverview} />
      <ComplianceStatusMonitoring />
    </div>
  );
}
