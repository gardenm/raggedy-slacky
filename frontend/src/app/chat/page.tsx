'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { chatService, ChatRequest, ChatResponse, ChatIntentType, Channel } from '@/lib/api';
import { searchService } from '@/lib/api';

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  intent?: ChatIntentType;
  references?: any[];
  metadata?: any;
};

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      content: 'Hello! How can I help you with your Slack archive today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch channels
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: () => searchService.getChannels(),
  });

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare chat history (last 10 messages)
      const history = messages
        .slice(-10)
        .map((msg) => msg.content);

      // Prepare request
      const request: ChatRequest = {
        message: userMessage.content,
        history,
      };

      if (selectedChannels.length > 0) {
        request.channelIds = selectedChannels;
      }

      // Send request to API
      const response = await chatService.sendMessage(request);

      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        intent: response.intent,
        references: response.references,
        metadata: response.metadata,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, there was an error processing your request. Please try again.',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChannel = (channelId: number) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  return (
    <MainLayout>
      <div className="h-[80vh] flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Channel Sidebar */}
          <div className="w-64 bg-white p-4 overflow-y-auto border-r hidden md:block">
            <h2 className="font-bold text-gray-700 mb-4">Channels</h2>
            <div className="space-y-1">
              {channels.map(channel => (
                <div 
                  key={channel.id} 
                  className={`px-3 py-2 rounded-md cursor-pointer ${
                    selectedChannels.includes(channel.id) 
                      ? 'bg-indigo-100 text-indigo-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <span className="text-gray-700">#{channel.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-lg shadow-lg">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-3/4 rounded-lg px-4 py-2 ${
                      message.isUser 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Show references if any */}
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 text-xs border-t border-gray-200 pt-2">
                        <div className="font-bold mb-1">Sources:</div>
                        {message.references.slice(0, 3).map((ref, idx) => (
                          <div key={idx} className="mb-1">
                            {ref.channel && (
                              <span className="font-semibold">#{ref.channel} </span>
                            )}
                            {ref.user && (
                              <span>by {ref.user} </span>
                            )}
                          </div>
                        ))}
                        {message.references.length > 3 && (
                          <div className="text-indigo-500">
                            +{message.references.length - 3} more sources
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show metadata */}
                    {message.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {message.intent && (
                          <span className="mr-2">Intent: {message.intent}</span>
                        )}
                        {message.metadata.latencyMs && (
                          <span className="mr-2">
                            {(message.metadata.latencyMs / 1000).toFixed(2)}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="border-t p-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about your Slack archive..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              
              {/* Mobile channel selector */}
              <div className="md:hidden mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by channels:
                </label>
                <select
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20"
                >
                  {channels.map(channel => (
                    <option
                      key={channel.id}
                      value={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={selectedChannels.includes(channel.id) ? 'bg-indigo-100' : ''}
                    >
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}