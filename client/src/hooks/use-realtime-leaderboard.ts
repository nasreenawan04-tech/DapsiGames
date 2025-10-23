import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LeaderboardEntry {
  userId: string;
  totalPoints: number;
  currentRank: number | null;
  gamesPlayed: number;
  studySessions: number;
  fullName: string;
  avatarUrl: string | null;
}

export function useRealtimeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupRealtimeSubscription() {
      try {
        // Fetch initial leaderboard data
        const response = await fetch('/api/leaderboard?limit=100');
        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        setLeaderboard(data);
        setIsLoading(false);

        // Subscribe to real-time updates on user_stats table
        channel = supabase
          .channel('leaderboard-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'user_stats'
            },
            async (payload) => {
              console.log('Leaderboard update received:', payload);
              
              // Refetch leaderboard when user_stats changes
              const response = await fetch('/api/leaderboard?limit=100');
              if (response.ok) {
                const updatedData = await response.json();
                setLeaderboard(updatedData);
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    }

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { leaderboard, isLoading, error };
}
