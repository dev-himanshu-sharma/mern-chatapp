import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);
  
  // Stale closure fix karne ke liye Ref zaroori hai
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      console.error("Users load error:", error);
    }
  };
  const updateUserInUsersList = (updatedUser) => {
  setUsers((prevUsers) =>
    prevUsers.map((user) =>
      user._id === updatedUser._id ? updatedUser : user
    )
  );
};


  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages.filter(Boolean));
        
        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      setMessages([]);
    }
  };

const markMessagesAsRead = async (id) => {
  try {
    // FIX: Match the actual backend route
    await axios.put(`/api/messages/mark/${id}`); 

    setMessages((prev) =>
      prev.map((msg) =>
        msg.senderId === id ? { ...msg, seen: true } : msg
      )
    );
  } catch (err) {
    console.error(err);
  }
};


  const sendMessages = async (messageData) => {
    if (!selectedUserRef.current) return;
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUserRef.current._id}`,
        messageData
      );
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      toast.error("Message send failed");
    }
  };

  // ================= SOCKET LOGIC (Bina refresh update ke liye) =================
  const subscribeToMessages = useCallback(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const currentSelected = selectedUserRef.current;
      if (currentSelected && (newMessage.senderId === currentSelected._id || newMessage.receiverId === currentSelected._id)) {
        setMessages((prev) => [...prev, newMessage]);
        if (newMessage.senderId === currentSelected._id) {
          markMessagesAsRead(currentSelected._id);
        }
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });

    // YE WALA EVENT ZAROORI HAI: Jab saamne wala hamara message dekh le
   socket.on("messagesMarkedAsSeen", ({ senderId }) => {
  const currentSelected = selectedUserRef.current;
  if (currentSelected && currentSelected._id === senderId) {
    setMessages((prev) =>
      prev.map((msg) => 
        // If I am the sender and the current user is the receiver, mark as seen
        (msg.receiverId === senderId && !msg.seen) ? { ...msg, seen: true } : msg
      )
    );
  }
});

  }, [socket]);

  useEffect(() => {
    if (authUser) getUsers();
  }, [authUser]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    subscribeToMessages();
    return () => {
      if (socket) {
        socket.off("newMessage");
        socket.off("messagesMarkedAsSeen");
      }
    };
  }, [subscribeToMessages, socket]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        users,
        selectedUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        getMessages,
        sendMessages,
        updateUserInUsersList,
        setSelectedUser,
        markMessagesAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};