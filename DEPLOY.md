# Deploying to Vercel

This project is a Next.js application configured for deployment on Vercel.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repository**: Push this code to a GitHub repository.

## Local Development

I have created a `.env.local` file for you with the necessary environment variables.

1.  **Update API Keys**: Open `.env.local` and replace `your_google_genai_api_key_here` with your actual Google GenAI API key.
2.  **Install Dependencies**: Run `npm install`.
3.  **Run Development Server**: Run `npm run dev`.


## Deployment Steps

1.  **Import Project**:
    *   Go to your Vercel Dashboard.
    *   Click "Add New..." -> "Project".
    *   Import the GitHub repository containing this code.

2.  **Configure Project**:
    *   **Framework Preset**: Vercel should automatically detect "Next.js".
    *   **Root Directory**: Ensure it points to the root of the project (where `package.json` is).

3.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add the following variables (copy values from your local setup or Firebase console):

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBzAH6xzjb96fwX3yAnf1uGmnDPsYxbz4M
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=invondata.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=invondata
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=invondata.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=659381911637
    NEXT_PUBLIC_FIREBASE_APP_ID=1:659381911637:web:59ad2135df6c318ef754dc
    GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
    ```

    *   **Note**: The `GOOGLE_GENAI_API_KEY` is required for the AI features (Genkit). You need to obtain this from Google AI Studio.

4.  **Deploy**:
    *   Click "Deploy".
    *   Vercel will build and deploy your application.

## Troubleshooting

*   **Build Errors**: If the build fails, check the logs in Vercel. Common issues include missing environment variables or type errors (although `ignoreBuildErrors: true` is set in `next.config.ts`).
*   **Firebase Issues**: Ensure your Firebase security rules (`firestore.rules`, `storage.rules`) allow access from the deployed domain. You might need to add your Vercel domain to the "Authorized Domains" in Firebase Authentication settings.
