const axios = require("axios");

// Function to clean AI responses by removing asterisks
function cleanAIResponse(text) {
  // Remove single and double asterisks while preserving the text
  return text.replace(/\*+([^*]+)\*+/g, '$1').replace(/\*/g, '');
}

// Analyze conversation context to determine response mode (Socratic or Casual)
const analyzeConversationContext = (messages, userMessage) => {
  const contextIndicators = {
    socratic: [
      'why', 'how', 'explain', 'understand', 'learn',
      'algorithm', 'complexity', 'implementation', 'what is', 'can you explain'
    ],
    casual: [
      'quick', 'simple', 'just show', 'direct answer', 'help me', 'fix this', 'code for'
    ],
    greeting: [
      'hi', 'hello', 'hey', 'yo', 'greetings'
    ]
  };
  
  // Check if the user message is a simple greeting or very short
  const trimmedMessage = userMessage.trim().toLowerCase();
  const isShortMessage = trimmedMessage.split(' ').length <= 3;
  const isGreeting = contextIndicators.greeting.some(indicator => trimmedMessage.includes(indicator));
  
  if (isShortMessage && isGreeting) {
    return {
      mode: 'casual',
      confidence: 1,
      subMode: 'greeting'
    };
  }
  
  // Focus on the latest user message and last few messages for context
  const recentMessages = messages.slice(-5).concat(userMessage);
  let socraticScore = 0;
  let casualScore = 0;
  
  recentMessages.forEach(msgText => {
    if (typeof msgText === 'string') {
      const text = msgText.toLowerCase();
      contextIndicators.socratic.forEach(indicator => {
        if (text.includes(indicator)) socraticScore++;
      });
      contextIndicators.casual.forEach(indicator => {
        if (text.includes(indicator)) casualScore++;
      });
    }
  });
  
  // If no strong indicators, default to casual for minimal input
  if (socraticScore === 0 && casualScore === 0 && isShortMessage) {
    return {
      mode: 'casual',
      confidence: 1,
      subMode: 'neutral'
    };
  }
  
  return {
    mode: socraticScore > casualScore ? 'socratic' : 'casual',
    confidence: Math.abs(socraticScore - casualScore) / Math.max(socraticScore, casualScore) || 1,
    subMode: 'standard'
  };
};

// Socratic and Casual Prompt Templates
const socraticPrompts = {
  definition: `As a Socratic tutor, guide the student to define the concept by asking probing questions. Don't provide direct answers - help them discover the definition through questioning.`,
  analysis: `Using the Socratic method, help the student analyze the problem. Ask questions that lead them to break down the problem into smaller components and understand the underlying principles.`,
  hypothesis: `Guide the student through hypothesis formation about the topic. Ask questions that help them form, test, and refine their understanding through code execution results.`,
  elenchus: `Challenge the student's assumptions through careful questioning. Help them identify contradictions or gaps in their reasoning.`
};

const casualPrompts = {
  explanation: `Provide a clear, direct explanation of the concept with practical examples and code snippets.`,
  quickHelp: `Give a concise answer to help the student move forward with their coding task.`,
  greeting: `Respond warmly to the student's greeting, briefly introduce yourself as their tutor for sorting algorithms, and ask how you can help them today. Keep it short and friendly.`
};

// Determine the type of Socratic interaction based on message content
const determineSocraticType = (message) => {
  const text = message.toLowerCase();
  if (text.includes('define') || text.includes('what is')) return 'definition';
  if (text.includes('analyze') || text.includes('break down')) return 'analysis';
  if (text.includes('hypothesis') || text.includes('test') || text.includes('result')) return 'hypothesis';
  return 'elenchus'; // Default to challenging assumptions
};

// Summarize conversation history for prompt context
const summarizeConversationHistory = (messages) => {
  if (messages.length === 0) return "No prior conversation.";
  // Limit to last 5 messages and handle string format
  const summary = messages.slice(-5).map(msg => {
    if (typeof msg === 'string') {
      return msg.length > 100 ? `${msg.substring(0, 100)}...` : msg;
    }
    return "Unknown message format";
  }).join('\n');
  return summary;
};

// Generate contextual prompt based on mode and conversation
const generateContextualPrompt = (userMessage, contextLines, codeContext, mode, subMode) => {
  let basePrompt;
  if (mode === 'socratic') {
    basePrompt = socraticPrompts[determineSocraticType(userMessage)];
  } else {
    basePrompt = subMode === 'greeting' ? casualPrompts.greeting : casualPrompts.explanation;
  }
  
  const enhancedPrompt = `
    I'm a computer engineering student learning Data Structures and Algorithms (DSA), specifically sorting algorithms. You are my tutor, adapting your teaching style based on my needs.
    
    ${basePrompt}
    
    Current Learning Context:
    - Topic: Sorting Algorithms
    - Student Level: Beginner to Intermediate
    - Recent Code Execution: ${codeContext || 'None'}
    - Learning Objectives: Understand sorting concepts, implementation, and complexity
    
    Conversation History Summary:
    ${summarizeConversationHistory(contextLines)}
    
    Student's Latest Message:
    "${userMessage}"
  `;
  
  return enhancedPrompt;
};

async function getSocraticResponse(message, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // Extract the most recent code and result from context
  let codeContext = "";
  const codeMatches = [
    ...context.matchAll(
      /I ran this code:([\s\S]*?)Output: ([\s\S]*?)Error:([\s\S]*?)Time:([\s\S]*?)(?=I ran this code:|$)/g
    ),
  ];
  let latestCode = "";
  let latestOutput = "";
  if (codeMatches.length > 0) {
    const latestMatch = codeMatches[codeMatches.length - 1]; // Get the last match
    latestCode = latestMatch[1].trim();
    latestOutput = `Output: ${latestMatch[2].trim()}, Error: ${latestMatch[3].trim()}, Time: ${latestMatch[4].trim()}`;
    codeContext = `The student recently submitted this code: "${latestCode}". It produced: ${latestOutput}.`;
  }

  // Split context string into lines for processing
  const contextLines = context.split('\n').filter(line => line.trim() !== '');
  
  // Analyze context to determine response mode
  const contextAnalysis = analyzeConversationContext(contextLines, message);
  console.log(`Response Mode: ${contextAnalysis.mode}, Confidence: ${contextAnalysis.confidence}, SubMode: ${contextAnalysis.subMode}`);
  
  // Generate dynamic prompt based on context
  const prompt = generateContextualPrompt(message, contextLines, codeContext, contextAnalysis.mode, contextAnalysis.subMode);

  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
    
    // Clean the response before returning it
    return cleanAIResponse(aiResponse);
  } catch (error) {
    console.error(
      "Gemini API error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return "Sorry, I encountered an error. How can I assist you further?";
  }
}

module.exports = { getSocraticResponse };
