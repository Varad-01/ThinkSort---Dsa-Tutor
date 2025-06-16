"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Play } from "lucide-react";
import { executeCode, executeCodeInConversation } from "../lib/api";

interface CodeEditorPanelProps {
  token: string;
  onCodeExecuted: (message: string) => void;
  conversationId: string | null;
}

export function CodeEditorPanel({
  token,
  onCodeExecuted,
  conversationId 
}: CodeEditorPanelProps) {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState("javascript"); // Default to JavaScript

  const handleExecuteCode = async () => {
    if (!code.trim() || isExecuting) return;
    setIsExecuting(true);
    setOutput("Executing...");
    try {
      let data;
      // Map language to Judge0 language ID
      const languageMap: Record<string, number> = {
        javascript: 63, // Node.js
        python: 71,     // Python 3
        java: 62,       // Java
        cpp: 54         // C++
      };
      const languageId = languageMap[language];
      console.log("Sending languageId:", languageId); // Debug log
      
      if (conversationId) {
        // Use conversation-specific endpoint
        const response = await executeCodeInConversation(
          conversationId,
          code,
          token,
          languageId
        );
        data = response.data;
      } else {
        // Fall back to legacy endpoint
        const response = await executeCode(code, token, undefined, languageId);
        data = response.data;
      }

      const result = data.result;
      setOutput(
        `Output: ${result.output || "None"}\nError: ${
          result.error || "None"
        }\nTime: ${result.time}s`
      );
      
      // Format the message for the chat panel
      const message = `I ran this code:\n${code}\n\nOutput: ${
        result.output || "None"
      }\nError: ${result.error || "None"}\nTime: ${result.time}s`;
      
      onCodeExecuted(message);
    } catch (err) {
      setOutput("Error executing code. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col w-full md:w-1/2 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-teal-600">Code Playground</h2>
        <p className="text-sm text-gray-500">
          Test your sorting algorithms here
        </p>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <div className="h-full flex flex-col">
            <div className="mb-2 flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </label>
              <Button
                onClick={handleExecuteCode}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isExecuting || !conversationId}
              >
                <Play className="h-4 w-4 mr-2" />
                Run
              </Button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-3 w-full border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="// Write your code here..."
              disabled={isExecuting || !conversationId}
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output
          </label>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm h-32 overflow-y-auto whitespace-pre-wrap">
            {output || "Your code output will appear here..."}
          </div>
        </div>
      </div>
    </div>
  );
}
