'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Slack Archive RAG System
          </h1>
          <p className="text-xl text-gray-600">
            Search and chat with your Slack archive using AI
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">Search</h2>
            <p className="text-gray-700 mb-4">
              Use semantic search to find messages across your Slack archive. Filter by
              channels, users, and dates to narrow down results.
            </p>
            <Link 
              href="/search" 
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Try Search
            </Link>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">Chat</h2>
            <p className="text-gray-700 mb-4">
              Ask questions about your Slack archive and get AI-powered responses. Summarize
              discussions and get insights from your conversations.
            </p>
            <Link 
              href="/chat" 
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Start Chatting
            </Link>
          </div>
        </div>

        {!isAuthenticated && !isLoading && (
          <div className="mt-12 text-center">
            <p className="text-gray-700 mb-4">
              To get started, please log in or create an account:
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/login" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Semantic Search</h3>
              <p className="text-gray-700">
                Find content based on meaning, not just keywords.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">AI-Powered Chat</h3>
              <p className="text-gray-700">
                Ask questions and get answers from your archive.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Thread Context</h3>
              <p className="text-gray-700">
                See the full context of conversations.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Advanced Filtering</h3>
              <p className="text-gray-700">
                Filter by channel, user, date, and more.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Conversation Summaries</h3>
              <p className="text-gray-700">
                Get quick summaries of long discussions.
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2">User Analytics</h3>
              <p className="text-gray-700">
                Track your search history and patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
