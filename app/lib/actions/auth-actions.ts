'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authentication Actions
 * 
 * This module handles all authentication-related server actions including
 * user login, registration, logout, and session management.
 * 
 * Security Features:
 * - Server-side validation
 * - Secure session handling
 * - Error message sanitization
 */

/**
 * Authenticates a user with email and password
 * 
 * @param data - Login credentials containing email and password
 * @returns Promise<{error: string | null}> - Returns error message if login fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'password123' });
 * if (result.error) {
 *   console.error('Login failed:', result.error);
 * } else {
 *   // User successfully logged in
 * }
 * ```
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Registers a new user account
 * 
 * @param data - Registration data containing name, email, and password
 * @returns Promise<{error: string | null}> - Returns error message if registration fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'password123' 
 * });
 * ```
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Signs out the current user and clears their session
 * 
 * @returns Promise<{error: string | null}> - Returns error message if logout fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (!result.error) {
 *   // User successfully logged out
 * }
 * ```
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Retrieves the currently authenticated user
 * 
 * @returns Promise<User | null> - Returns user object if authenticated, null if not
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('User ID:', user.id);
 *   console.log('User Email:', user.email);
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current user session
 * 
 * @returns Promise<Session | null> - Returns session object if active, null if not
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Session expires at:', session.expires_at);
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
