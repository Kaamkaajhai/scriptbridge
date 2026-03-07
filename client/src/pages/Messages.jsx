import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { MessageCircle, ChevronLeft, Send, Lock, Info, Search, Smile } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";

// Build a consistent chatId from two user IDs (same logic as server)
const buildChatId = (a, b) => {
  const sorted = [a.toString(), b.toString()].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

const Messages = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode: dark } = useDarkMode();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isWriter = user && ["writer", "creator"].includes(user.role);
  const isInvestor = user && user.role === "investor";

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const d = new Date(msg.timestamp || msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const filteredConversations = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(convSearch.toLowerCase())
  );

  const getInitials = (name) => (name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const getAvatarColor = (name) => {
    const colors = ["from-[#111111] to-[#333333]", "from-[#333333] to-[#3d7ab8]", "from-[#374151] to-[#4b5563]", "from-[#111111] to-[#374151]"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  useEffect(() => {
    const newSocket = io("http://localhost:5002");
    setSocket(newSocket);
    loadConversations();
    return () => newSocket.close();
  }, []);

  // Typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && activeChat) {
      socket.emit("typing", { chatId: activeChat.chatId, userId: user._id });
      clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => {
        socket.emit("stop-typing", { chatId: activeChat.chatId });
      }, 1500));
    }
  };

  // If investor arrives from ScriptDetail with ?recipientId=...&recipientName=...
  // pre-open the chat after conversations are loaded
  useEffect(() => {
    if (loading) return; // wait until conversations have loaded
    const recipientId = searchParams.get("recipientId");
    const recipientName = searchParams.get("recipientName") || "Writer";
    if (!recipientId || !isInvestor) return;

    // Build the chatId the same way the server does
    const chatId = buildChatId(user._id, recipientId);

    // If this conversation is already in the list, select it
    const existing = conversations.find((c) => c.chatId === chatId);
    if (existing) {
      handleSelectChat(existing);
      return;
    }

    // Otherwise create a pending chat entry (investor is about to send the first message)
    const pendingChat = {
      chatId,
      user: { _id: recipientId, name: recipientName, role: "writer", profileImage: "" },
      lastMessage: "",
      timestamp: new Date().toISOString(),
      isPending: true, // flag: no messages exist yet
    };
    setActiveChat(pendingChat);
    setMessages([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (socket && activeChat) {
      socket.emit("join-chat", activeChat.chatId);
      socket.on("receive-message", (message) => {
        if (message.chatId === activeChat.chatId) {
          setMessages((prev) => [...prev, message]);
        }
      });
      socket.on("typing", ({ chatId }) => {
        if (chatId === activeChat.chatId) setIsTyping(true);
      });
      socket.on("stop-typing", ({ chatId }) => {
        if (chatId === activeChat.chatId) setIsTyping(false);
      });
    }
    return () => {
      socket?.off("receive-message");
      socket?.off("typing");
      socket?.off("stop-typing");
    };
  }, [socket, activeChat]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    setMessagesLoading(true);
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      setMessages(data);
    } catch (error) {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectChat = (conversation) => {
    setSendError("");
    setActiveChat(conversation);
    loadMessages(conversation.chatId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendError("");
    if (!newMessage.trim() || !activeChat) return;

    // Writers cannot send if there are no messages yet (backend enforces this too)
    if (isWriter && !messagesLoading && messages.length === 0) {
      setSendError("You cannot initiate a conversation. Only investors can message first.");
      return;
    }

    const messageData = {
      chatId: activeChat.chatId,
      sender: user._id,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await api.post("/messages/send", {
        receiverId: activeChat.user._id,
        text: newMessage,
      });
      socket?.emit("send-message", messageData);
      // If this was a pending (no prior messages) chat, now promote it into the conversations list
      if (activeChat.isPending) {
        const promoted = { ...activeChat, lastMessage: newMessage, isPending: false };
        setConversations((prev) => [promoted, ...prev]);
        setActiveChat(promoted);
      } else {
        // Update lastMessage in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.chatId === activeChat.chatId ? { ...c, lastMessage: newMessage, timestamp: new Date().toISOString() } : c
          )
        );
      }
      setMessages((prev) => [...prev, messageData]);
      setNewMessage("");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send message.";
      const code = error.response?.data?.code;
      if (code === "PURCHASE_REQUIRED") {
        setSendError("Purchase a project from this writer first to unlock messaging.");
      } else {
        setSendError(msg);
      }
    }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-[60vh]`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-10 h-10 border-[3px] rounded-full animate-spin ${dark ? 'border-gray-700 border-t-blue-400' : 'border-gray-200 border-t-[#111111]'}`}></div>
          <p className={`text-sm font-medium animate-pulse ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Loading messages...</p>
        </div>
      </div>
    );
  }

  const showList = !activeChat;

  return (
    <div className={`flex h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] rounded-2xl shadow-sm border overflow-hidden ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>

      {/* ── Conversation Sidebar ── */}
      <div className={[
        "w-full md:w-80 lg:w-96 flex-col border-r",
        dark ? "border-[#182840]" : "border-gray-100",
        showList ? "flex" : "hidden md:flex",
      ].join(" ")}>

        {/* Sidebar header */}
        <div className={`px-4 pt-4 pb-3 border-b ${dark ? 'border-[#182840]' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-extrabold tracking-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Messages</h2>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${dark ? 'text-gray-400 bg-white/[0.06]' : 'text-gray-400 bg-gray-100'}`}>{conversations.length}</span>
          </div>
          {/* Search */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? 'bg-white/[0.04] border-[#182840]' : 'bg-gray-50 border-gray-200/60'}`}>
            <Search size={14} className={dark ? 'text-gray-500' : 'text-gray-400'} />
            <input
              type="text"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Search conversations..."
              className={`flex-1 text-[13px] bg-transparent outline-none font-medium placeholder:font-normal ${dark ? 'text-gray-200 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'}`}
            />
          </div>
          {isWriter && (
            <p className={`text-[11px] mt-2 flex items-center gap-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Info size={11} /> Only investors can start conversations.
            </p>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${dark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                <MessageCircle size={28} className={dark ? 'text-gray-500' : 'text-gray-400'} strokeWidth={1.5} />
              </div>
              <p className={`text-[13px] font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                {convSearch ? "No results found" : "No conversations yet"}
              </p>
              {!convSearch && isWriter && (
                <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Investors will reach out after purchasing your projects.</p>
              )}
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv, i) => {
                const isSelected = activeChat?.chatId === conv.chatId;
                return (
                  <motion.div
                    key={conv.chatId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectChat(conv)}
                    className={[
                      "flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-all duration-150",
                      dark ? "border-[#182840]/60" : "border-gray-50",
                      isSelected
                        ? dark ? "bg-[#111111]/[0.15] border-l-2 border-l-[#4a7db5]" : "bg-[#edf2f7] border-l-2 border-l-[#111111]"
                        : dark ? "hover:bg-white/[0.04]" : "hover:bg-gray-50/80",
                    ].join(" ")}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.user.profileImage ? (
                        <img src={conv.user.profileImage} alt={conv.user.name}
                          className={`w-11 h-11 rounded-xl object-cover ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`} />
                      ) : (
                        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${getAvatarColor(conv.user.name)} flex items-center justify-center ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`}>
                          <span className="text-white text-[12px] font-bold">{getInitials(conv.user.name)}</span>
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-emerald-400 ${dark ? 'border-[#101e30]' : 'border-white'}`}></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[13px] font-bold truncate ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{conv.user.name}</span>
                        <span className={`text-[10px] tabular-nums shrink-0 ml-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {new Date(conv.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={`text-[12px] truncate flex-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{conv.lastMessage || "No messages yet"}</p>
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#111111] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{conv.unread}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={[
        "flex-1 flex-col min-w-0",
        dark ? "bg-[#0c1825]" : "bg-gray-50/40",
        !showList ? "flex" : "hidden md:flex",
      ].join(" ")}>
        {!activeChat ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                <MessageCircle size={40} className={dark ? 'text-gray-500' : 'text-[#111111]/40'} strokeWidth={1.5} />
              </div>
              <h3 className={`text-[16px] font-bold mb-1.5 ${dark ? 'text-gray-200' : 'text-gray-800'}`}>Your Messages</h3>
              <p className={`text-[13px] leading-relaxed ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select a conversation from the left to start chatting</p>
              {isWriter && (
                <div className={`mt-4 flex items-center justify-center gap-1.5 text-[12px] font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Lock size={12} />
                  <span>Investors can message you after purchasing your projects.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setActiveChat(null)} className={`md:hidden p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <ChevronLeft size={20} />
              </button>
              {/* Avatar */}
              <div className="relative shrink-0">
                {activeChat.user.profileImage ? (
                  <img src={activeChat.user.profileImage} alt={activeChat.user.name}
                    className={`w-10 h-10 rounded-xl object-cover ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`} />
                ) : (
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(activeChat.user.name)} flex items-center justify-center ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`}>
                    <span className="text-white text-[12px] font-bold">{getInitials(activeChat.user.name)}</span>
                  </div>
                )}
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-emerald-400 ${dark ? 'border-[#101e30]' : 'border-white'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-[14px] font-bold leading-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{activeChat.user.name}</h3>
                <p className={`text-[11px] font-medium capitalize ${dark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className={`w-7 h-7 border-[2.5px] rounded-full animate-spin ${dark ? 'border-gray-700 border-t-blue-400' : 'border-gray-200 border-t-[#111111]'}`}></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                    <MessageCircle size={24} className={dark ? 'text-gray-600' : 'text-gray-300'} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className={`text-[13px] font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>No messages yet</p>
                    <p className={`text-[12px] ${dark ? 'text-gray-600' : 'text-gray-400'}`}>Say hello to {activeChat.user.name}!</p>
                  </div>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                  <div key={dateLabel}>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div className={`flex-1 h-px ${dark ? 'bg-white/[0.06]' : 'bg-gray-200/60'}`}></div>
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${dark ? 'bg-white/[0.06] text-gray-500' : 'bg-gray-100 text-gray-400'}`}>{dateLabel}</span>
                      <div className={`flex-1 h-px ${dark ? 'bg-white/[0.06]' : 'bg-gray-200/60'}`}></div>
                    </div>
                    <div className="space-y-2">
                      {msgs.map((msg, i) => {
                        const senderId = msg.sender?._id || msg.sender;
                        const isMine = senderId?.toString() === user._id?.toString();
                        const showAvatar = !isMine && (i === 0 || (msgs[i - 1]?.sender?._id || msgs[i - 1]?.sender)?.toString() !== senderId?.toString());
                        return (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18 }}
                            className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            {/* Other avatar */}
                            {!isMine && (
                              <div className="w-7 h-7 shrink-0 mb-0.5">
                                {showAvatar && (
                                  activeChat.user.profileImage ? (
                                    <img src={activeChat.user.profileImage} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                  ) : (
                                    <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${getAvatarColor(activeChat.user.name)} flex items-center justify-center`}>
                                      <span className="text-white text-[9px] font-bold">{getInitials(activeChat.user.name)}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            <div className={`group relative max-w-[72%] sm:max-w-sm`}>
                              <div className={[
                                "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words",
                                isMine
                                  ? "bg-[#111111] text-white rounded-br-md"
                                  : dark
                                    ? "bg-[#182840] text-gray-200 border border-[#1d3350] rounded-bl-md"
                                    : "bg-white text-gray-800 border border-gray-200/80 shadow-sm rounded-bl-md",
                              ].join(" ")}>
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMine ? "text-[#93b4d0]" : dark ? "text-gray-600" : "text-gray-400"}`}>
                                  {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {isMine && <span className="ml-1 opacity-70">✓</span>}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="flex items-end gap-2 justify-start"
                  >
                    <div className="w-7 h-7 shrink-0">
                      {activeChat.user.profileImage ? (
                        <img src={activeChat.user.profileImage} className="w-7 h-7 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${getAvatarColor(activeChat.user.name)} flex items-center justify-center`}>
                          <span className="text-white text-[9px] font-bold">{getInitials(activeChat.user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${dark ? 'bg-[#182840] border border-[#1d3350]' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
                      <div className="flex gap-1 items-center h-3">
                        {[0, 1, 2].map(i => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full animate-bounce ${dark ? 'bg-gray-500' : 'bg-gray-400'}`}
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {isWriter && !messagesLoading && messages.length === 0 ? (
              <div className={`px-4 py-3 border-t text-center ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
                <p className={`text-[12px] flex items-center justify-center gap-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Lock size={12} /> Waiting for the investor to send the first message.
                </p>
              </div>
            ) : (
              <div className={`px-3 sm:px-4 py-3 border-t shrink-0 ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
                {sendError && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-red-500 mb-2 flex items-center gap-1.5 font-medium">
                    <Lock size={11} /> {sendError}
                  </motion.p>
                )}
                {isWriter && (
                  <p className={`text-[11px] mb-2 flex items-center gap-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                    <Info size={11} /> Replying to investor message.
                  </p>
                )}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className={`flex-1 flex items-end rounded-2xl border px-4 py-2.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#111111]/20 focus-within:border-[#111111]/40 ${dark ? 'bg-[#0c1825] border-[#182840]' : 'bg-gray-50/80 border-gray-200'}`}>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                      placeholder={isWriter ? "Reply to investor…" : "Type a message…"}
                      className={`flex-1 resize-none bg-transparent text-[13px] outline-none max-h-32 leading-relaxed font-medium ${dark ? 'text-gray-200 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'}`}
                      style={{ scrollbarWidth: "none" }}
                    />
                    <Smile size={17} className={`shrink-0 ml-2 mb-0.5 cursor-pointer transition-colors ${dark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`} />
                  </div>
                  <button type="submit" disabled={!newMessage.trim()}
                    className="w-11 h-11 bg-[#111111] text-white rounded-2xl flex items-center justify-center hover:bg-[#000000] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 hover:shadow-lg hover:shadow-[#111111]/25 active:scale-95"
                  >
                    <Send size={17} />
                  </button>
                </form>
                <p className={`text-[10px] mt-1.5 ${dark ? 'text-gray-700' : 'text-gray-300'}`}>Enter to send · Shift+Enter for new line</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
