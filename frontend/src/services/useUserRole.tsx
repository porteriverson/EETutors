import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Define data structures based on your schema
export interface StudentProfile {
  id: string;
  name: string; // Added 'name'
  username: string;
  role: 'admin' | 'student';
  teacher_id: string | null;
}

export interface TestResult {
  id: number;
  test_title: string;
  section_type: string;
  scaled_score: number; // 1-36
  completed_at: string;
}

interface UserState {
  user: User | null;
  profile: StudentProfile | null;
  role: 'admin' | 'student' | 'guest';
  isLoading: boolean;
}

export const useUserRole = (): UserState => {
  const [state, setState] = useState<UserState>({
    user: null,
    profile: null,
    role: 'guest',
    isLoading: true,
  });

  useEffect(() => {
    // 1. Get initial user session
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setState({
            user: null,
            profile: null,
            role: 'guest',
            isLoading: false,
          });
        }
      }
    );

    // Initial check on load
    async function initialLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await fetchUserProfile(user);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    const fetchUserProfile = async (user: User) => {
      try {
        // Fetch 'name' in the select statement
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, name, username, role, teacher_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setState({
          user,
          profile: profile as StudentProfile,
          role: (profile as StudentProfile).role,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initialLoad();

    // Cleanup the auth listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return state;
};
