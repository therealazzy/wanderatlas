import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "./ui/header";

const Profile = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignout = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // Pull image & initials from session
  const profileImage = session?.user?.user_metadata?.avatar_url || null;
  const name = session?.user?.user_metadata?.full_name || session?.user?.email || "?";
  const initials = name
    ?.split(" ")
    ?.map((word) => word[0])
    ?.join("")
    ?.toUpperCase();

  return (
    <>
      <Header />
      <div className="min-h-screen h-14 bg-linear-65 from-pink-400 to-purple-900 to-95% flex items-center justify-center">
        <div className="text-center">
          {/* Avatar at the top */}
          <div className="flex justify-center mb-4">
            <Avatar className="h-16 w-16">
              {profileImage && <AvatarImage src={profileImage} alt={initials} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>

          <h1 className="font-bold pb-2">Profile</h1>
          <p>Welcome, {session?.user?.email}</p>

          <Button
            onClick={handleSignout}
            className="hover:cursor-pointer px-4 py-3 mt-4"
          >
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
};

export default Profile;