"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { PlusCircle, Trash2, Edit, Check, X } from "lucide-react";
import { getConversations, createConversation, deleteConversation, updateConversationTitle } from "../lib/api";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ConversationListProps {
  token: string;
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  token,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getConversations(token);
      console.log("Fetched conversations:", data);
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  const handleCreateConversation = async () => {
    try {
      setError(null);
      const { data } = await createConversation("New Conversation", token);
      console.log("Created conversation:", data);
      setConversations((prev) => [data, ...prev]);
      onSelectConversation(data._id);
      onNewConversation();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setError("Failed to create conversation. Please try again.");
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setError(null);
      await deleteConversation(id, token);
      setConversations((prev) => prev.filter((conv) => conv._id !== id));
      if (selectedConversation === id) {
        // If the selected conversation was deleted, select another one or create a new one
        if (conversations.length > 1) {
          const newSelectedId = conversations.find((c) => c._id !== id)?._id;
          if (newSelectedId) {
            onSelectConversation(newSelectedId);
          }
        } else {
          handleCreateConversation();
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setError("Failed to delete conversation. Please try again.");
    }
  };

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveTitle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      try {
        setError(null);
        await updateConversationTitle(id, editTitle, token);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === id ? { ...conv, title: editTitle } : conv
          )
        );
      } catch (error) {
        console.error("Failed to update conversation title:", error);
        setError("Failed to update title. Please try again.");
      }
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Button
          onClick={handleCreateConversation}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
        {error && (
          <div className="mt-2 text-xs text-red-500 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <li
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                className={`p-2 rounded-md cursor-pointer flex justify-between items-center group ${
                  selectedConversation === conversation._id
                    ? "bg-teal-100"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === conversation._id ? (
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full mr-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => saveTitle(conversation._id, e)}
                        className="h-6 w-6"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.updatedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </>
                  )}
                </div>
                {editingId !== conversation._id && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => startEditing(conversation._id, conversation.title, e)}
                      className="h-6 w-6"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDeleteConversation(conversation._id, e)}
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 