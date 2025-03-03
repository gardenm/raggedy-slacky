import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: 'Search', href: '/search' },
    { name: 'Chat', href: '/chat' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <span className="text-white text-xl font-bold">Slack Archive</span>
                </Link>
              </div>
              {isAuthenticated && (
                <nav className="ml-6 flex space-x-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-indigo-100 hover:bg-indigo-500'
                        } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white">{user?.username}</span>
                  <button
                    onClick={() => logout()}
                    className="px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/login"
                    className={`${
                      pathname === '/login'
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={`${
                      pathname === '/register'
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Slack Archive RAG System
          </p>
        </div>
      </footer>
    </div>
  );
}