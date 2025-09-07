# Setting up Vercel Environment Variables for Google OAuth

## Prerequisites

Before setting environment variables, make sure you have:
1. Your Google OAuth 2.0 Client ID
2. Your Google OAuth 2.0 Client Secret

These can be found in your Google Cloud Console under "APIs & Services" > "Credentials".

## Step-by-Step Setup

### Step 1: Navigate to Your Project Directory

Open your terminal and navigate to your Spark Scout project directory:
```bash
cd /project/workspace/OpulentiaAI/spark-scout
```

### Step 2: Login to Vercel

Run the following command in your terminal:
```bash
vercel login
```

This will open a browser window where you can authenticate with your Vercel account.

### Step 3: Set AUTH_GOOGLE_ID

Set your Google OAuth Client ID:
```bash
vercel env add AUTH_GOOGLE_ID
```

When prompted:
1. Enter your Google OAuth Client ID
2. Select all environments (Production, Preview, and Development) by pressing Space to select each one, then press Enter

### Step 4: Set AUTH_GOOGLE_SECRET

Set your Google OAuth Client Secret:
```bash
vercel env add AUTH_GOOGLE_SECRET
```

When prompted:
1. Enter your Google OAuth Client Secret
2. Select all environments (Production, Preview, and Development) by pressing Space to select each one, then press Enter

### Step 5: Set AUTH_SECRET

Set your Auth Secret:
```bash
vercel env add AUTH_SECRET
```

When prompted:
1. Generate a secure random secret (you can use https://generate-secret.vercel.app/32 or run `openssl rand -base64 32` in another terminal)
2. Enter the generated secret
3. Select all environments (Production, Preview, and Development) by pressing Space to select each one, then press Enter

## Alternative Environment Variables for Better Deployment Handling

### AUTH_REDIRECT_PROXY_URL

To ensure consistent OAuth callbacks across all deployments:
```bash
vercel env add AUTH_REDIRECT_PROXY_URL
```

Set it to one of your domains:
- For your main deployment: `https://spark-scout-eosin.vercel.app`
- For your custom domain: `https://chat.opulentia.ai`

### AUTH_TRUST_HOST

To tell NextAuth to trust the Vercel host headers:
```bash
vercel env add AUTH_TRUST_HOST
```

Set it to `true` for all environments.

## Verification Steps

### Check Environment Variables

To verify that your environment variables are set correctly:
```bash
vercel env list
```

This will show all environment variables configured for your project.

### Pull Environment Variables Locally (Optional)

If you want to test locally:
```bash
vercel env pull
```

This will create a `.env.local` file with all your environment variables (this file should NOT be committed to version control).

### Redeploy Your Application

After setting the environment variables, redeploy your application:
```bash
vercel --prod
```

This will ensure that the new environment variables are used in your production deployment.

## Troubleshooting

If you're still experiencing redirect_uri_mismatch errors after setting these variables:

1. Double-check that your redirect URIs in Google Cloud Console exactly match:
   - `https://spark-scout-eosin.vercel.app/api/auth/callback/google`
   - `https://chat.opulentia.ai/api/auth/callback/google`
   - `https://localhost:3000/api/auth/callback/google`

2. Make sure you've selected the correct project when running vercel commands:
   ```bash
   vercel link
   ```
   This command will help you select the correct Vercel project if you have multiple.

3. Check the Vercel logs for any authentication errors:
   ```bash
   vercel logs
   ```