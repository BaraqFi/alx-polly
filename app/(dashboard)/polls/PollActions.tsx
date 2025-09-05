"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

interface Poll {
  id: string;
  title: string; // Changed from question to title
  options?: any[]; // Made optional since it might not exist in database
  created_by: string;
}

interface PollActionsProps {
  poll: Poll;
}

export default function PollActions({ poll }: PollActionsProps) {
  const { user } = useAuth();
  
  // Debug logging to see what data we're getting
  console.log('Poll data:', poll);
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      window.location.reload();
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.title} {/* Changed from question to title */}
              </h2>
              <p className="text-slate-500">
                {poll.options ? poll.options.length : 0} options
              </p>
            </div>
          </div>
        </div>
      </Link>
      {user && user.id === poll.created_by && ( // Changed from user_id to created_by
        <div className="flex gap-2 p-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
