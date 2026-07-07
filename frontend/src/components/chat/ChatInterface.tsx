'use client'
import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ChatMessages from '@/components/chat/ChatMessages'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Book,
  MessageSquare,
  User,
  X,
  Send,
  Calendar,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Logo from '../../../public/miss_khalifa_ai.png'
import Link from 'next/link'
import { useToast } from '../ui/use-toast'
import { Button } from '../ui/button'
import SettingsDialog from './settings/SettingsDialog'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'

interface Message {
  text: string
  isBot: boolean
  image?: string
}

// Base URL for the backend API. Defaults to a same-origin path so that nginx
// can reverse-proxy `/api/` to the Flask backend in production. Override with
// NEXT_PUBLIC_API_URL (e.g. https://api.example.com/api/v1) if needed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [sessionId, setSessionId] = useState('')
  const [isClient, setIsClient] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    const storedSessionId = localStorage.getItem('chatSessionId')
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
  }, [])

  const handleTextToSpeech = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleCopyText = (text: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
  }

  const handleTip = (text: string) => {
    setInput(text)
    setIsThinking(false)
  }

  const handleSend = async () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, isBot: false }])
      setInput('')
      setIsThinking(true)
      try {
        const response = await axios.post(`${API_URL}/chat`, {
          message: input,
          session_id: sessionId,
        })

        console.log('Received response from backend:', response.data)

        if (response.data.session_id) {
          setSessionId(response.data.session_id)
          localStorage.setItem('chatSessionId', response.data.session_id)
        }

        if (response.data.chart) {
          setMessages((prev) => [
            ...prev,
            {
              text: response.data.response,
              isBot: true,
              chart: response.data.chart,
            },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: response.data.response,
              isBot: true,
            },
          ])
        }
      } catch (error: any) {
        console.error('Error fetching bot response:', error)
        toast({
          description:
            'Error fetching bot response: ' +
            (error.response?.data || error.message || error),
          variant: 'destructive',
        })
      } finally {
        setIsThinking(false)
      }
    }
  }

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const tips = [
    {
      text: 'What are common STI symptoms?',
      icon: Stethoscope,
      gradient: 'from-red-400 to-pink-500',
    },
    {
      text: 'How often should I get tested?',
      icon: Calendar,
      gradient: 'from-green-400 to-blue-500',
    },
    {
      text: 'How can I practice safe sex?',
      icon: Shield,
      gradient: 'from-yellow-400 to-orange-500',
    },
    {
      text: 'How do I discuss STIs with a partner?',
      icon: Users,
      gradient: 'from-pink-300 to-purple-400',
    },
  ]

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length)
    }, 10000)

    return () => clearInterval(tipInterval)
  }, [tips.length])

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Toggle Button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-full bg-gray-800 p-2 text-white md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || (isClient && window.innerWidth >= 768)) && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={`h-screen w-64 ${
              darkMode ? 'bg-[#190933] text-white' : 'bg-gray-100 text-gray-900'
            } fixed left-0 top-0 z-40 flex flex-col overflow-y-auto shadow-lg md:sticky`}
          >
            <div className="flex-grow p-4">
              <div className="mb-8 flex items-center space-x-3">
                <Image
                  src={Logo}
                  alt="Miss Khalifa AI"
                  className="h-8 w-8"
                  height={48}
                  width={48}
                />
                <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-2xl font-extrabold text-transparent">
                  Miss Khalifa AI
                </span>
              </div>

              <nav className="mb-8 space-y-4">
                <Link
                  href="/"
                  className={`flex w-full items-center space-x-2 rounded-md border px-4 py-2 text-left shadow-lg backdrop-blur-md transition-all duration-300 ${
                    darkMode
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare
                    className={darkMode ? 'text-white' : 'text-gray-900'}
                    size={20}
                  />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/Glossary"
                  className={`flex w-full items-center space-x-2 rounded-md border px-4 py-2 text-left shadow-lg backdrop-blur-md transition-all duration-300 ${
                    darkMode
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Book className={darkMode ? 'text-white' : 'text-gray-900'} />
                  <span>Glossary</span>
                </Link>
                <Link
                  href=""
                  className={`flex w-full items-center space-x-2 rounded-md border px-4 py-2 text-left shadow-lg backdrop-blur-md transition-all duration-300 ${
                    darkMode
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className={darkMode ? 'text-white' : 'text-gray-900'} />
                  <span>Feedback</span>
                </Link>
                <SettingsDialog darkMode={darkMode} setDarkMode={setDarkMode} />
              </nav>
            </div>

            <div
              className={`border-t p-4 ${darkMode ? 'border-white/20' : 'border-gray-300'}`}
            >
              <div
                className={`flex items-center justify-between rounded-full ${darkMode ? 'bg-white/10' : 'bg-gray-200'} p-1`}
              >
                <button
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    !darkMode
                      ? 'bg-white text-gray-800'
                      : 'text-white/80 hover:text-white'
                  }`}
                  onClick={() => setDarkMode(false)}
                >
                  Light
                </button>
                <button
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-800 hover:text-gray-900'
                  }`}
                  onClick={() => setDarkMode(true)}
                >
                  Dark
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="flex h-full flex-1 flex-col bg-gray-50 transition-all duration-300 ease-in-out dark:bg-[#0f0721]">
          <ChatMessages
            messages={messages}
            copiedIndex={copiedIndex}
            handleTextToSpeech={handleTextToSpeech}
            handleCopyText={handleCopyText}
            bottomRef={bottomRef}
          />
          {isThinking && (
            <motion.div
              className="flex items-center justify-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="mr-1 h-3 w-3 rounded-full bg-blue-500"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              />
              <motion.div
                className="mr-1 h-3 w-3 rounded-full bg-blue-500"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: 0.1,
                }}
              />
              <motion.div
                className="h-3 w-3 rounded-full bg-blue-500"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: 0.2,
                }}
              />
            </motion.div>
          )}
          <div className="pb-6">
            <motion.div
              className="mx-auto w-full max-w-4xl px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ScrollArea className="border-lg w-full whitespace-nowrap">
                <div className="mb-2 flex space-x-2">
                  {tips.map((tip, index) => (
                    <Button
                      key={index}
                      onClick={() => handleTip(tip.text)}
                      className={`relative rounded-xl bg-gradient-to-r ${tip.gradient} p-[1px] text-white transition-all duration-300`}
                    >
                      <span className="m-[1px] block rounded-xl bg-[#0f0721] px-3 py-2 transition-all duration-300 hover:bg-transparent">
                        {tip.text}
                      </span>
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="h-0" />
              </ScrollArea>
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Chat with Miss Khalifa..."
                  className="w-full rounded-full bg-white px-6 py-4 text-base text-gray-900 shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-[#241242] dark:text-gray-100 dark:focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-pink-500 to-purple-600 p-3 text-white transition-all duration-300 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-purple-500"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChatInterface
