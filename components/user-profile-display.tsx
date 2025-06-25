"use client"

import { useState, useEffect } from "react"
import { User, Mail } from "lucide-react"

interface UserProfileDisplayProps {
  className?: string
  showEmail?: boolean
  size?: "sm" | "md" | "lg"
}

export function UserProfileDisplay({ 
  className = "", 
  showEmail = true, 
  size = "md" 
}: UserProfileDisplayProps) {
  const [userEmail, setUserEmail] = useState<string>("")
  const [username, setUsername] = useState<string>("")

  useEffect(() => {
    const email = localStorage.getItem('user_email') || ""
    const storedUsername = localStorage.getItem('user_username') || ""
    
    setUserEmail(email)
    
    // Fallback logic: use stored username or extract from email
    if (storedUsername) {
      setUsername(storedUsername)
    } else if (email) {
      // Extract username from email prefix
      const emailPrefix = email.split('@')[0]
      const formattedUsername = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
      setUsername(formattedUsername)
    } else {
      setUsername("User")
    }
  }, [])

  const sizeClasses = {
    sm: {
      container: "p-2 rounded-lg",
      icon: "w-6 h-6",
      username: "text-sm font-semibold",
      email: "text-xs"
    },
    md: {
      container: "p-3 rounded-xl",
      icon: "w-8 h-8",
      username: "text-base font-bold",
      email: "text-sm"
    },
    lg: {
      container: "p-4 rounded-2xl",
      icon: "w-10 h-10",
      username: "text-lg font-bold",
      email: "text-base"
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div 
      className={`
        bg-white/5 backdrop-blur-md border border-white/10 
        hover:bg-white/10 hover:border-white/20 profile-hover
        transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20
        ${currentSize.container} ${className}
      `}
      role="banner"
      aria-label={`User profile for ${username}`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2 pulse-glow"
            aria-hidden="true"
          >
            <User className={`${currentSize.icon} text-white`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div 
            className={`text-white ${currentSize.username} truncate`}
            title={username}
          >
            {username}
          </div>
          {showEmail && userEmail && (
            <div 
              className={`text-gray-300 ${currentSize.email} truncate flex items-center mt-1`}
              title={userEmail}
            >
              <Mail className="w-3 h-3 mr-1 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}