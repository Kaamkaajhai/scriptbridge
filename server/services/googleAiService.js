const GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const getApiKey = () => process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
const getModel = () => process.env.GOOGLE_AI_MODEL || "gemini-2.5-flash";

const extractText = (responseJson) => {
  const parts = responseJson?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
};

export const generateWithGoogleAI = async ({
  prompt,
  temperature = 0.4,
  maxOutputTokens = 2500,
  responseMimeType,
}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error("Google AI API key is missing. Set GOOGLE_AI_API_KEY in server env.");
    err.statusCode = 503;
    throw err;
  }

  const model = getModel();
  const endpoint = `${GOOGLE_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const generationConfig = {
    temperature,
    maxOutputTokens,
  };

  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Google AI request failed";
    const err = new Error(message);
    err.statusCode = response.status;
    err.aiProvider = "google";
    err.rawError = data?.error || null;
    throw err;
  }

  const text = extractText(data);
  if (!text) {
    const err = new Error("Google AI returned an empty response");
    err.statusCode = 502;
    throw err;
  }

  return { text, raw: data };
};

export const generateJsonWithGoogleAI = async ({
  prompt,
  temperature = 0.3,
  maxOutputTokens = 3000,
}) => {
  const { text } = await generateWithGoogleAI({
    prompt,
    temperature,
    maxOutputTokens,
    responseMimeType: "application/json",
  });

  try {
    return JSON.parse(text);
  } catch {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      const err = new Error("AI returned invalid JSON");
      err.statusCode = 502;
      throw err;
    }
    const possibleJson = text.slice(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(possibleJson);
    } catch {
      const err = new Error("AI returned malformed JSON");
      err.statusCode = 502;
      throw err;
    }
  }
};

export const isGoogleQuotaError = (error) => {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return (
    error.statusCode === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted")
  );
};
