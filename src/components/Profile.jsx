import React, { useEffect } from 'react';
import Header from './ui/header';
import { UserAuth } from '../context/AuthContext';
import { useUserStore } from '../stores/useUserStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Profile = () => {
	const { session, signOut } = UserAuth();
	const { achievements, userStats, loading, fetchUserData, refreshUserStats } = useUserStore();

	const username = session?.user?.user_metadata?.username || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Explorer';
	const avatarUrl = session?.user?.user_metadata?.avatar_url || null;
	const initials = (username || 'E')
		.split(' ')
		.map(word => word[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	useEffect(() => {
		if (!session?.user?.id) return;
		fetchUserData(session.user.id).then(() => {
			// After we have achievements, recompute stats to ensure counts are current
			refreshUserStats(session.user.id);
		});
	}, [session?.user?.id, fetchUserData, refreshUserStats]);

	const handleSignOut = async () => {
		try { await signOut(); } catch (e) { console.error(e); }
	};

	return (
		<>
			<Header />
			<div className="w-full min-h-[calc(100vh-56px)] bg-linear-65 from-pink-400 to-purple-900 to-95%">
				<div className="max-w-4xl mx-auto px-4 py-10 text-white">
					{/* Profile Header */}
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<Avatar className="h-20 w-20">
								{avatarUrl && <AvatarImage src={avatarUrl} alt={initials} />}
								<AvatarFallback className="text-2xl bg-white/10 border border-white/20">{initials}</AvatarFallback>
							</Avatar>
						</div>
						<h1 className="text-3xl font-bold mb-1">Welcome, {username}!</h1>
						<p className="opacity-80">{session?.user?.email}</p>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
							<p className="text-sm opacity-80">Countries Visited</p>
							<p className="text-2xl font-semibold">{userStats?.countries_visited ?? 0}</p>
						</div>
						<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
							<p className="text-sm opacity-80">Total Memories</p>
							<p className="text-2xl font-semibold">{userStats?.total_memories ?? 0}</p>
						</div>
						<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
							<p className="text-sm opacity-80">Total Points</p>
							<p className="text-2xl font-semibold">{userStats?.total_points ?? 0}</p>
						</div>
					</div>

					{/* Achievements */}
					<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
						<h2 className="text-xl font-semibold mb-3">Achievements</h2>
						{loading ? (
							<p>Loading...</p>
						) : (
							<div className="space-y-2">
								{(achievements || []).length === 0 ? (
									<p className="opacity-80">No achievements yet.</p>
								) : (
									achievements.map((ua) => (
										<div key={ua.id} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10">
											<div>
												<p className="font-medium">{ua.achievement?.name}</p>
												<p className="text-xs opacity-70">{ua.achievement?.description}</p>
											</div>
											<span className="text-sm">+{ua.achievement?.points || 0} pts</span>
										</div>
									))
								)}
							</div>
						)}
					</div>

					<div className="mt-8 text-center">
						<button onClick={handleSignOut} className="px-6 py-3 rounded-md bg-white/10 hover:bg-white/20 transition">Sign out</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default Profile;