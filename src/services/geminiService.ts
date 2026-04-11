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
    console.warn("AI Insights Error, falling back to algorithm:", error);
    return generateAlgorithmicInsights(transactions, currencyCode);
  }
}

function generateAlgorithmicInsights(transactions: Transaction[], currency: string) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return `
### 📊 Financial Insights (Algorithmic)

**1. Spending Summary**
Your total expenses for this period are **${currency} ${totalExpense.toLocaleString()}**. 
${topCategory ? `Your highest spending is in **${topCategory[0]}** (${currency} ${topCategory[1].toLocaleString()}), accounting for ${Math.round((topCategory[1]/totalExpense)*100)}% of your total spend.` : ''}

**2. Saving Opportunities**
- ${topCategory ? `Try reducing your **${topCategory[0]}** expenses by 10% next month to save ${currency} ${Math.round(topCategory[1] * 0.1).toLocaleString()}.` : 'Track more expenses to see specific saving tips.'}
- Your savings rate is currently **${income > 0 ? Math.round(((income - totalExpense) / income) * 100) : 0}%**. Aim for at least 20%.

**3. Motivational Tip**
"Do not save what is left after spending, but spend what is left after saving." — *Warren Buffett*

**4. Investment Advice (${currency})**
- Consider allocating a portion of your ${currency} ${Math.max(0, income - totalExpense).toLocaleString()} surplus into low-cost index funds or high-yield savings accounts.
- Diversify your portfolio to mitigate risks associated with market fluctuations in ${currency}.
  `;
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
