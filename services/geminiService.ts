
import { GoogleGenAI } from "@google/genai";

let lastRequestTime = 0;

export interface AIResponse {
  text: string;
  status: 'active' | 'limited' | 'error' | 'pro';
}

export const getGovernanceAdvice = async (energyUsed: number, prediction: number, budget: number): Promise<AIResponse> => {
  const now = Date.now();
  
  // Throttle locally to 10 seconds to respect API rate limits
  if (now - lastRequestTime < 10000) {
    return {
      text: localStorage.getItem('last_ai_insight') || "Synthesizing real-time telemetry...",
      status: 'active'
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-flash-preview for higher rate limits and faster response times
  // suitable for high-frequency dashboard updates.
  const modelName = 'gemini-3-flash-preview'; 

  const prompt = `Act as an AI Strategic Energy Governance Engine for LOGIC LORDS.
    Context: RMK Engineering College Energy Monitoring.
    Metrics: ${energyUsed.toFixed(2)} kWh used, ${prediction.toFixed(2)} kWh projected (Budget: ${budget} kWh).
    Status: ${prediction > budget ? 'CRITICAL VARIANCE' : 'OPTIMAL'}.
    Task: Provide a high-impact, professional governance recommendation (max 15 words) for a technical jury. Focus on load optimization and institutional scalability.`;

  try {
    lastRequestTime = now;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    // Fixed TS18048: 'response.text' is possibly 'undefined'
    const text = response.text?.trim() || "Institutional load nominal. Strategy: Continue baseline monitoring.";
    localStorage.setItem('last_ai_insight', text);
    
    return { text, status: 'active' };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const errorMessage = error?.message || "";
    
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return {
        text: localStorage.getItem('last_ai_insight') || "System metrics nominal. AI governance engine cooling down.",
        status: 'limited'
      };
    }

    return {
      text: localStorage.getItem('last_ai_insight') || "Neural link established. Baseline governance protocols active.",
      status: 'error'
    };
  }
};
