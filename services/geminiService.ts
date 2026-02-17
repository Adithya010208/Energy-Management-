
import { GoogleGenAI } from "@google/genai";

let lastRequestTime = 0;

export interface AIResponse {
  text: string;
  status: 'active' | 'limited' | 'error' | 'pro';
}

export const getGovernanceAdvice = async (energyUsed: number, prediction: number, budget: number): Promise<AIResponse> => {
  const now = Date.now();
  
  // Throttle locally to avoid accidental spam
  if (now - lastRequestTime < 3000) {
    return {
      text: localStorage.getItem('last_ai_insight') || "Synthesizing real-time telemetry...",
      status: 'active'
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-preview for advanced competition-level reasoning
  const modelName = 'gemini-3-pro-preview'; 

  const prompt = `Act as an AI Strategic Energy Governance Engine.
    Institutional Context: RMK Engineering College - LOGIC LORDS
    Project Focus: SDG 7 (Affordable & Clean Energy)
    
    Current Metrics:
    - Real-time Consumption: ${energyUsed.toFixed(2)} kWh
    - Projected Monthly usage: ${prediction.toFixed(2)} kWh
    - Budget Threshold: ${budget} kWh
    
    Current Status: ${prediction > budget ? 'CRITICAL VARIANCE DETECTED (High Risk of Budget Overflow)' : 'OPTIMAL PERFORMANCE (Within Sustainability Threshold)'}
    
    Task: Provide a high-impact, professional governance recommendation (max 20 words) for a technical jury. Focus on load optimization, SDG alignment, and institutional scalability.`;

  try {
    lastRequestTime = now;
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    const text = response.text.trim();
    localStorage.setItem('last_ai_insight', text);
    
    return { text, status: 'pro' };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const errorMessage = error?.message || "";
    
    if (errorMessage.includes("quota") || errorMessage.includes("429")) {
      return {
        text: localStorage.getItem('last_ai_insight') || "System metrics nominal. AI governance engine awaiting next cycle.",
        status: 'limited'
      };
    }

    return {
      text: "Neural link established. Baseline governance protocols active.",
      status: 'error'
    };
  }
};
