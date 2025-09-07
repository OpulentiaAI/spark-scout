# OAuth Environment Variables Configuration

Based on your Google Cloud Console OAuth 2.0 client configuration, you need to set the following environment variables in your Vercel project:

## Required Environment Variables

1. `AUTH_GOOGLE_ID` - Your Google OAuth client ID
2. `AUTH_GOOGLE_SECRET` - Your Google OAuth client secret
3. `AUTH_SECRET` - A random secret used to hash tokens and sign cookies

## How to Set Environment Variables in Vercel

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following variables:
   
   ```
   AUTH_GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID
   AUTH_GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   AUTH_SECRET=GENERATED_RANDOM_SECRET
   ```

## Generating a Secure AUTH_SECRET

You can generate a secure AUTH_SECRET using one of these methods:

1. Visit https://generate-secret.vercel.app/32
2. Or run this command in your terminal:
   ```bash
   openssl rand -base64 32
   ```

## Vercel Preview Deployments

For preview deployments like `https://spark-scout-*.vercel.app`, you have two options:

1. **Add each preview URL manually** to your Google Cloud Console:
   - Add `https://spark-scout-*.vercel.app/api/auth/callback/google` for each preview deployment
   
2. **Use a proxy redirect URL** (recommended):
   - Set `AUTH_REDIRECT_PROXY_URL=https://spark-scout-eosin.vercel.app` (or your preferred stable domain)
   - This ensures all OAuth callbacks go through a consistent domain

## Common Issues and Solutions

1. **Redirect URI Mismatch Error**:
   - Ensure all URIs in your Google Cloud Console match exactly with what your application is using
   - The URI must include the exact protocol (http/https), domain, and path
   - Trailing slashes matter - be consistent

2. **Environment Variables Not Loaded**:
   - Check that you're setting them for the correct environments (Production, Preview, Development)
   - Some variables may need to be set for all environments

3. **Cookie Issues**:
   - If using a proxy redirect URL, set `NEXTAUTH_URL=https://spark-scout-eosin.vercel.app`
   - You may also need `AUTH_TRUST_HOST=true` for Vercel deployments