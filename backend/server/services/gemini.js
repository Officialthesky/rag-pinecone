import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  _isGreeting(message) {
    const greetingPatterns = [
      /\b(hi|hello|hey|good\s*(morning|evening|afternoon)|namaste|hola)\b/i,
      /\b(how are you|what's up|wassup|howdy)\b/i
    ];
    return greetingPatterns.some(pattern => pattern.test(message.toLowerCase()));
  }

  _generateGreetingResponse() {
    const currentHour = new Date().getHours();
    let timeBasedGreeting = '';

    if (currentHour < 12) {
      timeBasedGreeting = 'Good morning';
    } else if (currentHour < 17) {
      timeBasedGreeting = 'Good afternoon';
    } else {
      timeBasedGreeting = 'Good evening';
    }

    const greetings = [
      `${timeBasedGreeting}! I'm your spreadsheet analysis assistant. How can I help you today?`,
      `${timeBasedGreeting}! Ready to help you analyze your spreadsheet data. What would you like to know?`,
      `Hello! I'm here to assist you with your spreadsheet analysis. What can I help you with?`,
      `Hi there! Looking forward to helping you with your data analysis. What would you like to explore?`
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  async generateResponse(context, message, history = []) {
    try {
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: msg.parts[0].text,
        })),
      });

      if (this._isGreeting(message) && (!context || context.trim() === '')) {
        return this._generateGreetingResponse();
      }

      const prompt = `
You are a friendly and helpful spreadsheet analyst. Start with appropriate greetings if the user greets you.

**Analysis Context:**
${context}

**Analysis Capabilities:**
1. NUMERIC OPERATIONS
   - Sum, Average, Count, Min, Max
   - Percentage calculations
   - Growth rates and trends
   - Currency conversions
   - Custom mathematical formulas

2. TEXT OPERATIONS
   - String concatenation
   - Text parsing and extraction
   - Pattern matching
   - Case conversions

3. DATE OPERATIONS
   - Date formatting
   - Date calculations
   - Period comparisons
   - Time series analysis

4. LOGICAL OPERATIONS
   - IF conditions
   - AND/OR operations
   - VLOOKUP-style matching
   - Nested logic

5. STATISTICAL OPERATIONS
   - Standard deviation
   - Variance
   - Correlation
   - Regression analysis

6. CATEGORICAL ANALYSIS
   - Grouping and categorization
   - Frequency distribution
   - Pivot table-style summaries
   - Cross-tabulation

**Question:** ${message}

**Instructions:**
1. Begin with a relevant greeting if the user greets you.
2. Provide visually structured insights (use headings, bullet points, or tables).
3. When presenting data, use Markdown tables. For example:
   \`\`\`
   | Column1 | Column2 | Column3 |
   |---------|---------|---------|
   | Data1   | Data2   | Data3   |
   | Data4   | Data5   | Data6   |
   \`\`\`
4. Show all calculations step-by-step.
5. Explain findings clearly and provide actionable insights.
6. Include units where applicable.
7. Validate and include any URLs found.
8. If data is insufficient, explain what's missing.
9. Maintain a friendly, professional tone throughout.

Please provide a comprehensive analysis based on these guidelines.`;

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  _detectDataType(context) {
    try {
      return {
        containsNumbers: /\d+/.test(context),
        containsDates: /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(context),
        containsUrls: /https?:\/\/[\^\s]+/.test(context),
        containsCurrency: /[$€£¥₹]/.test(context)
      };
    } catch (error) {
      console.error('Error detecting data types:', error);
      return null;
    }
  }

  _extractLinks(context) {
    try {
      const urlRegex = /(https?:\/\/[\^\s]+)/g;
      return context.match(urlRegex) || [];
    } catch (error) {
      console.error('Error extracting links:', error);
      return [];
    }
  }

  _validateFormulas(text) {
    const formulaPatterns = {
      sum: /=SUM\([^)]+\)/i,
      average: /=AVERAGE\([^)]+\)/i,
      vlookup: /=VLOOKUP\([^)]+\)/i,
      if: /=IF\([^)]+\)/i,
      concatenate: /=CONCATENATE\([^)]+\)/i,
      count: /=COUNT\([^)]+\)/i,
      dateTime: /=DATE\([^)]+\)|=TIME\([^)]+\)/i
    };

    const foundFormulas = {};
    for (const [type, pattern] of Object.entries(formulaPatterns)) {
      foundFormulas[type] = pattern.test(text);
    }
    return foundFormulas;
  }
}
