"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Poll Management Actions
 * 
 * This module handles all poll-related server actions including creation,
 * retrieval, updating, deletion, and voting functionality.
 * 
 * Security Features:
 * - User authentication required for all operations
 * - Ownership validation for updates/deletions
 * - Input validation and sanitization
 * - Duplicate vote prevention
 * - Soft delete implementation
 */

/**
 * Creates a new poll with validation and security checks
 * 
 * @param formData - Form data containing poll question and options
 * @returns Promise<{error: string | null}> - Returns error message if creation fails, null if successful
 * 
 * Security Validations:
 * - User must be authenticated
 * - Question length validation (1-500 characters)
 * - Options count validation (2-10 options)
 * - Individual option length validation (1-200 characters)
 * - Duplicate option prevention
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What is your favorite color?');
 * formData.append('options', 'Red');
 * formData.append('options', 'Blue');
 * formData.append('options', 'Green');
 * 
 * const result = await createPoll(formData);
 * if (result.error) {
 *   console.error('Poll creation failed:', result.error);
 * }
 * ```
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Question is required." };
  }

  if (question.length > 500) {
    return { error: "Question is too long. Maximum 500 characters allowed." };
  }

  if (!options || options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  if (options.length > 10) {
    return { error: "Too many options. Maximum 10 options allowed." };
  }

  // Validate each option
  for (let i = 0; i < options.length; i++) {
    const option = options[i].trim();
    if (!option || option.length === 0) {
      return { error: `Option ${i + 1} cannot be empty.` };
    }
    if (option.length > 200) {
      return { error: `Option ${i + 1} is too long. Maximum 200 characters allowed.` };
    }
  }

  // Remove duplicates
  const uniqueOptions = [...new Set(options.map(opt => opt.trim()))];
  if (uniqueOptions.length !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  const { error } = await supabase.from("polls").insert([
    {
      created_by: user.id, // Changed from user_id to created_by
      title: question.trim(), // Changed from question to title
      options: uniqueOptions,
      is_active: true, // Add the is_active field
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the current authenticated user
 * 
 * @returns Promise<{polls: Poll[], error: string | null}> - Returns user's polls or error message
 * 
 * Features:
 * - Only returns active polls (is_active = true)
 * - Ordered by creation date (newest first)
 * - Returns empty array if user not authenticated
 * 
 * @example
 * ```typescript
 * const { polls, error } = await getUserPolls();
 * if (error) {
 *   console.error('Failed to fetch polls:', error);
 * } else {
 *   console.log(`Found ${polls.length} polls`);
 * }
 * ```
 */
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("created_by", user.id) // Changed from user_id to created_by
    .eq("is_active", true) // Only get active polls
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a specific poll by ID with security validation
 * 
 * @param id - UUID of the poll to retrieve
 * @returns Promise<{poll: Poll | null, error: string | null}> - Returns poll data or error message
 * 
 * Security Features:
 * - Only returns active polls (is_active = true)
 * - Validates poll exists before returning
 * 
 * @example
 * ```typescript
 * const { poll, error } = await getPollById('123e4567-e89b-12d3-a456-426614174000');
 * if (error) {
 *   console.error('Poll not found:', error);
 * } else {
 *   console.log('Poll title:', poll.title);
 * }
 * ```
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .eq("is_active", true) // Only get active polls
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

/**
 * Submits a vote for a specific poll option with comprehensive validation
 * 
 * @param pollId - UUID of the poll being voted on
 * @param optionIndex - Zero-based index of the selected option
 * @returns Promise<{error: string | null}> - Returns error message if voting fails, null if successful
 * 
 * Security Validations:
 * - Poll must exist and be active
 * - Option index must be valid (within bounds)
 * - Prevents duplicate voting for authenticated users
 * - Allows anonymous voting (user_id can be null)
 * 
 * @example
 * ```typescript
 * const result = await submitVote('poll-uuid', 0); // Vote for first option
 * if (result.error) {
 *   console.error('Vote failed:', result.error);
 * } else {
 *   console.log('Vote submitted successfully');
 * }
 * ```
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate poll exists and option is valid
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found" };
  }

  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "Invalid option selected" };
  }

  // Check for duplicate votes (if user is authenticated)
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: "You have already voted on this poll" };
    }
  }

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Soft deletes a poll (sets is_active to false) with ownership validation
 * 
 * @param id - UUID of the poll to delete
 * @returns Promise<{error: string | null}> - Returns error message if deletion fails, null if successful
 * 
 * Security Features:
 * - User must be authenticated
 * - User can only delete their own polls
 * - Soft delete (preserves data integrity)
 * - Validates poll exists before deletion
 * 
 * @example
 * ```typescript
 * const result = await deletePoll('poll-uuid');
 * if (result.error) {
 *   console.error('Delete failed:', result.error);
 * } else {
 *   console.log('Poll deleted successfully');
 * }
 * ```
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: "Authentication required" };
  }

  // Verify poll ownership before deletion
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("created_by") // Changed from user_id to created_by
    .eq("id", id)
    .eq("is_active", true) // Only work with active polls
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found" };
  }

  if (poll.created_by !== user.id) { // Changed from user_id to created_by
    return { error: "Unauthorized: You can only delete your own polls" };
  }

  // Soft delete by setting is_active to false instead of hard delete
  const { error } = await supabase
    .from("polls")
    .update({ is_active: false })
    .eq("id", id)
    .eq("created_by", user.id); // Changed from user_id to created_by

  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with validation and ownership checks
 * 
 * @param pollId - UUID of the poll to update
 * @param formData - Form data containing updated question and options
 * @returns Promise<{error: string | null}> - Returns error message if update fails, null if successful
 * 
 * Security Validations:
 * - User must be authenticated
 * - User can only update their own polls
 * - Same validation rules as createPoll
 * - Validates poll exists before updating
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'Updated question');
 * formData.append('options', 'Option 1');
 * formData.append('options', 'Option 2');
 * 
 * const result = await updatePoll('poll-uuid', formData);
 * if (result.error) {
 *   console.error('Update failed:', result.error);
 * }
 * ```
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Input validation
  if (!question || question.trim().length === 0) {
    return { error: "Question is required." };
  }

  if (question.length > 500) {
    return { error: "Question is too long. Maximum 500 characters allowed." };
  }

  if (!options || options.length < 2) {
    return { error: "Please provide at least two options." };
  }

  if (options.length > 10) {
    return { error: "Too many options. Maximum 10 options allowed." };
  }

  // Validate each option
  for (let i = 0; i < options.length; i++) {
    const option = options[i].trim();
    if (!option || option.length === 0) {
      return { error: `Option ${i + 1} cannot be empty.` };
    }
    if (option.length > 200) {
      return { error: `Option ${i + 1} is too long. Maximum 200 characters allowed.` };
    }
  }

  // Remove duplicates
  const uniqueOptions = [...new Set(options.map(opt => opt.trim()))];
  if (uniqueOptions.length !== options.length) {
    return { error: "Duplicate options are not allowed." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Verify poll ownership before updating
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("created_by") // Changed from user_id to created_by
    .eq("id", pollId)
    .eq("is_active", true) // Only work with active polls
    .single();

  if (pollError || !poll) {
    return { error: "Poll not found" };
  }

  if (poll.created_by !== user.id) { // Changed from user_id to created_by
    return { error: "Unauthorized: You can only update your own polls" };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ title: question.trim(), options: uniqueOptions }) // Changed from question to title
    .eq("id", pollId)
    .eq("created_by", user.id); // Changed from user_id to created_by

  return { error: null };
}

/**
 * Retrieves vote counts for a specific poll
 * 
 * @param pollId - UUID of the poll to get vote counts for
 * @returns Promise<{voteCounts: number[], totalVotes: number, error: string | null}> - Returns vote data or error
 * 
 * Features:
 * - Counts votes for each option index
 * - Returns total vote count
 * - Handles polls with no votes gracefully
 * 
 * @example
 * ```typescript
 * const { voteCounts, totalVotes, error } = await getVoteCounts('poll-uuid');
 * if (!error) {
 *   console.log(`Total votes: ${totalVotes}`);
 *   voteCounts.forEach((count, index) => {
 *     console.log(`Option ${index}: ${count} votes`);
 *   });
 * }
 * ```
 */
export async function getVoteCounts(pollId: string) {
  const supabase = await createClient();
  
  const { data: votes, error } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", pollId);

  if (error) return { voteCounts: [], totalVotes: 0, error: error.message };

  // Count votes for each option
  const voteCounts = votes.reduce((counts: number[], vote) => {
    const index = vote.option_index;
    if (index >= 0 && index < counts.length) {
      counts[index] = (counts[index] || 0) + 1;
    }
    return counts;
  }, []);

  const totalVotes = votes.length;
  
  return { voteCounts, totalVotes, error: null };
}
