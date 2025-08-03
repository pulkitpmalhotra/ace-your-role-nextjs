// Add this to your useEffect in app/page.tsx to show detailed errors

useEffect(() => {
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const googleError = searchParams.get('google_error');
  const debug = searchParams.get('debug');
  
  if (error) {
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    if (googleError === 'invalid_request' && message?.includes('response_type')) {
      errorMessage = `🔍 DEBUG: Google says "response_type missing" - This is a Google Cloud Console configuration issue. 
      
Check your OAuth client settings:
• Application type must be "Web application"
• Authorized redirect URIs must include: https://ace-your-role-nextjs.vercel.app/api/auth/google/callback
• OAuth consent screen must be "In Production"`;
    } else if (googleError) {
      errorMessage = `OAuth Error from Google: ${googleError}
      ${message ? `\nDetails: ${message}` : ''}
      ${debug ? `\nDebug: ${debug}` : ''}`;
    } else if (message) {
      errorMessage = message;
    }
    
    setError(errorMessage);
    console.log('🚨 OAuth Error Details:', { error, message, googleError, debug });
  }
}, [searchParams]);
