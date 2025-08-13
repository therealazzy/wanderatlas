import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

export const useUserStore = create((set, get) => ({
  // State
  userData: null,
  achievements: [],
  userStats: null,
  loading: false,
  error: null,
  
  // Actions
  fetchUserData: async (userId) => {
    if (!userId) return;
    
    set({ loading: true, error: null });
    try {
      // Fetch user achievements (handle case where tables don't exist yet)
      let achievements = [];
      try {
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', userId);
        
        if (achievementsError) {
          console.warn('Achievements tables might not exist yet:', achievementsError);
        } else {
          achievements = achievementsData || [];
        }
      } catch (error) {
        console.warn('Could not fetch user achievements:', error);
      }
      
      // Fetch user stats (handle case where table doesn't exist yet)
      let stats = null;
      try {
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (statsError && statsError.code !== 'PGRST116') {
          console.warn('Stats table might not exist yet:', statsError);
        } else {
          stats = statsData;
        }
      } catch (error) {
        console.warn('Could not fetch user stats:', error);
      }
      
      console.log('Fetched user data:', { userId, achievements, stats });
      set({ 
        achievements: achievements || [], 
        userStats: stats || null,
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching user data:', error);
    }
  },
  
  // Helper getters
  getAchievementsByCategory: (category) => {
    return get().achievements.filter(ua => ua.achievement?.category === category);
  },
  
  getTotalPoints: () => {
    return get().achievements.reduce((total, ua) => total + (ua.achievement?.points || 0), 0);
  },
  
  // Reset state
  reset: () => set({ userData: null, achievements: [], userStats: null, loading: false, error: null }),
})); 