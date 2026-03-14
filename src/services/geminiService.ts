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

export async function getAIInsights(transactions: Transaction[], currency: 'INR' | 'TZS' = 'INR') {
  if (transactions.length === 0) return "Add some transactions to get AI insights!";

  const prompt = `
    Analyze these financial transactions for a user in ${currency === 'INR' ? 'India (INR)' : 'Tanzania (TZS)'}.
    Transactions: ${JSON.stringify(transactions)}
    
    Provide:
    1. A summary of spending habits.
    2. Areas where they can save.
    3. A motivational tip.
    4. Specific investment advice for the ${currency === 'INR' ? 'Indian market (e.g., SIP, PPF, FD)' : 'Tanzanian market (e.g., UTT AMIS, Treasury Bonds)'} based on their current balance.
    
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

export async function scanReceipt(base64Image: string) {
  const prompt = "Analyze this receipt image and extract the following information: total amount, category (e.g., Food, Transport, Shopping, Utilities, Health, Entertainment), a brief description, and the date of the transaction. Return the data in JSON format.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO format date YYYY-MM-DD" },
          },
          required: ["amount", "category", "description", "date"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Receipt Scan Error:", error);
    throw new Error("Failed to scan receipt");
  }
}
