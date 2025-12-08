import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSidebar } from '../components/UserSidebar';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [followStatus, setFollowStatus] = useState('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile/${username}`);
        setProfile(profileRes.data);

        // If needed: fetch/populate userData here (e.g. profileRes.data.user_id populated by backend)
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  if (loading) return <div className="text-foreground p-6">Loading...</div>;
  if (!profile) return <div className="text-foreground p-6">User not found</div>;

  const userDetails = profile.user_id || {};

  return (
    <div className="flex">
      <UserSidebar />
      <div className="flex-1 lg:ml-64 container mx-auto p-6 pb-24 lg:pb-6 max-w-4xl">
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
                  {profile.goals?.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
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
    </div>
  );
};

export default UserProfile;
