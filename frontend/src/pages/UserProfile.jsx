import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null); // Basic user info (name, photo)
  const [followStatus, setFollowStatus] = useState('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch profile details
        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile/${username}`);
        setProfile(profileRes.data);

        // We might need a way to get basic user info (name, photo) if it's not in the profile
        // Since the current getProfile only returns the UserProfile model, we might need to populate or fetch User model
        // For now, let's assume we can get it or we might need to update the backend to return it.
        // Actually, let's try to search for this user to get their basic info + follow status
        
        if (currentUser) {
            // Check follow status via search (hacky but works with current endpoints)
            // Better: Add a specific endpoint to check relationship
            // For now, let's just use the search endpoint with their ID or something unique if possible
            // Or just try to follow and see what happens? No.
            
            // Let's add a small endpoint or just use the search logic
            // Actually, let's just fetch the user details if we can.
            // The backend getProfile returns the profile document.
            // We need the User document for name/photo.
            // I'll assume for now the profile might have it or I need to update backend.
            // Wait, UserProfile has user_id ref.
        }

      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  // Since I can't easily get the name/photo from the current getProfile endpoint without population,
  // I will update the backend getProfile to populate the user details.
  
  if (loading) return <div className="text-foreground p-6">Loading...</div>;
  if (!profile) return <div className="text-foreground p-6">User not found</div>;

  const userDetails = profile.user_id || {};

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userDetails.photoUrl} />
            <AvatarFallback>{userDetails.fullName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl text-foreground">{userDetails.fullName}</CardTitle>
            <p className="text-muted-foreground">{userDetails.email}</p>
            <p className="mt-2 text-foreground">{profile.bio}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Goals</h3>
              <ul className="list-disc pl-5">
                {profile.goals?.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Experience Level</h3>
              <p className="capitalize text-foreground">{profile.experienceLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
