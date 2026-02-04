import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ChatContext } from '../../context/ChatContext.jsx'

const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages, markMessagesAsRead } = useContext(ChatContext)
    const { logout, onlineUsers } = useContext(AuthContext)
    const [input, setInput] = useState("")

    const navigate = useNavigate();

    const filteredUsers = input 
        ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) 
        : users;

    useEffect(() => {
        getUsers()
    }, [onlineUsers, getUsers])

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        
        // Clear local UI state immediately
        setUnseenMessages((prev) => ({ 
            ...prev, 
            [user._id]: 0 
        }));

        // Update Backend so it stays cleared after refresh
        if (markMessagesAsRead) {
            await markMessagesAsRead(user._id);
        }
    };

    return (
        <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${selectedUser ? "max-md:hidden" : ''}`}>
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <img src={assets.logo} alt="logo" className='max-w-40' />
                    <div className='relative py-2 group'>
                        <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
                        <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                            <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm hover:text-violet-400'>Edit Profile</p>
                            <hr className='my-2 border-t border-gray-500' />
                            <p onClick={() => logout()} className='cursor-pointer text-sm hover:text-red-400'>Logout</p>
                        </div>
                    </div>
                </div>

                <div className='bg-[#282142] rounded-full flex items-center gap-2 px-4 py-3 mt-5'>
                    <img src={assets.search_icon} alt="Search" className='w-3' />
                    <input 
                        onChange={(e) => setInput(e.target.value)} 
                        value={input}
                        type="text" 
                        className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' 
                        placeholder='Search User...' 
                    />
                </div>
            </div>

            <div className='flex flex-col gap-1'>
                {filteredUsers.map((user, index) => (
                    <div
                        onClick={() => {
        setSelectedUser(user);
        
        // 1. Instant UI update
        setUnseenMessages(prev => ({
            ...prev, [user._id]: 0
        }));

        // 2. Permanent DB update
        markMessagesAsRead(user._id);
    }}
    key={user._id} 
                        className={`relative flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer hover:bg-[#282142]/30 ${
                            selectedUser?._id === user._id ? 'bg-[#282142]/60' : ''
                        }`}
                    >
                        <div className="relative">
                            <img 
                                src={user?.profilepic || assets.avatar_icon} 
                                alt="" 
                                className='w-10 h-10 rounded-full object-cover border border-gray-600' 
                            />
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></span>
                            )}
                        </div>

                        <div className='flex-1 flex flex-col leading-tight'>
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-sm">{user.fullName}</p>
                                
                                {unseenMessages[user._id] > 0 && (
                                    <span className='bg-violet-600 text-white text-[10px] font-bold h-5 w-5 flex justify-center items-center rounded-full shadow-lg'>
                                        {unseenMessages[user._id]}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[11px] ${onlineUsers.includes(user._id) ? 'text-green-400' : 'text-neutral-400'}`}>
                                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Sidebar;