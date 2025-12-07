import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

const Requests = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/followers/pending`, {
        headers: { 'x-user-id': user.mongo_uid }
      });
      setRequests(res.data);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleAccept = async (followerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/accept`, 
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleReject = async (followerId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/followers/remove`, 
        { followerId },
        { headers: { 'x-user-id': user.mongo_uid } }
      );
      fetchRequests();
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Follow Requests</h1>
      <p className="text-muted-foreground mb-6">People who want to follow you</p>
      
      <div className="grid gap-4">
        {loading ? (
          <p className="text-foreground">Loading...</p>
        ) : requests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending requests</p>
          </Card>
        ) : (
          requests.map((u) => (
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
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Requests;
