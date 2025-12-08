import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/components/UserSidebar';

const Explore = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('explore'); // explore, following, followers, requests
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'followers') endpoint = '/api/followers/followers';
      if (activeTab === 'following') endpoint = '/api/followers/following';
      if (activeTab === 'requests') endpoint = '/api/followers/pending';

      if (endpoint) {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          headers: { 'x-user-id': user.mongo_uid }
        });
        setResults(res.data);
      } else if (activeTab === 'explore' && query.trim()) {
        // Only search if query exists for explore tab
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/search?query=${query}`, {
          headers: { 'x-user-id': user.mongo_uid }
        });
        setResults(res.data);
      } else if (activeTab === 'explore') {
        setResults([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'explore') fetchData();
  };

  const handleFollow = async (targetUserId) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/follow`, 
        { targetUserId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      
      // Update local state
      setResults(results.map(u => {
        if (u._id === targetUserId) {
          return { ...u, followStatus: res.data.status === 'pending' ? 'pending' : 'accepted' };
        }
        return u;
      }));
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/unfollow`, 
        { targetUserId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      
      if (activeTab === 'following') {
        fetchData(); // Refresh list
      } else {
        setResults(results.map(u => {
          if (u._id === targetUserId) {
            return { ...u, followStatus: 'none' };
          }
          return u;
        }));
      }
    } catch (error) {
      console.error("Unfollow error:", error);
    }
  };

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

  const handleReject = async (followerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/reject`, 
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchData();
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 pb-24 lg:pb-8 lg:ml-64">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Community & Friends</h1>
      
            <div className="flex gap-4 mb-6 border-b pb-2 overflow-x-auto">
              <button 
                className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'explore' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('explore')}
              >
                Find Friends
              </button>
              <button 
                className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'following' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('following')}
              >
                Following
              </button>
              <button 
                className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'followers' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('followers')}
              >
                Followers
              </button>
              <button 
                className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests
              </button>
            </div>

            {activeTab === 'explore' && (
              <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </form>
            )}

                  <div className="grid gap-4">
              {loading ? (
                <p className="text-foreground">Loading...</p>
              ) : results.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === 'explore' ? 'Search for users to follow' : 'No users found'}
                  </p>
                </Card>
              ) : (
              results.map((u) => (
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
                    {activeTab === 'explore' && (
                      <Button 
                        variant={u.followStatus === 'accepted' ? "secondary" : "default"}
                        onClick={() => u.followStatus === 'accepted' ? handleUnfollow(u._id) : handleFollow(u._id)}
                        disabled={u.followStatus === 'pending'}
                      >
                        {u.followStatus === 'accepted' ? 'Following' : 
                         u.followStatus === 'pending' ? 'Requested' : 'Follow'}
                      </Button>
                    )}

                    {activeTab === 'following' && (
                      <Button variant="outline" onClick={() => handleUnfollow(u._id)}>
                        Unfollow
                      </Button>
                    )}

                    {activeTab === 'followers' && (
                      <Button variant="outline" onClick={() => handleRemove(u._id)}>
                        Remove
                      </Button>
                    )}

                    {activeTab === 'requests' && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleAccept(u._id)} className="gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button variant="destructive" onClick={() => handleReject(u._id)} className="gap-2">
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
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

export default Explore;
