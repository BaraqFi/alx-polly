import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/actions/auth-actions';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if user has admin role (you'll need to add this to your user metadata)
  const isAdmin = user.user_metadata?.role === 'admin';
  
  if (!isAdmin) {
    redirect('/polls');
  }

  const supabase = await createClient();
  
  // Fetch all polls with user information
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      *,
      profiles:created_by (
        email,
        name
      )
    `)
    .eq("is_active", true) // Only show active polls
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-6">Error loading polls: {error.message}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          View and manage all polls in the system. Only administrators can access this page.
        </p>
      </div>

      <div className="grid gap-4">
        {polls?.map((poll) => (
          <div key={poll.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{poll.title}</h3> {/* Changed from question to title */}
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div>
                    <strong>Owner:</strong> {poll.profiles?.email || poll.created_by || 'Unknown'}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(poll.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Options:</strong> {poll.options?.length || 0}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                ID: {poll.id}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!polls || polls.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No polls found in the system.
        </div>
      )}
    </div>
  );
}
