# Google OAuth Setup Guide

## Overview
This guide explains how to properly configure Google OAuth for the Spark Scout application to avoid the "redirect_uri_mismatch" error you're encountering.

## Steps to Fix the OAuth Error

### 1. Access Google Cloud Console
Go to https://console.cloud.google.com/ and select your project (or create one if you haven't already).

### 2. Configure OAuth Consent Screen
Navigate to "APIs & Services" > "OAuth consent screen":
1. Set the User Type (Internal or External)
2. Fill in the required App information:
   - App name
   - User support email
   - Developer contact information
3. Add authorized domains that match your deployment URLs
4. Save the configuration

### 3. Create OAuth 2.0 Client IDs
Navigate to "APIs & Services" > "Credentials" > "+ CREATE CREDENTIALS" > "OAuth client ID":
1. Select Application type: "Web application"
2. Add authorized redirect URIs based on your deployment environment:

#### For Local Development
```
http://localhost:3000/api/auth/callback/google
```

#### For Vercel Preview Deployments (add each preview URL)
Example format:
```
https://your-app-git-branch-name.vercel.app/api/auth/callback/google
```

#### For Production Deployment
```
https://yourdomain.com/api/auth/callback/google
```

### 4. Environment Variables
Add the following environment variables to your deployment platform:

#### For Vercel
In your Vercel project settings, go to "Environment Variables" and add:
- `AUTH_GOOGLE_ID` - Your Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Your Google OAuth client secret
- `AUTH_SECRET` - A random secret (generate at https://generate-secret.vercel.app/32)

#### For Local Development
Create a `.env.local` file in your project root with:
```env
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_SECRET=your_random_secret
```

### 5. Special Considerations for Preview Deployments
Since Google OAuth does not support wildcards, preview deployments will require manual addition of redirect URIs. For a more scalable solution, consider:

1. Using the Credentials Provider for preview deployments instead of OAuth providers
2. Setting up a fixed domain for authentication that works across all deployments
3. Using `AUTH_REDIRECT_PROXY_URL` to force a specific callback URL:
   ```
   AUTH_REDIRECT_PROXY_URL=https://yourdomain.com
   ```

## Troubleshooting Tips

1. Ensure that all redirect URIs exactly match what's configured in Google Cloud Console, including protocol, host, path, and trailing slashes.

2. If you continue to experience issues, manually test the OAuth flow by constructing the authorization URL:
   ```
   https://accounts.google.com/o/oauth2/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=openid email profile&
     response_type=code&
     access_type=offline
   ```

3. Remember that changes in Google Cloud Console may take a few minutes to propagate.

4. Check that your OAuth client ID has not been restricted to specific IPs or domains.

5. For domain-based setups, verify that your domain is verified in Google Search Console.

For more information, see the NextAuth.js documentation on Google provider configuration:
https://next-auth.js.org/providers/google