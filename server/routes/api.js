const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const { getSocraticResponse } = require("../services/geminiService");
const { executeCode } = require("../services/judge0Service");
const mongoose = require("mongoose");

// Input validation middleware
const validateInput = (req, res, next) => {
  const { message, code } = req.body;
  if (message && (typeof message !== "string" || message.length > 500)) {
    return res
      .status(400)
      .json({ error: "Message must be a string, max 500 characters" });
  }
  if (code && (typeof code !== "string" || code.length > 10000)) {
    return res
      .status(400)
      .json({ error: "Code must be a string, max 10000 characters" });
  }
  next();
};

// Get all conversations for a user
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({ userId })
      .select('title createdAt updatedAt _id')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get a specific conversation
router.get("/conversations/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversation = await Conversation.findOne({ 
      _id: req.params.id, 
      userId 
    });
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Create a new conversation
router.post("/conversations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title } = req.body;
    
    const conversation = new Conversation({
      userId: userId,
      title: title || "New Conversation",
      messages: [
        { 
          text: "Hello! I'm your Socratic Assistant for learning sorting algorithms. What would you like to learn today?", 
          sender: "assistant" 
        }
      ]
    });
    
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Update conversation title
router.put("/conversations/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title } = req.body;
    
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId },
      { title },
      { new: true }
    );
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

// Delete a conversation
router.delete("/conversations/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await Conversation.findOneAndDelete({ 
      _id: req.params.id, 
      userId 
    });
    
    if (!result) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// Add message to specific conversation
router.post("/conversations/:id/chat", authMiddleware, validateInput, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.userId;
  const conversationId = req.params.id;
  
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId 
    });
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Build context from existing messages
    const context = conversation.messages
      .map(m => `${m.sender}: ${m.text}`)
      .join("\n");
    
    // Get AI response
    const aiResponse = await getSocraticResponse(message, context);
    
    // Add messages to conversation
    conversation.messages.push(
      { text: message, sender: "user" },
      { text: aiResponse, sender: "assistant" }
    );
    
    // Update conversation
    await conversation.save();
    
    res.json({ 
      response: aiResponse,
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Execute code in a specific conversation
router.post("/conversations/:id/execute", authMiddleware, validateInput, async (req, res) => {
  const { code, languageId } = req.body;
  const userId = req.user.userId;
  const conversationId = req.params.id;
  
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId 
    });
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Execute code with the provided languageId, if any
    const result = await executeCode(code, languageId);
    const message = `I ran this code:\n${code}\n\nOutput: ${
      result.output
    }\nError: ${result.error || "None"}\nTime: ${result.time}s`;
    
    // Build context from existing messages
    const context = conversation.messages
      .map(m => `${m.sender}: ${m.text}`)
      .join("\n");
    
    // Get AI response
    const aiResponse = await getSocraticResponse(message, context);
    
    // Add messages to conversation
    conversation.messages.push(
      { text: message, sender: "user" },
      { text: aiResponse, sender: "assistant" }
    );
    
    // Update conversation
    await conversation.save();
    
    res.json({ 
      result,
      response: aiResponse,
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    console.error("Execute error:", error);
    res.status(500).json({ error: "Failed to execute code" });
  }
});

// Legacy endpoints for backward compatibility
router.post("/chat", authMiddleware, validateInput, async (req, res) => {
  const { message, history, conversationId } = req.body;
  const userId = req.user.userId;
  
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // If conversationId is provided, use that conversation
    if (conversationId) {
      return res.redirect(307, `/api/conversations/${conversationId}/chat`);
    }
    
    // Otherwise, create a new conversation or use the default one
    const context = history || "";
    const aiResponse = await getSocraticResponse(message, context);

    await Conversation.findOneAndUpdate(
      { userId, title: "Default Conversation" },
      {
        $push: {
          messages: [
            { text: message, sender: "user" },
            { text: aiResponse, sender: "assistant" },
          ],
        },
        $set: { updatedAt: Date.now() }
      },
      { upsert: true, new: true }
    );

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

router.post("/execute", authMiddleware, validateInput, async (req, res) => {
  const { code, conversationId } = req.body;
  const userId = req.user.userId;
  
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    // If conversationId is provided, use that conversation
    if (conversationId) {
      return res.redirect(307, `/api/conversations/${conversationId}/execute`);
    }
    
    // Otherwise, use the default conversation
    const result = await executeCode(code);
    const message = `I ran this code:\n${code}\n\nOutput: ${
      result.output
    }\nError: ${result.error || "None"}\nTime: ${result.time}s`;

    const convo = await Conversation.findOne({ userId, title: "Default Conversation" });
    const context = convo
      ? convo.messages.map((m) => `${m.sender}: ${m.text}`).join("\n")
      : "";

    const aiResponse = await getSocraticResponse(message, context);

    await Conversation.findOneAndUpdate(
      { userId, title: "Default Conversation" },
      {
        $push: {
          messages: [
            { text: message, sender: "user" },
            { text: aiResponse, sender: "assistant" },
          ],
        },
        $set: { updatedAt: Date.now() }
      },
      { upsert: true, new: true }
    );

    res.json({ result, response: aiResponse });
  } catch (error) {
    console.error("Execute error:", error);
    res.status(500).json({ error: "Failed to execute code" });
  }
});

module.exports = router;
