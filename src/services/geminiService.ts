import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Transaction {
  id?: number;
  amount: number;
  category: string;
  description: string;
  image?: string;
  date: string;
  type: 'income' | 'expense';
}

export async function getAIInsights(transactions: Transaction[]) {
  if (transactions.length === 0) return "Add some transactions to get AI insights!";

  const prompt = `
    Analyze these financial transactions for a user in India (INR).
    Transactions: ${JSON.stringify(transactions)}
    
    Provide:
    1. A summary of spending habits.
    2. Areas where they can save.
    3. A motivational tip.
    4. Specific investment advice for the Indian market (e.g., SIP, PPF, FD) based on their current balance.
    
    Format the response in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Failed to generate insights. Please try again later.";
  }
}
