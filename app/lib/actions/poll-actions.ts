"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// CREATE POLL
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

// GET USER POLLS
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

// GET POLL BY ID
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

// SUBMIT VOTE
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

// DELETE POLL
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

// UPDATE POLL
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

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
