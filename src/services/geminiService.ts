import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export interface Transaction {
  id?: number;
  amount: number;
  category: string;
  description: string;
  image?: string;
  date: string;
  type: 'income' | 'expense';
  currency?: string;
}

const VALID_CATEGORIES = ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Business', 'Salary', 'Other'];

export async function getAIInsights(transactions: Transaction[], currencyCode: string = 'USD') {
  if (transactions.length === 0) return "Add some transactions to get AI insights!";

  const prompt = `
    Analyze these financial transactions for a user using currency: ${currencyCode}.
    Transactions: ${JSON.stringify(transactions)}
    
    Provide:
    1. A summary of spending habits.
    2. Areas where they can save.
    3. A motivational tip.
    4. Specific investment advice relevant to their financial situation and the currency (${currencyCode}) they are using.
    
    Format the response in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Failed to generate insights. Please check your API key or try again later.";
  }
}

export async function scanReceipt(base64DataUrl: string) {
  const mimeType = base64DataUrl.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const base64Data = base64DataUrl.split(',')[1] || base64DataUrl;

  const prompt = `
    Analyze this receipt image and extract the following information:
    - total amount (as a number)
    - category (must be one of: ${VALID_CATEGORIES.join(', ')})
    - a brief description of what was bought
    - the date of the transaction (format: YYYY-MM-DD)
    
    If the date is missing, use today's date: ${new Date().toISOString().split('T')[0]}.
    If the category is unclear, use 'Other'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-1.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ["amount", "category", "description", "date"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Receipt Scan Error:", error);
    throw new Error("Failed to analyze receipt. Please ensure your API key is valid and the photo is clear.");
  }
}
