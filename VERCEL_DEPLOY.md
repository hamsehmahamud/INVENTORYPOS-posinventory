# Deployment Guide for Vercel

This guide explains how to deploy your **InvoGenius** application to Vercel.

## Prerequisites

1.  **Vercel Account**: Create one at [vercel.com](https://vercel.com).
2.  **GitHub Account**: Recommended for automatic deployments.
3.  **Project Code**: Ensure your code is pushed to a GitHub repository.

## Configuration Status

**Important**: Currently, the Firebase and Gemini API keys are **hardcoded** in the source files (`src/lib/firebase.ts` and `src/ai/genkit.ts`) to resolve local configuration errors.

*   This means the project will work immediately upon deployment without needing to set Environment Variables in Vercel initially.
*   **Security Note**: For a production application, you should eventually replace these hardcoded values with `process.env.VARIABLE_NAME` and set them in the Vercel Project Settings.

## Deployment Method 1: GitHub Integration (Recommended)

This is the easiest way to deploy and ensures your site updates automatically when you push code changes.

1.  **Push your code to GitHub**:
    *   Initialize git (if not already done): `git init`
    *   Add files: `git add .`
    *   Commit: `git commit -m "Ready for deployment"`
    *   Push to your repository.

2.  **Import to Vercel**:
    *   Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** -> **"Project"**.
    *   Select your GitHub repository.

3.  **Configure Project**:
    *   **Framework Preset**: Vercel should automatically detect **Next.js**.
    *   **Root Directory**: Leave as default (root).
    *   **Build Command**: `next build` (default).
    *   **Output Directory**: `.next` (default).
    *   **Install Command**: `npm install` (default).

4.  **Environment Variables**:
    *   Since keys are currently hardcoded, you can skip this step for now.
    *   *If you revert to using `process.env` later, add them here.*

5.  **Deploy**:
    *   Click **"Deploy"**.
    *   Wait for the build to complete. You should see a success screen with your live URL.

## Deployment Method 2: Vercel CLI (Manual)

If you prefer to deploy from your command line:

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```

2.  **Login**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Run the following command in your project root:
    ```bash
    vercel
    ```

4.  **Follow the Prompts**:
    *   Set up and deploy? **Y**
    *   Which scope? (Select your account)
    *   Link to existing project? **N**
    *   Project name? (Press Enter)
    *   Directory? (Press Enter)
    *   Want to modify settings? **N**

## Troubleshooting

### Build Errors
If the deployment fails during the "Build" phase:
*   Check the **Build Logs** in Vercel.
*   Ensure `npm install` ran successfully.
*   If you see type errors, note that `ignoreBuildErrors: true` is set in `next.config.ts`, so TypeScript errors shouldn't block the build.

### Runtime Errors
If the site loads but shows an error page:
*   Check the **Runtime Logs** in the Vercel dashboard.
*   Verify that Firebase credentials are correct (they are hardcoded in `src/lib/firebase.ts`).
*   Ensure your Firebase project allows requests from the Vercel domain (configure "Authorized Domains" in Firebase Console -> Authentication -> Settings).

### Local Issues
If you have trouble running the project locally before deploying:
*   Run the **`fix_install.bat`** script included in the project folder.
*   This script fixes common Node.js and `npm` issues on Windows.
