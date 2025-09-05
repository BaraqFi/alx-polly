'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { submitVote } from '@/app/lib/actions/poll-actions';
import { useAuth } from '@/app/lib/context/auth-context';

interface PollVoteComponentProps {
  poll: any;
}

export default function PollVoteComponent({ poll }: PollVoteComponentProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const totalVotes = poll.options.reduce((sum: number, option: any) => sum + (option.votes || 0), 0);

  const handleVote = async () => {
    if (selectedOption === null) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const result = await submitVote(poll.id, selectedOption);
    
    if (result.error) {
      setError(result.error);
    } else {
      setHasVoted(true);
    }
    
    setIsSubmitting(false);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {user && user.id === poll.created_by && ( // Changed from user_id to created_by
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${poll.id}/edit`}>Edit Poll</Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle> {/* Changed from question to title */}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option: string, index: number) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedOption === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button 
                onClick={handleVote} 
                disabled={selectedOption === null || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {poll.options.map((option: string, index: number) => {
                const votes = 0; // You'll need to fetch actual vote counts
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option}</span>
                      <span>{getPercentage(votes)}% ({votes} votes)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${getPercentage(votes)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </>
  );
}
