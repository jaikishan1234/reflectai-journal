# ReflectAI Journal & Reflection Platform

ReflectAI is a full-stack, user-authenticated personal journaling and mindful reflection platform powered by **Gemini 3.6 Flash** and **Cloud Firestore**. It enables users to maintain private journal entries, converse through multi-turn AI reflection dialogues, and extract structured insights while enforcing strict owner-bound data isolation and zero-hardcoding security practices.

---

## 1. Architecture & Threat Model Overview

| Layer | Technology | Security & Resilience Pattern |
| :--- | :--- | :--- |
| **Authentication** | Firebase Auth / Google Sign-In | Federated Identity, zero password handling, session bound to UID. |
| **Database** | Google Cloud Firestore | Strict owner-bound isolation (`/users/{userId}/interactions/{id}`). |
| **AI Intelligence** | Gemini 3.6 Flash via `@google/genai` | Resilient model fallback ladder (Flash 3.6 → Flash 3.1 Lite → Flash Latest → 3.7 Flash). |
| **Secret Management** | Google Cloud Secret Manager | Dynamic runtime secret injection with IAM Secret Accessor role. |
| **Compute & Host** | Google Cloud Run | Stateless container runtime bound to port `3000`. |

---

## 2. Environment & Prerequisites

Ensure you have the Google Cloud SDK (`gcloud`) installed and initialized:

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 3. Secret Management Setup (Zero-Hardcoding Hygiene)

Store the Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run compute service account:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Firestore Database & Security Rules

Deploy the owner-bound security rules to ensure no user can read or write another user's journal entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy with Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Cloud Run Deployment Flow

Deploy the containerized service to Cloud Run with Secret Manager environment variable binding:

```bash
gcloud run deploy reflectai-journal \
  --source . \
  --region us-central1 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --allow-unauthenticated
```

---

## 6. Required Campaign Verification Binding

Apply the mandatory challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update reflectai-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Step-by-Step Functional Walkthrough & Test Guide

Every interaction in the application can be verified using the following test scripts:

### Test Case 1: Unauthenticated Landing & Google Sign-In
1. Navigate to the application root URL.
2. Confirm the landing hero displays with the "Sign In with Google" CTA and security badges.
3. Click "Sign In with Google". The Auth modal opens displaying zero-password federation details.
4. Select "Continue with Google (Alex Mercer)" or input a custom Google name/email.
5. **Expected Result**: User is authenticated, redirected to their private workspace, and initialized with welcome data.

### Test Case 2: Multi-Turn Journaling & Gemini 3.6 Reflection
1. Enter a reflection title (e.g. `Balancing Deep Work and Wellbeing`) in the title input.
2. Select a mood chip (e.g. `Motivated 🚀`).
3. Write or select a prompt starter in the main textarea.
4. Add custom tags (e.g. `#Focus`, `#Habits`).
5. Choose an AI Reflection Mode (e.g. `Reflect & Guide`, `3-Step Action Plan`, or `Brainstorm Ideas`).
6. Click **Generate Gemini Reflection & Save to Firestore**.
7. **Expected Result**: Spinner activates, backend executes the fallback ladder, and the Markdown reflection card renders with key observations and interactive action item checkboxes.

### Test Case 3: Continuous Multi-Turn Dialogue
1. Scroll to the **Continuous Dialogue with Gemini** thread below the active reflection card.
2. Click a suggested follow-up (e.g. `+ How can I break this down into smaller milestones?`) or type a custom question.
3. Click the send icon.
4. **Expected Result**: User query is appended, Gemini responds conversationally with context memory from the journal entry, and both turns are persisted.

### Test Case 4: User Data Isolation & Account Switching
1. Note the current user's journal entries in the left sidebar.
2. Click the Sign Out icon in the top navigation.
3. Sign in as a different user (e.g. `Jordan Hayes`).
4. **Expected Result**: Jordan Hayes sees an independent, isolated journal workspace with zero access to Alex Mercer's private reflections.

### Test Case 5: Exporting & Analytics
1. Click the Analytics chart icon in the top header.
2. Confirm the streak counter, word tally, and mood breakdown reflect active journal metrics.
3. In the sidebar footer, click **Markdown** or **JSON** to download the complete archive.
4. **Expected Result**: Formatted file downloads to client machine without data truncation.

### Test Case 6: YouTube Reflection & Video Context Grounding
1. In the journal editor, click **+ Add Context** in the top right.
2. Select **YouTube Video**.
3. Paste a YouTube URL (e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ` or `https://youtu.be/...`).
4. Click **Attach Video**.
5. **Expected Result**: Video metadata (title, channel, thumbnail) is securely resolved via the lightweight oEmbed proxy without scraping or downloading video content.
6. Write a personal reflection relating to the video and click **Generate Gemini Reflection & Save to Firestore**.
7. **Expected Result**: Gemini incorporates the video title and channel context alongside the user's reflection; the saved entry displays the connected video badge in the history sidebar and reflection card.
8. Navigate to **Ask My Journal** and query about the topic of the attached video (e.g., "What videos or lectures did I reflect on?").
9. **Expected Result**: Gemini answers the question citing the journal entry with the attached video context.

### Test Case 7: Web Link Context & Article Grounding
1. In the journal editor, click **+ Add Context** in the top right.
2. Select **Web Link**.
3. Enter a valid web URL (e.g., an article, blog post, or documentation page).
4. Click **Attach Link**.
5. **Expected Result**: The backend metadata proxy validates the URL against SSRF / private IP filters, fetches Open Graph metadata (title, domain, description, image), and displays an attached context card in the editor.
6. Write your thoughts on the article and click **Generate Gemini Reflection & Save to Firestore**.
7. **Expected Result**: Gemini grounds its insights in both your reflection text and the attached web page context. The saved entry displays the cyan `Link` badge in the history sidebar and a preview card in the reflection view.
8. Open **Ask My Journal** and ask a question regarding the article topic (e.g., "What articles or web resources did I read?").
9. **Expected Result**: Gemini references the specific entry and attached web link context.
