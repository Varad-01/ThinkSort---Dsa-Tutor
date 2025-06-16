"use client";

import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { ConversationList } from "./conversation-list";

interface SidebarProps {
  userEmail: string | null;
  token: string;
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function Sidebar({
  userEmail,
  token,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-teal-600">Socratic AI</h1>
        <div className="text-sm text-gray-500 truncate mt-1">{userEmail}</div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ConversationList 
          token={token}
          selectedConversation={selectedConversation}
          onSelectConversation={onSelectConversation}
          onNewConversation={onNewConversation}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
