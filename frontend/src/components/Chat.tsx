import React, { useState, useEffect, useRef } from "react";
import { useSocket, socket } from "../hooks/useSocket";
import { FaTrash } from "react-icons/fa";
import  EmojiPicker  from "emoji-picker-react";
import { EmojiClickData } from "emoji-picker-react";

interface ChatMessage {
  user: string;
  text: string;
  timestamp: string;
}

interface ChatProps {
  Height?: string | number;
  Width?: string | number;
}

const Chat: React.FC<ChatProps> = ({ Height, Width }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = "Logged-in User"; // Replace with dynamic user data

  // Receive the chat log and new messages
  useSocket("chatLog", (chatLog: ChatMessage[]) => {
    setMessages(chatLog);
  });

  useSocket("newMessage", (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  });

  // Typing event handlers
  useSocket("userTyping", (user: string) => {
    setTypingUsers((prev) => (prev.includes(user) ? prev : [...prev, user]));
  });

  useSocket("userStoppedTyping", (user: string) => {
    setTypingUsers((prev) => prev.filter((u) => u !== user));
  });

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { user: currentUser });
    }

    setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", { user: currentUser });
    }, 1000); // Adjust delay as needed
  };

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit("sendMessage", {
        user: currentUser,
        text: input.trim(),
        timestamp: new Date().toISOString(),
      });
      setInput("");
    }
  };

  const deleteMessage = (timestamp: string) => {
    socket.emit("deleteMessage", { timestamp });
    setMessages((prev) => prev.filter((msg) => msg.timestamp !== timestamp));
  };

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { 
      e.preventDefault();  
      sendMessage();      
    }
  };

  return (
    <div
      className="flex flex-col border border-gray-300 dark:border-gray-800 rounded-lg shadow-lg drop-shadow-lg"
      style={{
        maxHeight: Height || "auto",
        maxWidth: Width || "auto",
        minHeight: Height || "auto",
        minWidth: Width || "auto",
      }}
    >
      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-scroll overflow-x-hidden p-4 bg-gray-100 dark:bg-primarySecondary"
      >
        {messages.map((msg, index) => {
          const isCurrentUser = msg.user === currentUser;
          return (
            <div
              key={index}
              className={`flex ${isCurrentUser ? "flex-row-reverse" : ""} mb-4 gap-2 items-baseline`}
            >
              <span className={`text-blue-600 text-sm ${isCurrentUser ? "font-bold" : ""}`}>
                {isCurrentUser ? "You" : msg.user}
              </span>
              <span
                className={`font-bold text-black py-2 px-4 rounded-lg ${
                  isCurrentUser ? "rounded-br-none bg-green-400" : "rounded-bl-none bg-yellow-100"
                }`}
              >
                {msg.text}
              </span>
              {isCurrentUser ? (
                <FaTrash
                  title="Delete Message"
                  className="text-red-500 cursor-pointer"
                  onClick={() => deleteMessage(msg.timestamp)}
                />
              ) : null}
              <span className="text-[12px] text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Typing indicator */}
      <div className="p-2 text-gray-500 text-sm">
        {typingUsers.length > 0 && `${typingUsers.join(", ")} ${typingUsers.length > 1 ? "are" : "is"} typing...`}
      </div>

      {/* Input box */}
      <div className="flex gap-2 items-center p-4 bg-white border-t border-gray-200 dark:bg-primarySecondary dark:border-gray-700">
        {/* Emoji picker button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="px-2 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          😊
        </button>

        {/* Emoji Picker container */}
        {showEmojiPicker && (
          <div
            className="absolute bottom-16 left-0 z-10"
            style={{
              position: "absolute",
              bottom: "60px",
              left: "0",
              zIndex: 9999,
            }}
          >
            <EmojiPicker
              onEmojiClick={(emoji: EmojiClickData) => setInput(input + emoji.emoji)}
            />
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-grow border-b-2 rounded-md p-2 focus:outline-none bg-transparent dark:border-gray-400 dark:text-gray-300"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-green-600 text-black font-bold rounded-md hover:bg-green-900 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
