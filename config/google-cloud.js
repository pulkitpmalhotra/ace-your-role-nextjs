// Google Cloud configuration
const GOOGLE_CLOUD_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'ace-your-role-speech',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  location: 'global'
};

export default GOOGLE_CLOUD_CONFIG;
