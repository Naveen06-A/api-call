# Facebook OAuth Integration

This project demonstrates how to implement Facebook OAuth authentication and ad posting functionality.

## Setup Instructions

1. Replace `YOUR_APP_ID` in `script.js` with your actual Facebook App ID
2. Update the `REDIRECT_URI` to match your setup
3. For a production environment, you would need a backend server to securely handle the OAuth flow and store credentials

## Important Notes

- This implementation uses the implicit OAuth flow for simplicity, which is not recommended for production
- In a real application, you should use the authorization code flow with a backend server
- Facebook ad creation requires proper permissions (ads_management, business_management) and an approved ad account
- The ad posting functionality in this example is simulated

## Running the Application

Simply open `index.html` in a web browser. For the OAuth redirect to work properly, you would need to serve this through a web server.