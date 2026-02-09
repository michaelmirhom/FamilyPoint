# Cloudinary Integration Setup

## Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account
3. After signup, you'll be taken to your dashboard

## Step 2: Get Your Credentials
On your Cloudinary dashboard, you'll see:
- **Cloud Name**: (e.g., dk12ab34c)
- **API Key**: (e.g., 123456789012345)
- **API Secret**: (e.g., AbCdEfGhIjKlMnOpQrStUvW)

## Step 3: Add to Local .env File
Create/update `backend/.env` file:
```
DATABASE_URL=your_neon_database_url
SECRET_KEY=your_secret_key

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Step 4: Add to Render Environment Variables
In your Render dashboard:
1. Go to your backend service
2. Click **Environment** tab
3. Add these environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Step 5: Deploy
1. Install cloudinary: `pip install cloudinary==1.36.0`
2. Commit and push your changes
3. Render will automatically redeploy

## What Changed?
- Files now upload to Cloudinary (cloud storage)
- File URLs from Cloudinary are saved in your Neon database
- Works in production without ephemeral storage issues
- Free tier includes: 25 GB storage, 25 GB bandwidth/month

## Testing
After deployment:
1. Try uploading a file from the child dashboard
2. The URL will be a Cloudinary URL (e.g., https://res.cloudinary.com/...)
3. Files persist even after Render restarts
