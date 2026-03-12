# RulerFx Kitchen — Deployment Guide

## Step 1 — Get your free Gemini API key
1. Go to aistudio.google.com
2. Sign in with Google
3. Click "Get API Key" → "Create API key" → copy it
   (Free, no credit card, no billing)

## Step 2 — Deploy to Vercel
1. Go to vercel.com → Add New Project
2. Upload the rulerfx-kitchen-vercel folder
3. Use a name like "rulerfx-pro" (if rulerfx-kitchen is taken)
4. Note your URL: https://rulerfx-pro.vercel.app

## Step 3 — Add Environment Variables
Vercel → Project → Settings → Environment Variables:

| Name            | Value                                      |
|-----------------|--------------------------------------------|
| GEMINI_API_KEY  | your key from aistudio.google.com          |
| FINNHUB_KEY     | d6ov281r01qk3chi994gd6ov281r01qk3chi9950  |
| FCS_KEY         | i5mTFBW8pStX1AdpptitM0fl                  |
| ALLOWED_ORIGIN  | https://rulerfx-pro.vercel.app             |

## Step 4 — Redeploy
Vercel → Deployments → three dots → Redeploy

Done. Everything is free, no credit card needed.

## Security
- No API keys in any browser-visible file
- CORS locks proxy to your Vercel domain only  
- Rate limiting: 10 AI / 30 candle / 20 price requests per IP per minute
- Gemini free tier: 1,500 requests/day (plenty for personal use)
