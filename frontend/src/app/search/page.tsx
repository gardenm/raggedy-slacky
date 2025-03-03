'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { searchService, SearchResponse, SearchRequest, Channel, SlackUser } from '@/lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch channels
  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: () => searchService.getChannels(),
  });

  // Fetch users
  const { data: users = [] } = useQuery<SlackUser[]>({
    queryKey: ['users'],
    queryFn: () => searchService.getUsers(),
  });

  // Search query
  const { data: searchResults, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['search', searchRequest],
    queryFn: () => {
      if (!searchRequest) return Promise.resolve({ results: [], total: 0 });
      return searchService.search(searchRequest);
    },
    enabled: !!searchRequest,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const request: SearchRequest = {
      query,
      limit: 20,
      offset: 0,
    };

    if (selectedChannels.length > 0) {
      request.channelIds = selectedChannels;
    }

    if (selectedUsers.length > 0) {
      request.userIds = selectedUsers;
    }

    if (startDate) {
      request.startDate = new Date(startDate).toISOString();
    }

    if (endDate) {
      request.endDate = new Date(endDate).toISOString();
    }

    setSearchRequest(request);
  };

  const toggleChannel = (channelId: number) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Search Slack Archive</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-grow">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Channel filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channels
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-40"
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

            {/* User filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Users
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-40"
              >
                {users.map(user => (
                  <option
                    key={user.id}
                    value={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={selectedUsers.includes(user.id) ? 'bg-indigo-100' : ''}
                  >
                    {user.realName || user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>

        {/* Search results */}
        <div>
          {error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
              Failed to search. Please try again.
            </div>
          ) : searchResults?.results && searchResults.results.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Found {searchResults.total} results
                {searchResults.metadata?.executionTimeMs && 
                  ` in ${(searchResults.metadata.executionTimeMs / 1000).toFixed(2)}s`}
              </h2>
              
              <div className="space-y-4">
                {searchResults.results.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold">
                        {result.user?.name || 'Unknown user'}
                      </span>
                      <span className="mx-2 text-gray-500">in</span>
                      <span className="font-semibold">
                        #{result.channel?.name || 'Unknown channel'}
                      </span>
                      <span className="ml-auto text-gray-500 text-sm">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">{result.content}</div>
                    {result.threadTs && (
                      <div className="mt-2">
                        <button className="text-indigo-600 text-sm hover:underline">
                          View thread
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : searchRequest ? (
            <div className="text-center py-8 text-gray-600">
              No results found for your search.
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}