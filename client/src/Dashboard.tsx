"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { ChatPanel } from "./components/chat-panel";
import { CodeEditorPanel } from "./components/code-editor-panel";
import { getConversation, getConversations } from "./lib/api";

export default function Dashboard({ userEmail }: { userEmail: string | null }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // On mount, fetch conversations and select the most recent one if any
  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }
    const fetchAndSelectConversation = async () => {
      try {
        setLoading(true);
        const { data } = await getConversations(token);
        if (data && data.length > 0) {
          setSelectedConversation(data[0]._id); // Select the most recent
        } else {
          setSelectedConversation(null);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndSelectConversation();
  }, [token]);

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedConversation || !token) {
        setMessages([]);
        return;
      }
      try {
        setLoading(true);
        const { data } = await getConversation(selectedConversation, token);
        const formattedMessages = data.messages.map((msg: any) => ({
          role: msg.sender === "assistant" ? "assistant" : "user",
          content: msg.text
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    loadConversation();
  }, [selectedConversation, token]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
  };

  const handleNewConversation = () => {
    // Do not create a conversation here; let the sidebar handle it
    setMessages([]);
  };

  const handleCodeExecuted = (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
  };

  if (!token) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        userEmail={userEmail} 
        token={token}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <ChatPanel
          token={token}
          messages={messages}
          setMessages={setMessages}
          conversationId={selectedConversation}
          loading={loading}
        />
        <CodeEditorPanel 
          token={token} 
          onCodeExecuted={handleCodeExecuted}
          conversationId={selectedConversation}
        />
      </div>
    </div>
  );
}
