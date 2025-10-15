import React, { useEffect, useState } from 'react';
import Header from './ui/header';
import { UserAuth } from '../context/AuthContext';
import { useUserStore } from '../stores/useUserStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAllMemories } from '../services/memories';
import MemoryViewModal from './MemoryViewModal';
import { MapPin, Calendar, Star } from 'lucide-react';

const Profile = () => {
	const { session, signOut } = UserAuth();
	const { achievements, userStats, loading, fetchUserData, refreshUserStats } = useUserStore();
	const [memories, setMemories] = useState([]);
	const [memoriesLoading, setMemoriesLoading] = useState(false);
	const [selectedMemory, setSelectedMemory] = useState(null);

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
			refreshUserStats(session.user.id);
		});
	}, [session?.user?.id, fetchUserData, refreshUserStats]);

	const loadMemories = async () => {
		if (!session?.user?.id) return;
		setMemoriesLoading(true);
		try {
			const { data, error } = await getAllMemories(session.user.id);
			if (error) {
				console.error('Error fetching memories:', error);
				return;
			}
			setMemories(data || []);
		} catch (err) {
			console.error('Error loading memories:', err);
		} finally {
			setMemoriesLoading(false);
		}
	};

	useEffect(() => {
		loadMemories();
	}, [session?.user?.id]);

	const handleSignOut = async () => {
		try { await signOut(); } catch (e) {}
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
					<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm mb-6">
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

					{/* Memory Grid */}
					<div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm mb-6">
						<h2 className="text-xl font-semibold mb-4">Travel Memories</h2>
						{memoriesLoading ? (
							<div className="flex justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
							</div>
						) : memories.length === 0 ? (
							<div className="text-center py-8">
								<MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<p className="opacity-80">No memories yet. Start exploring the map to add your first memory!</p>
							</div>
						) : (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
								{memories.map((memory) => (
									<div
										key={memory.id}
										className="aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-colors group relative"
										onClick={() => setSelectedMemory(memory)}
									>
										{/* Memory Photo or Placeholder */}
										{memory.photos && memory.photos.length > 0 ? (
											<img
												src={memory.photos[0]}
												alt={memory.title}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-400/20 to-blue-500/20">
												<MapPin className="w-8 h-8 mb-2 opacity-60" />
												<span className="text-xs font-medium opacity-80 text-center px-2">
													{memory.country_name}
												</span>
											</div>
										)}
										
										{/* Overlay with memory info */}
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
											<div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
												<p className="text-xs font-medium truncate">{memory.title}</p>
												<div className="flex items-center gap-1 mt-1">
													<MapPin className="w-3 h-3" />
													<span className="text-xs opacity-80">{memory.country_name}</span>
												</div>
												{memory.memory_date && (
													<div className="flex items-center gap-1 mt-1">
														<Calendar className="w-3 h-3" />
														<span className="text-xs opacity-80">
															{new Date(memory.memory_date).toLocaleDateString()}
														</span>
													</div>
												)}
												{memory.rating && (
													<div className="flex items-center gap-1 mt-1">
														<Star className="w-3 h-3 fill-current text-yellow-400" />
														<span className="text-xs opacity-80">{memory.rating}/5</span>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="mt-8 text-center">
						<button onClick={handleSignOut} className="px-6 py-3 rounded-md bg-white/10 hover:bg-white/20 transition">Sign out</button>
					</div>
				</div>
			</div>
			
			{/* Memory View Modal */}
			{selectedMemory && (
				<MemoryViewModal 
					memory={selectedMemory} 
					onClose={() => setSelectedMemory(null)} 
				/>
			)}
		</>
	);
};

export default Profile;