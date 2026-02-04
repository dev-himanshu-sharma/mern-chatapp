import React, { useEffect, useState, useRef, useContext } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessages,
    getMessages,
    markMessagesAsRead,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef(null);
  const lastMarkedId = useRef(null);

  const [input, setInput] = useState("");

  // ---------------- SEND TEXT MESSAGE ----------------
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput("");
    await sendMessages({ text: messageText });
  };

  // ---------------- SEND IMAGE MESSAGE ----------------
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      return toast.error("Select an image file");
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessages({ image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // ---------------- FETCH MESSAGES (ON USER CHANGE ONLY) ----------------
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      lastMarkedId.current = null;
    }
  }, [selectedUser?._id]);

  // ---------------- SCROLL + SEEN LOGIC ----------------
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    if (!selectedUser?._id || !authUser?._id) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const isMe = lastMessage.senderId === authUser._id;

    // ---- MARK SEEN ----
    if (
      !isMe &&
      !lastMessage.seen &&
      lastMessage._id !== lastMarkedId.current
    ) {
      lastMarkedId.current = lastMessage._id;
      markMessagesAsRead(selectedUser._id);
    }

    // ---- AUTO SCROLL ----
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser?._id, authUser?._id]);

  // ---------------- EMPTY STATE ----------------
  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-4 bg-black/10 backdrop-blur-sm max-md:hidden">
        <div className="p-6 bg-white/5 rounded-full animate-pulse">
          <img src={assets.logo_icon} className="w-20 opacity-50" alt="logo" />
        </div>
        <h2 className="text-xl text-white font-light tracking-widest uppercase">
          Welcome to QuickChat
        </h2>
        <p className="text-gray-500 text-sm">
          Select a contact to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col backdrop-blur-xl bg-white/5 overflow-hidden">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center gap-4 py-4 px-6 border-b border-white/10 bg-black/20">
        <div className="relative">
          <img
            src={selectedUser.profilepic || assets.avatar_icon}
            className="w-10 h-10 rounded-full object-cover"
            alt="profile"
          />
          {onlineUsers.includes(selectedUser._id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-white font-semibold">
            {selectedUser.fullName}
          </h3>
          <p className="text-[11px] text-gray-400">
            {onlineUsers.includes(selectedUser._id)
              ? "Active Now"
              : "Recently Active"}
          </p>
        </div>

        <button
          onClick={() => setSelectedUser(null)}
          className="p-2 hover:bg-white/10 rounded-full md:hidden"
        >
          <img src={assets.arrow_icon} className="w-5 invert" alt="back" />
        </button>
      </div>

      {/* ---------------- MESSAGES ---------------- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === authUser._id;

          return (
            <div
              key={msg._id || index}
              className={`flex gap-3 ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <img
                src={
                  isMe
                    ? authUser.profilepic || assets.avatar_icon
                    : selectedUser.profilepic || assets.avatar_icon
                }
                className="w-8 h-8 rounded-full object-cover mt-1"
                alt="avatar"
              />

              <div
                className={`flex flex-col max-w-[80%] ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-white text-sm ${
                    isMe
                      ? "bg-gradient-to-br from-violet-600 to-indigo-700 rounded-tr-none"
                      : "bg-white/10 rounded-tl-none"
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      className="rounded-xl mb-2 max-h-[300px] cursor-pointer"
                      alt="sent"
                      onClick={() => window.open(msg.image, "_blank")}
                    />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-gray-500 uppercase">
                    {formatMessageTime(msg.createdAt)}
                  </span>

                  {/* {isMe && (
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        msg.seen ? "text-blue-400" : "text-gray-500"
                      }`}
                    >
                      {msg.seen ? "Seen" : "Sent"}
                    </span>
                  )} */}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd} />
      </div>

      {/* ---------------- INPUT ---------------- */}
      <div className="p-6 bg-black/40 border-t border-white/10">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 bg-white/5 rounded-2xl p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-white px-4 py-2 outline-none"
            placeholder="Write your message..."
          />

          <input
            type="file"
            hidden
            id="image"
            accept="image/*"
            onChange={handleSendImage}
          />

          <label
            htmlFor="image"
            className="p-2 hover:bg-white/10 rounded-xl cursor-pointer"
          >
            <img src={assets.gallery_icon} className="w-5" alt="gallery" />
          </label>

          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-violet-600 p-2.5 rounded-xl disabled:opacity-50"
          >
            <img src={assets.send_button} className="w-5" alt="send" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;
