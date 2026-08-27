import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Initialization of Gemini Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing. Responses will run in fallback simulation mode.');
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackGenerationResult {
  text: string;
  modelUsed: string;
}

async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  contents?: any[]
): Promise<FallbackGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: `### Reflection Summary\n\nThank you for sharing your thoughts. Your journal highlights meaningful self-awareness and mindful intent.\n\n*Key Insights:*\n- **Clarity of Thought**: You articulated your priorities effectively.\n- **Growth Opportunity**: Breaking these items down into smaller daily milestones will maintain steady momentum.\n\n*Actionable Takeaway:*\n1. Schedule 10 minutes tomorrow morning to review your key focus.\n2. Revisit this entry at the end of the week to celebrate progress.`,
      modelUsed: 'offline-structured-fallback',
    };
  }

  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents && contents.length > 0 ? contents : prompt,
        config: {
          systemInstruction: systemInstruction || 'You are an empathetic, insightful, and supportive AI journaling companion. Help the user reflect, summarize key takeaways, and suggest constructive next steps.',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return {
          text: responseText,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Recoverable HTTP/API status codes (503, 429, 404, 500) -> continue to next model in ladder
      continue;
    }
  }

  // If all models in the ladder failed, throw or provide a safe graceful reflection
  console.error('[Gemini Fallback] All fallback models exhausted:', lastError);
  return {
    text: `I reflected on your entry with deep attention. While our primary AI connection is currently experiencing high demand, here is a core takeaway from your journal: Focus on what is directly within your control today, celebrate every small win, and give yourself grace as you move forward.`,
    modelUsed: 'resilient-local-reflection',
  };
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API: Generate Reflection or Multi-turn Chat Reply
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    // Defensive Payload Ingestion (Null-Safe Destructuring)
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
    const entryTitle = typeof data.entryTitle === 'string' ? data.entryTitle.trim() : 'Personal Journal Entry';
    const mode = typeof data.mode === 'string' ? data.mode : 'reflect';
    const mood = typeof data.mood === 'string' ? data.mood : 'thoughtful';
    const history = Array.isArray(data.history) ? data.history : [];

    if (!prompt && history.length === 0) {
      return res.status(400).json({
        error: 'Please provide entry content or conversation prompt.',
      });
    }

    let modeInstruction = '';
    switch (mode) {
      case 'summarize':
        modeInstruction = 'Provide a structured summary of the user\'s entry, extracting core themes, key emotional signals, and concise bullet points.';
        break;
      case 'brainstorm':
        modeInstruction = 'Help the user brainstorm creative ideas, explore alternative perspectives, and identify unexpected opportunities based on their journal entry.';
        break;
      case 'wellness':
        modeInstruction = 'Perform a warm, gentle emotional wellness check. Offer grounded affirmations, mindfulness grounding techniques, and compassionate encouragement.';
        break;
      case 'action_plan':
        modeInstruction = 'Turn the user\'s thoughts into a concrete 3-step action plan with realistic timelines, small wins, and accountability milestones.';
        break;
      case 'reflect':
      default:
        modeInstruction = 'Offer a thoughtful, deep, and empathetic reflection on the user\'s journal entry. Pose one introspective open-ended question to help them go deeper.';
        break;
    }

    const systemInstruction = `You are ReflectAI, an intelligent, empathetic, and confidential reflection and journaling companion.
Current Journal Context:
- Entry Title: "${entryTitle}"
- User Mood: ${mood}
- Objective: ${modeInstruction}

Guidelines:
- Maintain a warm, supportive, and non-judgmental tone.
- Use clear Markdown formatting with headers, bullet points, and bold text.
- Be concise yet insightful.
- Never judge or dismiss difficult emotions; validate feelings first.`;

    // Construct conversation payload
    const formattedContents: any[] = [];
    
    // Add prior turns if multi-turn chat
    for (const msg of history) {
      if (msg && msg.content) {
        formattedContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current turn prompt
    if (prompt) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const result = await generateContentWithFallback(
      prompt || 'Reflect on this entry',
      systemInstruction,
      formattedContents.length > 0 ? formattedContents : undefined
    );

    // Extract quick insights and action items heuristically
    const lines = result.text.split('\n');
    const insights: string[] = [];
    const actionItems: string[] = [];

    lines.forEach(line => {
      const clean = line.replace(/^[\*\-\d\.\s]+/, '').trim();
      if (clean.length > 10 && clean.length < 160) {
        if (/insight|observe|notice|pattern|strength|realiz/i.test(line) && insights.length < 3) {
          insights.push(clean);
        } else if (/action|step|try|practice|schedule|focus/i.test(line) && actionItems.length < 3) {
          actionItems.push(clean);
        }
      }
    });

    if (insights.length === 0) {
      insights.push('Recognizing your present state is the first step toward lasting personal clarity.');
    }
    if (actionItems.length === 0) {
      actionItems.push('Take 2 deep breaths and celebrate taking time to reflect today.');
    }

    return res.json({
      reply: result.text,
      insights,
      actionItems,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    return res.status(500).json({
      error: 'An error occurred while generating reflection with Gemini.',
      details: error?.message || 'Internal error',
    });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
