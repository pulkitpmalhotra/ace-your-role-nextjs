// New component: src/components/DataManagement.js
function DataManagement({ userEmail }) {
  const [dataOverview, setDataOverview] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  
  const dataCategories = {
    profile: 'Account information and preferences',
    sessions: 'Practice session recordings and transcripts',
    feedback: 'Performance analytics and coaching recommendations',
    usage: 'Platform usage statistics and error logs'
  };

  return (
    <div className="data-management">
      <h2>Your Data & Privacy Controls</h2>
      
      {/* Data Overview */}
      <DataOverviewCard overview={dataOverview} />
      
      {/* Granular Controls */}
      <div className="data-controls">
        {Object.entries(dataCategories).map(([key, description]) => (
          <DataCategoryControl 
            key={key}
            category={key}
            description={description}
            onExport={() => exportCategory(key)}
            onDelete={() => deleteCategory(key)}
          />
        ))}
      </div>
      
      {/* Account Deletion */}
      <DangerZone onDeleteAccount={handleAccountDeletion} />
    </div>
  );
}
