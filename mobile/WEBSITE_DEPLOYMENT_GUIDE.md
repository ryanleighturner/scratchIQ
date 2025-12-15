# ScratchIQ Website Deployment Guide

## Quick Options for Hosting Your Website

All the website files are ready in the `/website/` folder:
- `index.html` - Home page
- `support.html` - Support/FAQ page
- `privacy.html` - Privacy Policy
- `terms.html` - Terms of Service

---

## Option 1: GitHub Pages (FREE - Recommended)

### Steps:
1. **Create a GitHub repository**
   - Go to https://github.com/new
   - Name it: `scratchiq-website` (or any name)
   - Make it Public
   - Don't initialize with README

2. **Upload your website files**
   ```bash
   cd /home/user/workspace
   git init
   git add website/*
   git commit -m "Add ScratchIQ website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/scratchiq-website.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/root` (or select `/website` if you pushed the whole workspace)
   - Save

4. **Get your URL**
   - Your site will be live at: `https://YOUR-USERNAME.github.io/scratchiq-website/`
   - Wait 2-3 minutes for deployment

5. **Update APP_STORE_METADATA.md**
   - Support URL: `https://YOUR-USERNAME.github.io/scratchiq-website/support.html`
   - Privacy URL: `https://YOUR-USERNAME.github.io/scratchiq-website/privacy.html`
   - Marketing URL: `https://YOUR-USERNAME.github.io/scratchiq-website/`

---

## Option 2: Netlify (FREE - Very Easy)

### Steps:
1. Go to https://www.netlify.com
2. Sign up with GitHub/email
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `/website/` folder
5. Done! You'll get a URL like: `https://random-name.netlify.app`
6. You can customize the subdomain in Site settings

**URLs to use:**
- Support: `https://your-site.netlify.app/support.html`
- Privacy: `https://your-site.netlify.app/privacy.html`
- Home: `https://your-site.netlify.app/`

---

## Option 3: Vercel (FREE)

### Steps:
1. Go to https://vercel.com
2. Sign up
3. Click "Add New" → "Project"
4. Import your `/website/` folder
5. Deploy!

**URLs will be:** `https://your-project.vercel.app/`

---

## Option 4: Use Temporary Email Support (NO WEBSITE NEEDED)

### For Initial Submission Only:

You can submit WITHOUT a website by using:

**Support URL:** `mailto:support@scratchiq.app`
- Apple allows email addresses as support URLs
- Users will open their email app to contact you

**Privacy Policy URL:**
- In App Store Connect reviewer notes, write:
  ```
  Privacy Policy is available within the app at:
  Profile → Legal Section → Privacy Policy

  The full privacy policy can be viewed in-app without requiring an account or purchase.
  ```

**Marketing URL:**
- Leave blank (it's optional)

This is the **fastest option** to get submitted today. You can add a website later.

---

## Recommended Approach for Fast Submission

### FASTEST (Ready in 5 minutes):

1. **For App Store Connect submission:**
   - Support URL: `mailto:support@scratchiq.app`
   - Privacy Policy URL: Leave blank, mention in-app location in reviewer notes
   - Marketing URL: Leave blank

2. **Add to Reviewer Notes:**
   ```
   LEGAL DOCUMENTS:
   - Privacy Policy: Available in-app at Profile → Legal → Privacy Policy
   - Terms of Service: Available in-app at Profile → Legal → Terms of Service
   - Disclaimer: Shown during first-launch onboarding
   - All legal documents are accessible without account creation
   ```

3. **Deploy website later (optional):**
   - Use GitHub Pages after app is approved
   - Update URLs in next app version (1.0.1)

---

## What Apple Actually Requires

### Required:
- ✅ **Support URL** - Can be email (mailto:) or website
- ✅ **Privacy Policy** - Can be in-app OR on website
  - If in-app only: Must be easily accessible without account
  - Your app already has this in Profile → Legal section

### Optional:
- Marketing URL
- Dedicated website

### Your Current Status:
✅ Privacy Policy is in the app (Profile → Legal → Privacy Policy)
✅ Terms of Service is in the app (Profile → Legal → Terms)
✅ Can use `mailto:support@scratchiq.app` for Support URL

**YOU CAN SUBMIT NOW without a website!**

---

## Summary

**Option A - Submit Today (No Website):**
- Support URL: `mailto:support@scratchiq.app`
- Privacy URL: Mention in-app location in reviewer notes
- Marketing URL: Leave blank

**Option B - Deploy Website First (30 minutes):**
- Use GitHub Pages (free, permanent)
- Upload the 4 HTML files
- Use those URLs in App Store Connect

**Recommendation:** Use Option A to submit quickly, deploy website after approval for v1.0.1 update.

---

## Need Help?

If you want to deploy the website, I can help you:
1. Set up a GitHub repository
2. Configure GitHub Pages
3. Get your final URLs

Just let me know which option you prefer!
