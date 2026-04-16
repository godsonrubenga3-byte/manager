import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export interface Transaction {
  id?: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  currency?: string;
}
