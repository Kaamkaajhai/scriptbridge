import Script from "../models/Script.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { CREDIT_PRICES } from "./creditsController.js";
import { generateJsonWithGoogleAI } from "../services/googleAiService.js";
import { generateTrailerVideo } from "../services/videoGenerationService.js";

const clampScore = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const cleanText = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeSlice = (value = "", limit = 22000) => cleanText(value).slice(0, limit);

const normalizeScorePayload = (payload = {}) => {
  const ai = payload.aiAnalysis || {};
  const platform = payload.platformAnalysis || {};
  const reader = payload.readerAnalysis || {};

  const score = {
    plot: clampScore(payload.plot),
    characters: clampScore(payload.characters),
    dialogue: clampScore(payload.dialogue),
    pacing: clampScore(payload.pacing),
    marketability: clampScore(payload.marketability),
  };

  const avg = Math.round(
    (score.plot + score.characters + score.dialogue + score.pacing + score.marketability) / 5
  );

  score.overall = clampScore(payload.overall || avg);

  return {
    ...score,
    feedback:
      payload.feedback ||
      [ai.summary, platform.positioning, reader.connection].filter(Boolean).join("\n\n") ||
      "AI analysis completed.",
  };
};

// Simulate AI trailer generation (in production, integrate with RunwayML, Pika, etc.)
export const generateTrailer = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const script = await Script.findById(scriptId);
    
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }
    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can generate a trailer" });
    }

    // Check if credits were already paid during upload
    const alreadyPaid = script.services?.aiTrailer === true;
    
    if (!alreadyPaid) {
      // Check credits
      const user = await User.findById(req.user._id);
      const requiredCredits = CREDIT_PRICES.AI_TRAILER;
      const userBalance = user.credits?.balance || 0;

      if (userBalance < requiredCredits) {
        return res.status(402).json({ 
          message: `Insufficient credits. AI Trailer generation requires ${requiredCredits} credits.`,
          requiresCredits: true,
          required: requiredCredits,
          balance: userBalance,
          shortfall: requiredCredits - userBalance
        });
      }

      // Deduct credits
      user.credits.balance -= requiredCredits;
      user.credits.totalSpent += requiredCredits;
      user.credits.transactions.push({
        type: "spent",
        amount: -requiredCredits,
        description: `AI Trailer generation for "${script.title}"`,
        reference: `TRAILER-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date()
      });
      await user.save();
    }

    // Mark as generating
    script.trailerStatus = "generating";
    await script.save();

    const scriptText = safeSlice(
      script.textContent || script.fullContent || script.synopsis || script.description,
      18000
    );

    const trailerPrompt = `You are a trailer writing assistant for film scripts.
Create a cinematic trailer package from the script context below.

Return STRICT JSON with this exact shape:
{
  "hookLine": "string",
  "trailerNarration": "string",
  "sceneBeats": ["string", "string", "string", "string", "string"],
  "voiceoverStyle": "string",
  "musicCue": "string"
}

Rules:
- Keep trailerNarration 120-220 words.
- sceneBeats must contain exactly 5 concise beats.
- Avoid spoilers for final ending.

Script Title: ${script.title}
Genre: ${script.primaryGenre || script.genre || "Unknown"}
Logline: ${script.logline || "N/A"}
Description: ${script.description || "N/A"}
Content: ${scriptText || "N/A"}`;

    let trailerJson;
    let usedFallback = false;
    try {
      trailerJson = await generateJsonWithGoogleAI({
        prompt: trailerPrompt,
        temperature: 0.7,
        maxOutputTokens: 1600,
      });
    } catch (aiError) {
      usedFallback = true;
      trailerJson = buildFallbackTrailerText(script);
    }

    const trailerData = buildTrailerData(script, trailerJson);

    let videoProvider = "fallback";
    try {
      const videoPrompt = buildVideoPrompt(script, trailerData.text);
      const generatedVideo = await generateTrailerVideo({
        prompt: videoPrompt,
        durationSeconds: 12,
        aspectRatio: "16:9",
      });
      trailerData.videoUrl = generatedVideo.videoUrl;
      videoProvider = generatedVideo.provider;
    } catch {
      usedFallback = true;
    }
    
    script.trailerUrl = trailerData.videoUrl;
    script.trailerThumbnail = trailerData.thumbnailUrl;
    script.trailerStatus = "ready";
    script.services = {
      hosting: script.services?.hosting ?? true,
      evaluation: script.services?.evaluation ?? false,
      aiTrailer: true,
    };
    script.markModified("services");
    await script.save();

    // Notify followers
    const creator = await User.findById(req.user._id);
    for (const followerId of creator.followers) {
      await Notification.create({
        user: followerId,
        type: "trailer_ready",
        from: req.user._id,
        script: script._id,
        message: `${creator.name} just released an AI trailer for "${script.title}"`,
      });
    }

    res.json({ 
      message: "Trailer generated successfully", 
      trailer: {
        url: script.trailerUrl,
        thumbnail: script.trailerThumbnail,
        status: script.trailerStatus,
      },
      trailerText: trailerData.text,
      usedFallback,
      videoProvider,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get trailer status
export const getTrailerStatus = async (req, res) => {
  try {
    const script = await Script.findById(req.params.scriptId).select("trailerUrl trailerThumbnail trailerStatus title");
    if (!script) return res.status(404).json({ message: "Script not found" });
    res.json({
      status: script.trailerStatus,
      url: script.trailerUrl,
      thumbnail: script.trailerThumbnail,
      title: script.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// AI Script Score / Pro Analysis
export const generateScriptScore = async (req, res) => {
  try {
    const { scriptId } = req.body;
    const script = await Script.findById(scriptId);
    
    if (!script) {
      return res.status(404).json({ message: "Script not found" });
    }
    if (script.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the script creator can request a score" });
    }

    // Check if credits were already paid during upload
    const alreadyPaid = script.services?.evaluation === true;
    
    if (!alreadyPaid) {
      const user = await User.findById(req.user._id);
      const requiredCredits = CREDIT_PRICES.AI_EVALUATION;
      const userBalance = user.credits?.balance || 0;
      
      if (userBalance < requiredCredits) {
        return res.status(402).json({ 
          message: `Insufficient credits. AI Script Evaluation requires ${requiredCredits} credits.`,
          requiresCredits: true,
          required: requiredCredits,
          balance: userBalance,
          shortfall: requiredCredits - userBalance
        });
      }

      // Deduct credits
      user.credits.balance -= requiredCredits;
      user.credits.totalSpent += requiredCredits;
      user.credits.transactions.push({
        type: "spent",
        amount: -requiredCredits,
        description: `AI Script Evaluation for "${script.title}"`,
        reference: `EVAL-${Date.now().toString(36).toUpperCase()}`,
        createdAt: new Date()
      });
      await user.save();
    }

    const scriptText = safeSlice(
      script.textContent || script.fullContent || script.synopsis || script.description,
      22000
    );

    const scorePrompt = `You are a senior screenplay analyst.

Analyze this script and return STRICT JSON with this exact shape:
{
  "plot": 0-100,
  "characters": 0-100,
  "dialogue": 0-100,
  "pacing": 0-100,
  "marketability": 0-100,
  "overall": 0-100,
  "feedback": "string",
  "aiAnalysis": {
    "summary": "string",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvements": ["string"]
  },
  "platformAnalysis": {
    "audienceFit": "string",
    "positioning": "string"
  },
  "readerAnalysis": {
    "engagement": "string",
    "connection": "string"
  }
}

Rules:
- All score fields must be integers.
- feedback must be 120-260 words and actionable.

Script Title: ${script.title}
Genre: ${script.primaryGenre || script.genre || "Unknown"}
Format: ${script.format || "Unknown"}
Logline: ${script.logline || "N/A"}
Description: ${script.description || "N/A"}
Content: ${scriptText || "N/A"}`;

    let scorePayload;
    let usedFallback = false;
    try {
      scorePayload = await generateJsonWithGoogleAI({
        prompt: scorePrompt,
        temperature: 0.4,
        maxOutputTokens: 2600,
      });
    } catch (aiError) {
      usedFallback = true;
      scorePayload = generateAIScriptScore(script);
    }

    const score = normalizeScorePayload(scorePayload);
    
    script.scriptScore = {
      overall: score.overall,
      plot: score.plot,
      characters: score.characters,
      dialogue: score.dialogue,
      pacing: score.pacing,
      marketability: score.marketability,
      feedback: score.feedback,
      scoredAt: new Date(),
    };
    script.services = {
      hosting: script.services?.hosting ?? true,
      evaluation: true,
      aiTrailer: script.services?.aiTrailer ?? false,
    };
    script.markModified("services");
    await script.save();

    // Notify the creator
    await Notification.create({
      user: req.user._id,
      type: "script_score",
      script: script._id,
      message: `Your script "${script.title}" scored ${score.overall}/100`,
    });

    res.json({ 
      message: "Script scored successfully",
      score: script.scriptScore,
      usedFallback,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const correctScriptText = async (req, res) => {
  try {
    const sourceText = String(req.body?.text || "").trim();
    if (!sourceText) {
      return res.status(400).json({ message: "Script text is required" });
    }

    const normalizedSource = sourceText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const truncatedSource = normalizedSource.slice(0, 25000);

    const prompt = `You are an expert screenplay proofreader.
Fix grammar, punctuation, spelling, and readability while preserving writer voice, scene structure, and line breaks.

Return STRICT JSON with this exact shape:
{
  "correctedText": "string",
  "notes": ["string", "string", "string"]
}

Rules:
- Do NOT censor or rewrite story intent.
- Keep screenplay formatting and paragraph/line breaks.
- correctedText must contain the full corrected script text.
- notes should be up to 5 concise bullet-style strings.

Script text:
${truncatedSource}`;

    let payload;
    let usedFallback = false;
    try {
      payload = await generateJsonWithGoogleAI({
        prompt,
        temperature: 0.2,
        maxOutputTokens: 3200,
      });
    } catch (aiError) {
      usedFallback = true;
      payload = {
        correctedText: truncatedSource,
        notes: [
          "AI quota is currently limited; showing original text.",
          "No automatic grammar edits were applied.",
          "Try again later to run full AI correction.",
        ],
      };
    }

    const correctedText = String(payload?.correctedText || "").trim() || truncatedSource;
    const notes = Array.isArray(payload?.notes)
      ? payload.notes.map((note) => String(note).trim()).filter(Boolean).slice(0, 5)
      : [];

    return res.json({
      correctedText,
      notes,
      usedFallback,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// Get service costs
export const getServiceCosts = async (req, res) => {
  try {
    res.json({
      aiEvaluation: CREDIT_PRICES.AI_EVALUATION,
      aiTrailer: CREDIT_PRICES.AI_TRAILER,
      scriptAnalysis: CREDIT_PRICES.SCRIPT_ANALYSIS,
      premiumReport: CREDIT_PRICES.PREMIUM_REPORT
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Helper functions (simulated AI) ---

function generateAITrailerData(script) {
  // In production: Send script.description + script.genre to AI video generation API
  // (RunwayML Gen-3, Pika Labs, Sora, etc.)
  const genreVisuals = {
    Drama: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800",
    Comedy: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
    Thriller: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800",
    Horror: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
    Action: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800",
    Romance: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
    "Sci-Fi": "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800",
    Fantasy: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
    Documentary: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=800",
    Animation: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
  };

  return {
    videoUrl: `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`,
    thumbnailUrl: genreVisuals[script.genre] || genreVisuals.Drama,
  };
}

function buildTrailerData(script, payload = {}) {
  const fallbackMedia = generateAITrailerData(script);
  const hookLine = cleanText(payload.hookLine || payload.tagline || "");
  const trailerNarration = cleanText(payload.trailerNarration || payload.narration || "");
  const sceneBeats = Array.isArray(payload.sceneBeats)
    ? payload.sceneBeats.map((item) => cleanText(item)).filter(Boolean)
    : [];
  const voiceoverStyle = cleanText(payload.voiceoverStyle || "");
  const musicCue = cleanText(payload.musicCue || "");

  return {
    videoUrl: payload.videoUrl || fallbackMedia.videoUrl,
    thumbnailUrl: payload.thumbnailUrl || fallbackMedia.thumbnailUrl,
    text: {
      hookLine,
      trailerNarration,
      sceneBeats: sceneBeats.slice(0, 5),
      voiceoverStyle,
      musicCue,
    },
  };
}

function buildFallbackTrailerText(script) {
  const genre = script.primaryGenre || script.genre || "drama";
  const title = script.title || "Untitled Project";
  const logline = cleanText(script.logline || script.description || "A world on the edge of change.");

  return {
    hookLine: `${title}: One choice changes everything.`,
    trailerNarration: `${logline} In a ${genre.toLowerCase()} world, stakes rise fast as hidden truths surface and relationships are tested. Every decision pushes the characters toward a point of no return, building to an emotional and cinematic climax that leaves audiences wanting more.`,
    sceneBeats: [
      "Opening image sets the world and tone.",
      "A disruptive event forces the protagonist into action.",
      "Escalation montage reveals conflict and pressure.",
      "A vulnerable emotional beat reframes the stakes.",
      "Final high-intensity button ends on suspense.",
    ],
    voiceoverStyle: "Cinematic, urgent, emotionally grounded",
    musicCue: "Slow atmospheric build into percussive climax",
  };
}

function buildVideoPrompt(script, trailerText = {}) {
  const title = cleanText(script.title || "Untitled Project");
  const genre = cleanText(script.primaryGenre || script.genre || "drama");
  const logline = cleanText(script.logline || script.description || "");
  const hookLine = cleanText(trailerText.hookLine || "");
  const narration = cleanText(trailerText.trailerNarration || "");
  const beats = Array.isArray(trailerText.sceneBeats)
    ? trailerText.sceneBeats.map((beat) => cleanText(beat)).filter(Boolean).slice(0, 5)
    : [];
  const musicCue = cleanText(trailerText.musicCue || "cinematic tension build");
  const voiceStyle = cleanText(trailerText.voiceoverStyle || "cinematic and emotional");

  return `Create a high-quality cinematic teaser trailer video for the script "${title}".
Genre: ${genre}
Logline: ${logline || "N/A"}
Hook: ${hookLine || "N/A"}
Narration tone: ${voiceStyle}
Music direction: ${musicCue}
Story narration: ${narration || "N/A"}
Scene beats:
${beats.map((beat, index) => `${index + 1}. ${beat}`).join("\n") || "1. Build atmosphere and suspense"}

Requirements:
- 12-second cinematic teaser, realistic live-action look.
- Dynamic camera movement, dramatic lighting, emotional character closeups.
- No logos, no subtitles, no text overlays, no watermarks.
- Trailer style pacing with escalating intensity and polished color grading.`;
}

function generateAIScriptScore(script) {
  // In production: Send script content to GPT-4 or custom fine-tuned model
  // for professional screenplay analysis
  const baseScore = 60 + Math.floor(Math.random() * 30);
  const variation = () => Math.max(20, Math.min(100, baseScore + Math.floor(Math.random() * 20) - 10));
  
  const scores = {
    plot: variation(),
    characters: variation(),
    dialogue: variation(),
    pacing: variation(),
    marketability: variation(),
  };
  scores.overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

  const feedbackParts = [];
  if (scores.plot >= 80) feedbackParts.push("Strong plot structure with compelling narrative arcs.");
  else if (scores.plot >= 60) feedbackParts.push("Plot has potential but could benefit from tighter structure in Act 2.");
  else feedbackParts.push("Plot needs significant restructuring. Consider a stronger inciting incident.");

  if (scores.characters >= 80) feedbackParts.push("Well-developed characters with clear motivations.");
  else if (scores.characters >= 60) feedbackParts.push("Characters are decent but need more depth and backstory.");
  else feedbackParts.push("Characters feel underdeveloped. Add more dimension to your protagonist.");

  if (scores.dialogue >= 80) feedbackParts.push("Dialogue is sharp, natural, and serves the story well.");
  else if (scores.dialogue >= 60) feedbackParts.push("Dialogue is functional but could be more distinctive per character.");
  else feedbackParts.push("Dialogue needs work - characters sound too similar.");

  if (scores.pacing >= 80) feedbackParts.push("Excellent pacing that keeps the reader engaged throughout.");
  else if (scores.pacing >= 60) feedbackParts.push("Pacing is uneven - consider trimming scenes in the middle section.");
  else feedbackParts.push("Pacing is slow in Act 2. Consider cutting unnecessary scenes.");

  if (scores.marketability >= 80) feedbackParts.push("High market potential - this concept has strong commercial appeal.");
  else if (scores.marketability >= 60) feedbackParts.push("Moderate market potential. Consider strengthening the unique selling point.");
  else feedbackParts.push("Limited market appeal in current form. Consider targeting a specific niche.");

  return {
    ...scores,
    feedback: feedbackParts.join("\n\n"),
  };
}
