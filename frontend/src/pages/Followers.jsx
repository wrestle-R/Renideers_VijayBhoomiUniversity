import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/components/UserSidebar';

const Followers = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('followers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'followers') endpoint = '/api/followers/followers';
      if (activeTab === 'following') endpoint = '/api/followers/following';
      if (activeTab === 'requests') endpoint = '/api/followers/pending';

      const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: { 'x-user-id': user.mongo_uid }
      });
      setData(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab]);

  const handleAccept = async (followerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/accept`, 
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleRemove = async (followerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/remove`, 
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData();
    } catch (error) {
      console.error("Remove error:", error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/unfollow`, 
        { targetUserId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData();
    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">My Network</h1>
      
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'followers' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'following' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-foreground">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground">No users found in this list.</p>
        ) : (
          data.map((u) => (
            <Card key={u._id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={u.photoUrl} />
                  <AvatarFallback>{u.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Link to={`/${u.username || u._id}`} className="font-semibold hover:underline text-foreground">
                    {u.fullName}
                  </Link>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
              </div>
              
              <div>
                {activeTab === 'requests' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleAccept(u._id)}>Accept</Button>
                    <Button variant="destructive" onClick={() => handleRemove(u._id)}>Reject</Button>
                  </div>
                )}
                {activeTab === 'followers' && (
                  <Button variant="outline" onClick={() => handleRemove(u._id)}>Remove</Button>
                )}
                {activeTab === 'following' && (
                  <Button variant="outline" onClick={() => handleUnfollow(u._id)}>Unfollow</Button>
                )}
              </div>
            </Card>
          ))
        )}
        </div>
        </div>

      </main>
    </div>
    </SidebarProvider>
  );
};

export default Followers;
