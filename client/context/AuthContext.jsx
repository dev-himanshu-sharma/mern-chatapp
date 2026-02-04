// import { createContext, useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { io } from "socket.io-client";

// const backendUrl = import.meta.env.VITE_BACKEND_URL;
// axios.defaults.baseURL = backendUrl;

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [authUser, setAuthUser] = useState(null);
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   const [socket, setSocket] = useState(null);

//   // ================= CHECK AUTH =================
//   const checkAuth = async () => {
//     try {
//       const storedToken = localStorage.getItem("token");
//       if (!storedToken) {
//         setAuthUser(null);
//         return;
//       }

//       axios.defaults.headers.common["token"] = storedToken;

//       const { data } = await axios.get("/api/auth/check");

//       if (data.success) {
//         setAuthUser(data.user);
//         connectSocket(data.user);
//       }
//     } catch (error) {
//       console.log("Auth check failed");
//       setAuthUser(null);
//       localStorage.removeItem("token");
//     }
//   };

//   // ================= LOGIN =================
//   const login = async (state, credentials) => {
//     try {
//       const { data } = await axios.post(`/api/auth/${state}`, credentials);

//       if (data.success) {
//         setAuthUser(data.userData);
//         setToken(data.token);
//         localStorage.setItem("token", data.token);
//         axios.defaults.headers.common["token"] = data.token;

//         connectSocket(data.userData);
//         toast.success(data.message);
//       }
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Login failed");
//     }
//   };

//   // ================= LOGOUT =================
//   const logout = () => {
//     localStorage.removeItem("token");
//     setToken(null);
//     setAuthUser(null);
//     setOnlineUsers([]);

//     axios.defaults.headers.common["token"] = null;

//     if (socket) {
//       socket.disconnect();
//       setSocket(null);
//     }

//     toast.success("Logged out successfully");
//   };

//   // ================= UPDATE PROFILE =================
//   const updateProfile = async (profileData) => {
//     try {
//       const { data } = await axios.put(
//         "/api/auth/update-profile",
//         profileData
//       );

//       if (data.success) {
//         setAuthUser(data.user);
//         toast.success("Profile updated");
//       }
//     } catch (error) {
//       toast.error("Profile update failed");
//     }
//   };

//   // ================= SOCKET =================
//   const connectSocket = (userData) => {
//     if (!userData || socket?.connected) return;

//     const newSocket = io(backendUrl, {
//       query: { userId: userData._id },
//       transports: ["websocket"],
//     });

//     newSocket.on("getOnlineUsers", (users) => {
//       setOnlineUsers(users);
//     });

//     setSocket(newSocket);
//   };

//   // ================= INIT =================
//   useEffect(() => {
//     checkAuth();

//     return () => {
//       // cleanup on refresh/unmount
//       if (socket) socket.disconnect();
//     };
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         axios,
//         authUser,
//         onlineUsers,
//         socket,
//         login,
//         logout,
//         updateProfile,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;


import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setAuthUser(null);
        return;
      }
      axios.defaults.headers.common["token"] = storedToken;
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      setAuthUser(null);
      localStorage.removeItem("token");
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["token"] = data.token;
        connectSocket(data.userData);
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };
const updateProfile = async (profileData) => {
  try {
    const { data } = await axios.put(
      "/api/auth/update-profile",
      profileData
    );

    if (data.success) {
      setAuthUser(data.user);
      toast.success("Profile updated");
    }
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Profile update failed"
    );
  }
};

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    toast.success("Logged out successfully");
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
      transports: ["websocket"],
    });
    newSocket.on("getOnlineUsers", (users) => setOnlineUsers(users));
    setSocket(newSocket);
  };

  useEffect(() => {
    checkAuth();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  return (
    <AuthContext.Provider value={{ axios, authUser, updateProfile, onlineUsers, socket, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};