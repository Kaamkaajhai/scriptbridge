import { useEffect, useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { MessageCircle, ChevronLeft, Send } from "lucide-react";

import { useDarkMode } from "../context/DarkModeContext";

const Messages = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode: dark } = useDarkMode();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5001");
    setSocket(newSocket);
    loadConversations();
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && activeChat) {
      socket.emit("join-chat", activeChat.chatId);
      socket.on("receive-message", (message) => {
        if (message.chatId === activeChat.chatId) {
          setMessages((prev) => [...prev, message]);
        }
      });
    }
  }, [socket, activeChat]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadConversations = async () => {
    try {
      setConversations([
        { _id: "1", chatId: "chat-1", user: { _id: "user1", name: "John Doe", profileImage: "https://placehold.co/50x50/e2e8f0/64748b?text=JD", role: "investor" }, lastMessage: "Hey, interested in your script!", timestamp: new Date().toISOString() },
        { _id: "2", chatId: "chat-2", user: { _id: "user2", name: "Jane Smith", profileImage: "https://placehold.co/50x50/e2e8f0/64748b?text=JS", role: "producer" }, lastMessage: "Can we discuss the project?", timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      setMessages(data);
    } catch (error) {
      setMessages([]);
    }
  };

  const handleSelectChat = (conversation) => {
    setActiveChat(conversation);
    loadMessages(conversation.chatId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const messageData = { chatId: activeChat.chatId, sender: user._id, text: newMessage, timestamp: new Date().toISOString() };
    try {
      await api.post("/messages/send", { chatId: activeChat.chatId, text: newMessage });
      socket.emit("send-message", messageData);
      setMessages([...messages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-[#c3d5e8] border-t-[#0f2544] rounded-full animate-spin"></div>
      </div>
    );
  }

  const showList = !activeChat;

  return (
    <div className={`flex h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] rounded-2xl shadow-sm border overflow-hidden ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
      {/* ── Conversation List ── */}
      <div className={[
        "w-full md:w-80 lg:w-96 border-r flex-col",
        dark ? "border-[#182840]" : "border-gray-100/80",
        showList ? "flex" : "hidden md:flex",
      ].join(" ")}>
        <div className={`p-4 border-b ${dark ? 'border-[#182840]' : 'border-gray-100/80'}`}>
          <h2 className={`text-lg font-extrabold tracking-tight ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${dark ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                <MessageCircle size={28} className={dark ? 'text-gray-500' : 'text-gray-400'} strokeWidth={1.5} />
              </div>
              <p className={`text-sm font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeChat?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => handleSelectChat(conv)}
                  className={[
                    "p-3.5 cursor-pointer border-b transition-colors",
                    dark ? "border-[#182840] hover:bg-white/[0.04]" : "border-gray-50 hover:bg-gray-50",
                    isSelected ? (dark ? "bg-white/[0.06]" : "bg-[#edf2f7]/60") : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={conv.user.profileImage} alt={conv.user.name} className={`w-12 h-12 rounded-xl object-cover ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`} />
                      <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#1e3a5f] border-2 rounded-full ${dark ? 'border-[#101e30]' : 'border-white'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className={`text-sm font-semibold truncate ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{conv.user.name}</h3>
                        <span className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(conv.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className={`text-xs truncate ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={[
        "flex-1 flex-col",
        dark ? "bg-[#242424]" : "bg-gray-50/50",
        !showList ? "flex" : "hidden md:flex",
      ].join(" ")}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#edf2f7] to-[#f0f4f8] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={40} className="text-[#1a365d]" strokeWidth={1.5} />
              </div>
              <p className={`text-base font-semibold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Your Messages</p>
              <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-500'}`}>Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={`p-3 sm:p-4 border-b flex items-center gap-3 ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
              <button onClick={() => setActiveChat(null)} className={`md:hidden p-1.5 rounded-lg ${dark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}>
                <ChevronLeft size={20} className={dark ? 'text-gray-400' : 'text-gray-600'} />
              </button>
              <img src={activeChat.user.profileImage} alt={activeChat.user.name} className={`w-10 h-10 rounded-xl object-cover ring-2 ${dark ? 'ring-[#182840]' : 'ring-gray-100'}`} />
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>{activeChat.user.name}</h3>
                <p className={`text-xs capitalize ${dark ? 'text-gray-500' : 'text-gray-500'}`}>{activeChat.user.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={["flex", msg.sender === user._id ? "justify-end" : "justify-start"].join(" ")}
                >
                  <div className={[
                    "max-w-[75%] sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm",
                    msg.sender === user._id ? "bg-[#0f2544] text-white rounded-br-md" : dark ? "bg-[#182840] text-gray-200 border border-[#1d3350] rounded-bl-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md",
                  ].join(" ")}>
                    <p className="break-words">{msg.text}</p>
                    <p className={["text-[10px] mt-1", msg.sender === user._id ? "text-[#c3d5e8]" : "text-gray-400"].join(" ")}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className={`p-3 sm:p-4 border-t ${dark ? 'bg-[#101e30] border-[#182840]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] transition-all duration-200 ${dark ? 'bg-[#242424] border-[#1d3350] text-gray-200 placeholder-gray-600 focus:bg-[#101e30]' : 'bg-gray-50/80 border-gray-200 focus:bg-white'}`}
                />
                <button type="submit" disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-[#1e3a5f] text-white rounded-xl flex items-center justify-center hover:bg-[#162d4a] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 hover:shadow-md hover:shadow-[#1e3a5f]/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
