import React, { useState } from 'react';
import { X, ShieldCheck, Terminal, Database, Key, Check, Copy } from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero Insecure Defaults - root denied
    match /{document=**} {
      allow read, write: if false;
    }

    // Owner-bound User Data Isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const secretManagerSnippet = `# 1. Create and populate Gemini Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run Service Account Secret Accessor Role
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"`;

  const cloudRunDeploySnippet = `# 1. Deploy Service to Cloud Run with Secret Binding
gcloud run deploy reflectai-journal \\
  --source . \\
  --region us-central1 \\
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \\
  --allow-unauthenticated

# 2. Apply Mandatory Campaign Verification Label
gcloud run services update reflectai-journal \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=us-central1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        id="security-architecture-modal"
        className="w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative text-stone-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-100">Production Security & Cloud Run Directives</h2>
            <p className="text-xs text-stone-400">OWASP compliance, owner-bound isolation, and secret management</p>
          </div>
        </div>

        {/* Section 1: Firestore Security Rules */}
        <div className="mb-6 p-4 bg-stone-950 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Database className="w-4 h-4 text-amber-400" />
              <span>1. Firestore Security Rules (`firestore.rules`)</span>
            </div>
            <button
              onClick={() => copyToClipboard(firestoreRulesSnippet, 'rules')}
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'rules' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-stone-900/90 text-amber-300 p-3 rounded-lg overflow-x-auto border border-stone-800">
            {firestoreRulesSnippet}
          </pre>
        </div>

        {/* Section 2: Secret Manager Setup */}
        <div className="mb-6 p-4 bg-stone-950 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>2. Google Cloud Secret Manager IAM Bindings</span>
            </div>
            <button
              onClick={() => copyToClipboard(secretManagerSnippet, 'secrets')}
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedSection === 'secrets' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'secrets' ? 'Copy' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-stone-900/90 text-emerald-300 p-3 rounded-lg overflow-x-auto border border-stone-800">
            {secretManagerSnippet}
          </pre>
        </div>

        {/* Section 3: Cloud Run Deployment & Campaign Label */}
        <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>3. Cloud Run Deploy & Mandatory Campaign Labeling</span>
            </div>
            <button
              onClick={() => copyToClipboard(cloudRunDeploySnippet, 'deploy')}
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              {copiedSection === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'deploy' ? 'Copy' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-stone-900/90 text-blue-300 p-3 rounded-lg overflow-x-auto border border-stone-800">
            {cloudRunDeploySnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
