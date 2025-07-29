// /utils/gdprCompliance.js
export const dataClassification = {
  profile: {
    category: 'personal',
    fields: ['email', 'name', 'picture'],
    retention: 'until_deletion',
    purpose: 'Account management and personalization'
  },
  conversations: {
    category: 'usage',
    fields: ['messages', 'timestamps', 'scenario_id'],
    retention: '90_days',
    purpose: 'Service delivery and improvement'
  },
  analytics: {
    category: 'performance',
    fields: ['scores', 'feedback', 'progress'],
    retention: '2_years',
    purpose: 'Performance tracking and recommendations'
  },
  technical: {
    category: 'system',
    fields: ['ip_address', 'user_agent', 'errors'],
    retention: '30_days',
    purpose: 'Security and troubleshooting'
  }
};

// Data retention schedules
export const retentionSchedules = {
  '30_days': 30 * 24 * 60 * 60 * 1000,
  '90_days': 90 * 24 * 60 * 60 * 1000,
  '2_years': 2 * 365 * 24 * 60 * 60 * 1000,
  'until_deletion': null
};

// Generate Article 30 records
export function generateDataProcessingRecords() {
  return Object.entries(dataClassification).map(([key, value]) => ({
    processingActivity: key,
    dataCategory: value.category,
    dataSubjects: ['registered_users'],
    purpose: value.purpose,
    legalBasis: 'legitimate_interest',
    dataFields: value.fields,
    retention: value.retention,
    recipients: ['internal_only'],
    transfers: 'none',
    safeguards: ['encryption', 'access_control', 'audit_logs']
  }));
}
