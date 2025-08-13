import React, { useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "./ui/header";
import { useUserStore } from "../stores/useUserStore";

const Profile = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const { achievements, userStats, loading, fetchUserData } = useUserStore();

  // Get username from session metadata
  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || "Traveler";
  const profileImage = session?.user?.user_metadata?.avatar_url || null;
  const initials = username
    ?.split(" ")
    ?.map((word) => word[0])
    ?.join("")
    ?.toUpperCase();

  // Fetch user data when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData(session.user.id);
    }
  }, [session?.user?.id, fetchUserData]);

  const handleSignout = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-56px)] bg-linear-65 from-pink-400 to-purple-900 to-95%">
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                {profileImage && <AvatarImage src={profileImage} alt={initials} />}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome, {username}!</h1>
            <p className="text-gray-200">{session?.user?.email}</p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Countries Visited</h3>
              <p className="text-3xl font-bold text-yellow-300">{userStats?.countries_visited || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Total Points</h3>
              <p className="text-3xl font-bold text-green-300">{achievements?.reduce((total, ua) => total + (ua.achievement?.points || 0), 0) || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Achievements</h3>
              <p className="text-3xl font-bold text-blue-300">{achievements?.length || 0}</p>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Recent Achievements</h2>
            {loading ? (
              <p className="text-center text-gray-300">Loading achievements...</p>
            ) : achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.slice(0, 6).map((userAchievement) => (
                  <div key={userAchievement.id} className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-4xl mb-2">{userAchievement.achievement?.icon}</div>
                    <h3 className="font-semibold text-white mb-1">{userAchievement.achievement?.name}</h3>
                    <p className="text-sm text-gray-200 mb-2">{userAchievement.achievement?.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-yellow-300">+{userAchievement.achievement?.points} pts</span>
                      <span className="text-gray-300">{userAchievement.achievement?.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-300">No achievements yet. Start traveling to earn some!</p>
            )}
          </div>

          {/* Sign Out Button */}
          <div className="text-center">
            <Button
              onClick={handleSignout}
              className="hover:cursor-pointer px-6 py-3 bg-red-600 hover:bg-red-700"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;