'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication Context
 * 
 * Provides authentication state management across the application.
 * Handles user session, authentication state changes, and logout functionality.
 * 
 * Features:
 * - Real-time authentication state updates
 * - Automatic session management
 * - Secure logout functionality
 * - Loading state management
 */

// Define the shape of the authentication context
const AuthContext = createContext<{ 
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication context to all child components.
 * Manages user session state and handles authentication state changes.
 * 
 * @param children - React children components
 * @returns JSX element with authentication context
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    /**
     * Initial user authentication check
     * Fetches the current user and sets up authentication state
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        // Log error for debugging but don't expose to user
        console.error('Authentication error:', error.message);
      }
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null);
        setLoading(false);
      }
    };

    getUser();

    /**
     * Set up authentication state change listener
     * Handles login, logout, and session refresh events
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out function
   * Clears the user session and redirects to login
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * @returns Authentication context with user, session, signOut function, and loading state
 * 
 * @example
 * ```typescript
 * const { user, signOut, loading } = useAuth();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <div>Please log in</div>;
 * 
 * return <div>Welcome, {user.email}!</div>;
 * ```
 */
export const useAuth = () => useContext(AuthContext);
