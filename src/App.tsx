/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Terminal, 
  Code2, 
  Cpu, 
  Rocket,
  Plus,
  Github,
  Linkedin,
  Twitter,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Brain,
  Zap,
  Menu,
  Sparkles,
  Share2,
  SquarePen,
  Mic,
  AudioLines,
  Search,
  ShoppingCart,
  Lightbulb,
  MoreHorizontal,
  Plus as PlusIcon,
  ChevronDown,
  Copy,
  Check,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/src/lib/utils';
import { ThinkingLevel } from "@google/genai";

// MANS AI Identity and System Instruction
const SYSTEM_INSTRUCTION = `You are MANS AI ULTIMATE ELITE, a high-performance multimodal AI system engineered for deep reasoning, structured execution, system architecture design, and real-world impact.

CREATOR:
Created by Mohamed Yasser to build intelligent systems that transform ideas into scalable products.

MISSION:
Turn confusion into clarity.
Turn clarity into structured plans.
Turn plans into working systems.
Turn systems into scalable products.

----------------------------------------
INTELLIGENCE FRAMEWORK
----------------------------------------

Operate using 5 Cognitive Phases:

1) Intent Detection
- Identify the real goal behind the user's message.
- Detect whether the user wants learning, debugging, building, optimizing, or monetizing.

2) Context Awareness
- Automatically estimate user skill level.
- Detect constraints (time, budget, tools, stack).
- Adapt depth and complexity accordingly.

3) Strategic Planning
- For complex requests:
   - Break into phases
   - Provide architecture overview
   - Define milestones

4) Precision Execution
- Deliver clean, structured, production-ready output.
- Optimize for clarity and implementation speed.

5) Optimization & Scale
- Suggest improvements.
- Highlight performance optimizations.
- Mention scalability strategies.
- Suggest monetization if relevant.

----------------------------------------
USER MODES
----------------------------------------

SMART CHAT MODE (Default)
- Maintain conversation context.
- Provide structured answers.
- **ALWAYS** use bullet points or numbered steps.
- Keep answers extremely short and to the point.

THINKING MODE (User Activated)
If user writes: "Thinking Mode"
- Show reasoning steps clearly:
   Step 1: Analysis
   Step 2: Evaluation
   Step 3: Decision
- Keep structured and readable.

DEEP THINK MODE (User Activated)
If user writes: "Deep Think"
Provide:
   - Problem Deconstruction
   - Multiple Strategic Approaches
   - Trade-off Comparison
   - Final Recommended Architecture

----------------------------------------
MULTIMODAL CAPABILITIES
----------------------------------------

When receiving:

Image:
- Accurate description
- Context interpretation
- Insight extraction
- Actionable feedback

PDF / Document:
- Executive summary
- Key data extraction
- Weak points
- Improvement suggestions

Code File:
- Bug detection
- Refactoring
- Performance improvement
- Clean architecture advice

Business Plan:
- Market validation check
- Monetization suggestions
- Risk assessment
- Scaling roadmap

----------------------------------------
ADVANCED EXECUTION MODES
----------------------------------------

DEVELOPER ARCHITECT MODE
- Production-ready code only.
- Clean structure.
- Security best practices.
- Mention scalability and performance.

AI SYSTEM ENGINEER MODE
- Explain system architecture:
   Frontend → Backend → Model → Database
- Token efficiency awareness.
- Cost optimization logic.
- Streaming recommendations.

ACADEMIC ENGINEER MODE
- Define concepts first.
- Use structured breakdown.
- Provide formulas if needed.
- Give real-world application.

STARTUP CEO MODE
- MVP-first strategy.
- Fast launch plan.
- Monetization models.
- Competitive positioning.

----------------------------------------
SECURITY & PROFESSIONAL RULES
----------------------------------------

- Never expose API keys.
- Always recommend environment variables.
- Suggest rate limiting for public systems.
- Encourage authentication for open platforms.
- Promote safe and responsible implementation.

----------------------------------------
COMMUNICATION STYLE
----------------------------------------

- **BREVITY**: Keep answers very concise and direct. Answer ONLY what is asked.
- **FORMAT**: Use bullet points or numbered lists for everything. Do NOT write long paragraphs or blocks of text.
- **STRUCTURE**: High clarity, minimal fluff, execution-focused.
- **LANGUAGE**: Always speak in **Egyptian Arabic (Popular/Slang/Sha'abi)**. Use a friendly, street-smart, and approachable tone that everyone in Egypt can understand. Avoid formal Arabic (Fusha) unless specifically asked for technical definitions.

----------------------------------------
CORE PRINCIPLE
----------------------------------------

Every response must create measurable progress.

From idea → Prototype → Working System → Optimized Product → Scalable Platform.

Encourage building.
Encourage shipping.
Encourage iteration.
Execution over perfection.`;

interface AttachedFile {
  name: string;
  type: string;
  data: string; // base64
  preview?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  timestamp: Date;
  files?: AttachedFile[];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = async () => {
    try {
      const chatContent = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      await navigator.clipboard.writeText(chatContent);
      showToast('Chat content copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && !showScrollButton) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const filePromise = new Promise<AttachedFile>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          const attached: AttachedFile = {
            name: file.name,
            type: file.type,
            data: base64,
          };
          if (file.type.startsWith('image/')) {
            attached.preview = reader.result as string;
          }
          resolve(attached);
        };
      });
      
      reader.readAsDataURL(file);
      newFiles.push(await filePromise);
    }
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const voiceFile: AttachedFile = {
            name: 'Voice Message.webm',
            type: 'audio/webm',
            data: base64,
          };
          // Automatically send after recording
          handleSendWithVoice(voiceFile);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendWithVoice = async (voiceFile: AttachedFile) => {
    const userMessage: Message = {
      role: 'user',
      content: "Voice message",
      timestamp: new Date(),
      files: [voiceFile],
    };
    await processAIRequest(userMessage, [
      { text: "The user sent a voice message. Please listen to it and respond appropriately in Egyptian Sha'abi dialect." },
      {
        inlineData: {
          data: voiceFile.data,
          mimeType: voiceFile.type
        }
      }
    ]);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const currentInput = input;
    const currentFiles = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);
    
    const parts: any[] = [{ text: currentInput || "Analyze the attached content." }];
    currentFiles.forEach(file => {
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.type || 'application/octet-stream'
        }
      });
    });

    await processAIRequest(userMessage, parts);
  };

  const processAIRequest = async (userMessage: Message, parts: any[]) => {
    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);

    try {
      if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      }

      const systemPrompt = `${SYSTEM_INSTRUCTION}\n\nCURRENT STATUS:\nThinking Mode: ${isThinkingMode ? 'ENABLED' : 'DISABLED'}\nDeep Think Mode: ${isDeepThink ? 'ENABLED' : 'DISABLED'}\nShopping Research Mode: ${isShoppingMode ? 'ENABLED' : 'DISABLED'}`;

      // Build history with multimodal support
      const history = messages.map(m => {
        const messageParts: any[] = [{ text: m.content }];
        if (m.files) {
          m.files.forEach(f => {
            messageParts.push({
              inlineData: {
                data: f.data,
                mimeType: f.type
              }
            });
          });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: messageParts
        };
      });

      const stream = await aiRef.current.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts }
        ],
        config: {
          systemInstruction: systemPrompt,
          tools: (isShoppingMode || isDeepThink) ? [{ googleSearch: {} }] : undefined,
          thinkingConfig: (isThinkingMode || isDeepThink) ? {
            thinkingLevel: isDeepThink ? ThinkingLevel.HIGH : ThinkingLevel.LOW
          } : undefined
        }
      });

      let fullText = "";
      let fullThought = "";
      const assistantMessage: Message = {
        role: 'assistant',
        content: "",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of stream) {
        // Handle text
        fullText += chunk.text || "";
        
        // Handle thoughts if available (Gemini 3 specific)
        const thoughtPart = chunk.candidates?.[0]?.content?.parts?.find((p: any) => p.thought);
        if (thoughtPart) {
          fullThought += thoughtPart.text || "";
        }

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullText,
            thought: fullThought || undefined
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "يا باشا حصل مشكلة وأنا بحاول أرد عليك. جرب تاني كده.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#171717] border-r border-white/5">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">MANS AI</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">By Mohamed Yasser</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <button 
          onClick={() => {
            setMessages([]);
            setIsSidebarOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors shadow-sm"
        >
          <PlusIcon size={16} /> New Session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">System Controls</p>
          <div className="space-y-2">
            <div 
              onClick={() => setIsThinkingMode(!isThinkingMode)}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all",
                isThinkingMode ? "bg-white/5 border border-white/10" : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-md",
                  isThinkingMode ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"
                )}>
                  <Brain size={16} />
                </div>
                <span className={cn("text-sm font-medium", isThinkingMode ? "text-white" : "text-zinc-400")}>Thinking Mode</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                isThinkingMode ? "bg-emerald-600" : "bg-zinc-700"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  isThinkingMode ? "right-0.5" : "left-0.5"
                )} />
              </div>
            </div>

            <div 
              onClick={() => setIsDeepThink(!isDeepThink)}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all",
                isDeepThink ? "bg-white/5 border border-white/10" : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded-md",
                  isDeepThink ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"
                )}>
                  <Zap size={16} />
                </div>
                <span className={cn("text-sm font-medium", isDeepThink ? "text-white" : "text-zinc-400")}>Deep Think</span>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                isDeepThink ? "bg-emerald-600" : "bg-zinc-700"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  isDeepThink ? "right-0.5" : "left-0.5"
                )} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Operational Modes</p>
          {[
            { icon: Code2, label: "Developer Architect", color: "text-blue-400 bg-blue-400/10" },
            { icon: Terminal, label: "AI Systems Engineer", color: "text-emerald-400 bg-emerald-400/10" },
            { icon: Rocket, label: "Startup CEO", color: "text-orange-400 bg-orange-400/10" },
            { icon: Cpu, label: "Academic Engineer", color: "text-purple-400 bg-purple-400/10" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-default group">
              <div className={cn("p-1.5 rounded-md", item.color)}>
                <item.icon size={16} />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-white">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-zinc-500">Connect with Creator</span>
        </div>
        <div className="flex gap-3">
          <a href="#" className="p-2 bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-white hover:border-white/10 transition-all shadow-sm">
            <Github size={18} />
          </a>
          <a href="#" className="p-2 bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-white hover:border-white/10 transition-all shadow-sm">
            <Linkedin size={18} />
          </a>
          <a href="#" className="p-2 bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-white hover:border-white/10 transition-all shadow-sm">
            <Twitter size={18} />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#171717] text-zinc-200 overflow-hidden relative font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#171717] border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#212121]">
        {/* Header */}
        <header className="h-16 bg-[#212121]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">MANS AI</span>
              <ChevronDown size={14} className="text-zinc-500" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span>System Status:</span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ultimate Elite Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMessages([])}
              className="p-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
              title="New Chat"
            >
              <SquarePen size={20} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 text-zinc-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
              title="Share Chat"
            >
              <Share2 size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth no-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <h2 className="text-3xl font-semibold text-white tracking-tight">What are you working on?</h2>
            </div>
          )}
          <div className="max-w-3xl mx-auto space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-4 group",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                    message.role === 'assistant' 
                      ? "bg-zinc-800 border-white/10 text-emerald-400 shadow-sm" 
                      : "bg-zinc-700 border-white/10 text-white"
                  )}>
                    {message.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
                  </div>
                  <div className={cn(
                    "flex flex-col max-w-[85%]",
                    message.role === 'user' ? "items-end" : "items-start"
                  )}>
                    {message.files && message.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 justify-end">
                        {message.files.map((file, i) => (
                          <div key={i} className="bg-zinc-800 border border-white/10 rounded-lg p-1.5 flex items-center gap-2 shadow-sm">
                            {file.preview ? (
                              <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center text-zinc-400">
                                <FileText size={16} />
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-zinc-400 max-w-[100px] truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={cn(
                      "px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-sm relative group/msg",
                      message.role === 'assistant' 
                        ? "bg-transparent text-zinc-200" 
                        : "bg-zinc-800 border border-white/5 text-white"
                    )}>
                      {message.thought && (
                        <div className="mb-3 p-3 bg-zinc-800/50 border-l-2 border-emerald-500/50 rounded-r-xl text-xs text-zinc-400 italic font-mono">
                          <div className="flex items-center gap-2 mb-1 not-italic font-bold text-[10px] text-emerald-500 uppercase tracking-widest">
                            <Brain size={12} />
                            <span>Thinking Process</span>
                          </div>
                          {message.thought}
                        </div>
                      )}
                      {message.role === 'assistant' && (
                        <button 
                          onClick={() => copyToClipboard(message.content, `msg-${index}`)}
                          className="absolute -right-8 md:-right-10 top-0 p-2 text-zinc-500 hover:text-white opacity-100 md:opacity-0 md:group-hover/msg:opacity-100 transition-all"
                          title="Copy message"
                        >
                          {copiedId === `msg-${index}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="md:w-4 md:h-4" />}
                        </button>
                      )}
                      <div className="markdown-body dark text-sm md:text-base">
                        <Markdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const codeId = `code-${index}-${Math.random().toString(36).substr(2, 9)}`;
                              
                              return !inline && match ? (
                                <div className="relative group/code my-3 md:my-4 rounded-xl overflow-hidden border border-white/10">
                                  <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900/50 border-b border-white/5">
                                    <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{match[1]}</span>
                                    <button 
                                      onClick={() => copyToClipboard(codeString, codeId)}
                                      className="text-zinc-500 hover:text-white transition-colors p-1"
                                    >
                                      {copiedId === codeId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="md:w-3.5 md:h-3.5" />}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: '1rem md:1.5rem',
                                      fontSize: '0.75rem md:0.85rem',
                                      background: 'transparent'
                                    }}
                                    {...props}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className={cn("bg-white/10 px-1 rounded text-xs md:text-sm", className)} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </Markdown>
                      </div>
                    </div>
                    <span className="mt-1.5 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {showScrollButton && (
              <button 
                onClick={scrollToBottom}
                className="fixed bottom-24 right-4 md:right-8 p-2 bg-zinc-800 border border-white/10 rounded-full text-white shadow-lg hover:bg-zinc-700 transition-all z-20 animate-in fade-in zoom-in"
              >
                <ArrowDown size={20} />
              </button>
            )}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 text-emerald-400 flex items-center justify-center shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div className="bg-transparent px-4 py-3 rounded-2xl flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  <span className="text-sm text-zinc-500 font-medium animate-pulse">
                    {isDeepThink ? "Deep Researching..." : isThinkingMode ? "Thinking..." : isShoppingMode ? "Searching products..." : "MANS AI is thinking..."}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-8 bg-transparent">
          <div className="max-w-3xl mx-auto relative">
            {/* File Previews */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachedFiles.map((file, i) => (
                  <div key={i} className="relative group/file bg-zinc-800 border border-white/10 rounded-xl p-1.5 md:p-2 flex items-center gap-2 md:gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    {file.preview ? (
                      <img src={file.preview} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-400">
                        <FileText size={16} className="md:w-5 md:h-5" />
                      </div>
                    )}
                    <div className="flex flex-col pr-5 md:pr-6">
                      <span className="text-[10px] md:text-xs font-bold text-zinc-200 max-w-[80px] md:max-w-[120px] truncate">{file.name}</span>
                      <span className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{(file.type.split('/')[1] || 'file').toUpperCase()}</span>
                    </div>
                    <button 
                      onClick={() => removeFile(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={10} className="md:w-3 md:h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*,application/pdf,text/*,.ts,.tsx,.js,.jsx,.json"
              />
              
              <div className="bg-[#2f2f2f] border border-white/5 rounded-[24px] md:rounded-[28px] shadow-2xl transition-all focus-within:ring-1 focus-within:ring-white/10">
                <div className="flex items-end p-1.5 md:p-2 gap-0.5 md:gap-1">
                  <div className="relative">
                    <button
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className="p-2 md:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    >
                      <PlusIcon size={18} className="md:w-5 md:h-5" />
                    </button>

                    <AnimatePresence>
                      {isPlusMenuOpen && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPlusMenuOpen(false)}
                            className="fixed inset-0 z-40"
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-3 md:mb-4 w-56 md:w-64 bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-1 md:p-1.5"
                          >
                            <button 
                              onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-zinc-200 hover:bg-white/5 rounded-xl transition-colors"
                            >
                              <Paperclip size={16} className="text-zinc-400 md:w-4.5 md:h-4.5" />
                              <span>Add photos & files</span>
                            </button>
                            <button 
                              onClick={() => { setInput("Create a high-quality image of "); setIsPlusMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-zinc-200 hover:bg-white/5 rounded-xl transition-colors"
                            >
                              <ImageIcon size={16} className="text-zinc-400 md:w-4.5 md:h-4.5" />
                              <span>Create image</span>
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                              onClick={() => { setIsThinkingMode(!isThinkingMode); setIsPlusMenuOpen(false); }}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm rounded-xl transition-colors",
                                isThinkingMode ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-200 hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Lightbulb size={16} className={isThinkingMode ? "text-emerald-400" : "text-zinc-400 md:w-4.5 md:h-4.5"} />
                                <span>Thinking</span>
                              </div>
                              {isThinkingMode && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                            <button 
                              onClick={() => { setIsDeepThink(!isDeepThink); setIsPlusMenuOpen(false); }}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm rounded-xl transition-colors",
                                isDeepThink ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-200 hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Search size={16} className={isDeepThink ? "text-emerald-400" : "text-zinc-400 md:w-4.5 md:h-4.5"} />
                                <span>Deep research</span>
                              </div>
                              {isDeepThink && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                            <button 
                              onClick={() => { setIsShoppingMode(!isShoppingMode); setIsPlusMenuOpen(false); }}
                              className={cn(
                                "w-full flex items-center justify-between px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm rounded-xl transition-colors",
                                isShoppingMode ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-200 hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <ShoppingCart size={16} className={isShoppingMode ? "text-emerald-400" : "text-zinc-400 md:w-4.5 md:h-4.5"} />
                                <span>Shopping research</span>
                              </div>
                              {isShoppingMode && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button 
                              onClick={() => { setMessages([]); setIsPlusMenuOpen(false); showToast('Chat cleared'); }}
                              className="w-full flex items-center justify-between px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-zinc-200 hover:bg-white/5 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <SquarePen size={16} className="text-zinc-400 md:w-4.5 md:h-4.5" />
                                <span>Clear chat</span>
                              </div>
                            </button>
                            <button 
                              onClick={() => { setIsPlusMenuOpen(false); showToast('MANS AI ULTIMATE ELITE v2.5 Active', 'info'); }}
                              className="w-full flex items-center justify-between px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-zinc-200 hover:bg-white/5 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <MoreHorizontal size={16} className="text-zinc-400" />
                                <span>System Info</span>
                              </div>
                              <ChevronRight size={14} className="text-zinc-600" />
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask anything"
                    className="flex-1 bg-transparent border-none px-1.5 py-2 md:px-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:ring-0 resize-none min-h-[40px] md:min-h-[44px] max-h-48 placeholder:text-zinc-500"
                  />

                  <div className="flex items-center gap-0.5 md:gap-1 pr-0.5 md:pr-1">
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        "p-2 md:p-2.5 rounded-full transition-all relative",
                        isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Mic size={18} className="md:w-5 md:h-5" />
                      {isRecording && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                      )}
                    </button>
                    <button 
                      onClick={handleSend}
                      disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                      className={cn(
                        "p-2 md:p-2.5 rounded-full transition-all",
                        (input.trim() || attachedFiles.length > 0) && !isLoading
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "text-zinc-600 cursor-not-allowed"
                      )}
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin md:w-5 md:h-5" /> : <AudioLines size={18} className="md:w-5 md:h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 md:mt-4 text-center text-[9px] md:text-[11px] text-zinc-500 font-medium">
              MANS AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={cn(
              "fixed bottom-24 left-1/2 z-[100] px-4 py-2 rounded-full text-xs font-bold shadow-2xl border backdrop-blur-md",
              toast.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-zinc-800/90 border-white/10 text-zinc-200"
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
