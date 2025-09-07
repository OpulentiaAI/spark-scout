# Google OAuth Setup Guide

## Overview
This guide explains how to properly configure Google OAuth for the Spark Scout application to avoid the "redirect_uri_mismatch" error you're encountering.

## Current Configuration Status
Based on your Google Cloud Console configuration, you already have the correct redirect URIs set up:
- Production: `https://spark-scout-eosin.vercel.app/api/auth/callback/google`
- Production: `https://chat.opulentia.ai/api/auth/callback/google`
- Preview: `https://spark-scout-buvonz69m-agent-space-7f0053b9.vercel.app/api/auth/callback/google`
- Local development: `https://localhost:3000/api/auth/callback/google`

## Environment Variables Setup

### Required Environment Variables
For your Google OAuth integration to work correctly, you need to set these environment variables in Vercel:

1. `AUTH_GOOGLE_ID` - Your Google OAuth client ID from the Google Cloud Console
2. `AUTH_GOOGLE_SECRET` - Your Google OAuth client secret from the Google Cloud Console
3. `AUTH_SECRET` - A random string used to hash tokens and sign cookies

### How to Set Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your Spark Scout project
3. Go to Settings > Environment Variables
4. Add the following variables:
   
   ```
   AUTH_GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID
   AUTH_GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   AUTH_SECRET=RANDOM_SECRET_STRING
   ```

### Generating a Secure AUTH_SECRET

You can generate a secure AUTH_SECRET using one of these methods:

1. Visit https://generate-secret.vercel.app/32
2. Or run this command in your terminal:
   ```bash
   openssl rand -base64 32
   ```

## Vercel Deployments with NextAuth.js

### Default Behavior
By default, Vercel automatically provides the correct URL to NextAuth.js, so you don't typically need to set `NEXTAUTH_URL`.

### For Preview Deployments
Since you have multiple preview environments, you should consider setting:
```
AUTH_REDIRECT_PROXY_URL=https://spark-scout-eosin.vercel.app
```

This environment variable ensures that all OAuth callbacks go through your stable domain regardless of which preview URL is being used.

### Additional Vercel Configuration
You may also want to set:
```
AUTH_TRUST_HOST=true
```

This tells NextAuth.js to trust the host header provided by Vercel.

## Troubleshooting Tips

1. Ensure that all redirect URIs exactly match what's configured in Google Cloud Console, including protocol, host, path, and trailing slashes.

2. Remember that changes in Google Cloud Console may take up to 5 minutes to propagate.

3. Check that your OAuth client ID has not been restricted to specific IPs or domains.

4. For domain-based setups, verify that your domain is verified in Google Search Console.

5. If issues persist, try clearing your browser cookies for the domain and try signing in again.

For more information, see the NextAuth.js documentation on Google provider configuration:
https://next-auth.js.org/providers/google

## Specific to Your Setup

Based on your domain configuration, you should add environment variables in Vercel for all three environments:
1. Production (`spark-scout-eosin.vercel.app`)
2. Production (`chat.opulentia.ai`)
3. Preview deployments (Note: Google OAuth doesn't support wildcards, so you may need to update this as new preview URLs are created)

The most important step now is to ensure your `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` environment variables are set correctly in Vercel, matching the credentials from your Google Cloud Console OAuth 2.0 client.