import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound } from 'next/navigation';
import PollVoteComponent from './PollVoteComponent';

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Validate poll ID format (basic UUID validation)
  const pollIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!pollIdRegex.test(id)) {
    notFound();
  }

  const { poll, error } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PollVoteComponent poll={poll} />
    </div>
  );
}