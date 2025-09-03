document.addEventListener('DOMContentLoaded', function() {
    const connectBtn = document.getElementById('connectBtn');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const adForm = document.getElementById('adForm');
    const adContent = document.getElementById('adContent');
    const postAdBtn = document.getElementById('postAdBtn');
    
    // In a real application, these would be stored securely
    const APP_ID = 'YOUR_APP_ID'; // Replace with your Facebook App ID
    const REDIRECT_URI = 'http://localhost:8000/'; // Replace with your redirect URI
    // Note: In production, you would need a backend to securely store your app secret
    
    connectBtn.addEventListener('click', function() {
        // Start Facebook OAuth flow
        startFacebookAuth();
    });
    
    postAdBtn.addEventListener('click', function() {
        const content = adContent.value.trim();
        if (!content) {
            showStatus('Please enter ad content', 'error');
            return;
        }
        
        postAd(content);
    });
    
    function startFacebookAuth() {
        showStatus('Redirecting to Facebook for authentication...', 'info');
        
        // Construct the Facebook OAuth URL
        const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_management,business_management`;
        
        // Redirect to Facebook for authentication
        window.location.href = authUrl;
    }
    
    function handleCallback() {
        // Check if we have an access token in the URL (after redirect)
        const urlParams = new URLSearchParams(window.location.hash.substr(1));
        const accessToken = urlParams.get('access_token');
        
        if (accessToken) {
            showStatus('Successfully authenticated with Facebook!', 'success');
            connectBtn.textContent = 'Connected';
            connectBtn.disabled = true;
            adForm.classList.remove('hidden');
            
            // Store the token (in a real app, you'd use more secure methods)
            sessionStorage.setItem('fb_access_token', accessToken);
            
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (window.location.search.includes('error')) {
            // Handle errors
            const errorReason = new URLSearchParams(window.location.search).get('error_reason') || 'Unknown error';
            showStatus(`Authentication failed: ${errorReason}`, 'error');
            
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    function postAd(content) {
        const accessToken = sessionStorage.getItem('fb_access_token');
        
        if (!accessToken) {
            showStatus('No access token found. Please connect to Facebook first.', 'error');
            return;
        }
        
        showStatus('Posting ad...', 'info');
        postAdBtn.disabled = true;
        
        // In a real application, you would need:
        // 1. An ad account ID
        // 2. To create an ad campaign, ad set, and finally the ad
        // This is a simplified example that won't work without proper setup
        
        // For demonstration purposes, we'll simulate the API call
        simulateAdPosting(accessToken, content);
    }
    
    function simulateAdPosting(token, content) {
        // This is a simulation - a real implementation would use the Facebook Graph API
        console.log('Simulating ad post with token and content:', content);
        
        // Simulate API delay
        setTimeout(() => {
            // In a real application, you would make a request to:
            // https://graph.facebook.com/v19.0/act_<AD_ACCOUNT_ID>/ads
            
            // For this example, we'll just show a success message
            showStatus('Ad posted successfully! (simulation)', 'success');
            postAdBtn.disabled = false;
            adContent.value = '';
        }, 2000);
    }
    
    function showStatus(message, type) {
        statusText.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
    }
    
    // Check if we're returning from Facebook OAuth
    handleCallback();
});



