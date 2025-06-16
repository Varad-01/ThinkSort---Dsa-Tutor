"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { sendMessageToConversation, sendMessage } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  token: string;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  conversationId: string | null;
  loading?: boolean;
}

// Function to clean AI responses by removing asterisks
const cleanAIResponse = (text: string): string => {
  // Remove single and double asterisks while preserving the text
  return text.replace(/\*+([^*]+)\*+/g, '$1').replace(/\*/g, '');
};

export function ChatPanel({ 
  token, 
  messages, 
  setMessages, 
  conversationId, 
  loading = false 
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;
    
    if (!conversationId) {
      setError("No active conversation. Please create a new conversation first.");
      return;
    }
    
    setError(null);
    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsSubmitting(true);
    
    try {
      console.log(`Sending message to conversation: ${conversationId}`);
      // Use the conversation-specific endpoint if we have a conversationId
      if (conversationId) {
        const { data } = await sendMessageToConversation(
          conversationId,
          input,
          token
        );
        console.log("Response received:", data);
        const assistantMessage: Message = { 
          role: "assistant", 
          content: cleanAIResponse(data.response)
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fall back to the legacy endpoint if needed
        const history = messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");
        const { data } = await sendMessage(input, token, history);
        const assistantMessage: Message = { 
          role: "assistant", 
          content: cleanAIResponse(data.response)
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      const errorMessage: Message = { 
        role: "assistant", 
        content: "Error: Could not get a response. Please try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col w-full md:w-1/2 border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-teal-600">
          Socratic Assistant
        </h2>
        <p className="text-sm text-gray-500">
          Your AI guide to sorting algorithms
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-start max-w-[80%]">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarFallback className="bg-teal-600 text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-teal-50 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 ml-2 mt-1">
                    <AvatarFallback className="bg-orange-500 text-white">
                      JS
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))
        )}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 text-red-600 hover:bg-red-100"
              onClick={() => setError(null)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={conversationId ? "Ask about sorting algorithms..." : "Create a conversation first..."}
            className="flex-1 mr-2"
            disabled={isSubmitting || loading || !conversationId}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isSubmitting || loading || !conversationId}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
