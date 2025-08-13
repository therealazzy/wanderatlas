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
					.maybeSingle();

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

	// Recompute stats from source tables and upsert into user_stats
	refreshUserStats: async (userId) => {
		if (!userId) return;
		try {
			// Count memories
			const { count: memoriesCount, error: memErr } = await supabase
				.from('memories')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId);
			if (memErr) throw memErr;

			// Count visited countries
			const { count: visitedCount, error: visitedErr } = await supabase
				.from('user_countries')
				.select('country_id', { count: 'exact', head: true })
				.eq('user_id', userId)
				.eq('status', 'visited');
			if (visitedErr) throw visitedErr;

			// Compute points from in-memory achievements list
			const totalPoints = (get().achievements || []).reduce(
				(total, ua) => total + (ua.achievement?.points || 0),
				0
			);

			const payload = {
				user_id: userId,
				countries_visited: visitedCount || 0,
				total_memories: memoriesCount || 0,
				total_points: totalPoints,
				updated_at: new Date().toISOString()
			};

			// Optimistically update local store so UI reflects latest stats
			set({ userStats: payload });

			const { error: upsertErr } = await supabase
				.from('user_stats')
				.upsert(payload, { onConflict: 'user_id' });
			if (upsertErr) throw upsertErr;

			return payload;
		} catch (error) {
			console.error('Failed to refresh stats:', error);
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