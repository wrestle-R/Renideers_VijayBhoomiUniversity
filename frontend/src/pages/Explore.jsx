import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UserSidebar } from '@/components/UserSidebar';

const Explore = () => {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/search?query=${query}`, {
        headers: { 'x-user-id': user.mongo_uid }
      });
      setResults(res.data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
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
      
      setResults(results.map(u => {
        if (u._id === targetUserId) {
          return { ...u, followStatus: 'none' };
        }
        return u;
      }));
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
            <h1 className="text-3xl font-bold mb-6">Explore & Find Friends</h1>
      
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

      <div className="grid gap-4">
        {results.map((u) => (
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
              {u.followStatus === 'none' && (
                <Button onClick={() => handleFollow(u._id)}>Follow</Button>
              )}
              {u.followStatus === 'pending' && (
                <Button variant="secondary" onClick={() => handleUnfollow(u._id)}>Requested</Button>
              )}
              {u.followStatus === 'accepted' && (
                <Button variant="outline" onClick={() => handleUnfollow(u._id)}>Following</Button>
              )}
            </div>
          </Card>
        ))}
        
        {results.length === 0 && query && !loading && (
          <p className="text-center text-muted-foreground">No users found.</p>
        )}
        </div>
        </div>

      </main>
    </div>
    </SidebarProvider>
  );
};

export default Explore;
