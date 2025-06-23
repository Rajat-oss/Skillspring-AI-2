"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, User, Send, ArrowLeft, Loader2, Sparkles, Zap, MessageSquare, Trash2 } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export default function AIChatPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem('user_email')
    if (!email) {
      router.push('/auth/login')
      return
    }
    setUserEmail(email)
    loadChatHistory(email)
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = (email: string) => {
    const cachedMessages = localStorage.getItem(`ai_chat_${email}`)
    if (cachedMessages) {
      const parsedMessages = JSON.parse(cachedMessages)
      setMessages(parsedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })))
    } else {
      // Welcome message
      setMessages([{
        id: '1',
        text: 'Hello! I\'m your AI assistant powered by Google Gemini. I\'m ready to help you with questions, provide information, assist with tasks, and have intelligent conversations. What would you like to know or discuss today?',
        sender: 'ai',
        timestamp: new Date()
      }])
    }
  }

  const saveChatHistory = (newMessages: Message[]) => {
    if (userEmail) {
      localStorage.setItem(`ai_chat_${userEmail}`, JSON.stringify(newMessages))
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage("")
    setLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          userEmail: userEmail
        })
      })

      const result = await response.json()
      
      let responseText = 'Sorry, I encountered an error. Please try again.'
      
      if (result.success) {
        responseText = result.response
      } else {
        console.error('API Error:', result.error, result.details)
        responseText = `I'm having trouble connecting to my AI service. Error: ${result.error}`
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!userEmail) {
    return null
  }

  const clearChat = () => {
    if (userEmail) {
      localStorage.removeItem(`ai_chat_${userEmail}`)
      setMessages([{
        id: '1',
        text: 'Hello! I\'m your AI assistant powered by Google Gemini. I\'m ready to help you with questions, provide information, assist with tasks, and have intelligent conversations. What would you like to know or discuss today?',
        sender: 'ai',
        timestamp: new Date()
      }])
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    AI Assistant
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 flex items-center">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Powered by Google Gemini</span>
                    <span className="sm:hidden">Gemini AI</span>
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="border-red-600/50 text-red-400 hover:bg-red-600/10"
            >
              <Trash2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
              {/* Chat Area */}
              <div className="lg:col-span-3 h-full">
                <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50 shadow-2xl h-full flex flex-col">
                  <CardHeader className="flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700/50 py-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400" />
                        <span className="text-sm sm:text-base bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                          Chat with AI
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Online</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  {/* Messages Area - Fixed Height with Scroll */}
                  <div className="flex-1 overflow-y-scroll p-3 sm:p-6 space-y-4 sm:space-y-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-lg ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            {message.sender === 'ai' && (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                            )}
                            {message.sender === 'user' && (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                              <p className="text-xs opacity-70 mt-1 sm:mt-2 flex items-center">
                                <span>{message.timestamp.toLocaleTimeString()}</span>
                                {message.sender === 'ai' && (
                                  <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 ml-2" />
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex justify-start animate-in slide-in-from-bottom-2">
                        <div className="bg-gray-800/80 backdrop-blur-sm text-gray-100 p-3 sm:p-4 rounded-2xl border border-gray-700/50">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                              </div>
                              <span className="text-xs sm:text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Fixed Input Area */}
                  <div className="flex-shrink-0 p-3 sm:p-6 border-t border-gray-700/50 bg-gray-800/30">
                    <div className="flex space-x-2 sm:space-x-3">
                      <div className="flex-1 relative">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask me anything..."
                          disabled={loading}
                          className="bg-gray-800/50 border-gray-600/50 rounded-xl pl-3 pr-10 sm:pl-4 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                        />
                        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        </div>
                      </div>
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !inputMessage.trim()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl px-3 sm:px-6 py-2 sm:py-3 shadow-lg transition-all duration-200 hover:shadow-purple-500/25"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Responsive Sidebar */}
              <div className="hidden lg:block lg:col-span-1 space-y-4">
                <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-400">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => setInputMessage("Explain quantum computing in simple terms")}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-gray-800/50"
                    >
                      <span className="text-xs">Explain quantum computing</span>
                    </Button>
                    <Button
                      onClick={() => setInputMessage("Write a Python function to sort a list")}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-gray-800/50"
                    >
                      <span className="text-xs">Help with Python code</span>
                    </Button>
                    <Button
                      onClick={() => setInputMessage("Give me creative writing tips")}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-gray-800/50"
                    >
                      <span className="text-xs">Creative writing tips</span>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900/60 backdrop-blur-xl border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-400">Chat Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white">{messages.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Status</span>
                        <span className="text-green-400 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Active
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}