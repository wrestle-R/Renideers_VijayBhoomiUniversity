import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "../../context/UserContext";
import { UserSidebar } from "../../components/UserSidebar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Users, ArrowLeft, Send, AlertTriangle, Copy, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function ClubDetails() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchClub();
  }, [id]);

  useEffect(() => {
    if (club && user && club.members.some(m => m._id === user.mongo_uid)) {
      // Initialize socket connection (allow websocket first, fallback to polling)
      const newSocket = io(import.meta.env.VITE_API_URL, { transports: ["websocket", "polling"] });
      setSocket(newSocket);

      newSocket.emit("join_club", id);

      newSocket.on("receive_message", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("message_deleted", (messageId) => {
        setMessages((prev) => prev.filter(msg => msg._id !== messageId));
      });

      newSocket.on("user_kicked", (data) => {
        if (data.userId === user.mongo_uid) {
          toast.error("You have been kicked from the club due to multiple reports.");
          navigate("/clubs");
        }
      });

      newSocket.on("user_messages_deleted", (data) => {
        if (data.userId !== user.mongo_uid) {
          setMessages((prev) => prev.filter(msg => msg.sender?._id !== data.userId && msg.sender !== data.userId));
        }
      });

      // Fetch message history
      fetchMessages();

      return () => newSocket.close();
    }
  }, [club, user, id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs/${id}/messages`, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      setMessages(res.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchClub = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clubs/${id}`, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      setClub(res.data);
    } catch (error) {
      console.error("Error fetching club:", error);
      toast.error("Failed to fetch club details");
      navigate("/clubs");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/clubs/${id}/join`, {}, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      toast.success("Joined club successfully!");
      fetchClub();
    } catch (error) {
      console.error("Error joining club:", error);
      toast.error(error.response?.data?.message || "Failed to join club");
    }
  };

  const handleLeaveClub = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/clubs/${id}/leave`, {}, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      toast.success("Left club successfully!");
      setShowLeaveConfirm(false);
      fetchClub();
      setMessages([]);
      if (socket) socket.disconnect();
    } catch (error) {
      console.error("Error leaving club:", error);
      toast.error(error.response?.data?.message || "Failed to leave club");
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) {
      toast.error("Please type a message");
      return;
    }

    const messageData = {
      clubId: id,
      senderId: user.mongo_uid,
      content: newMessage.trim(),
      senderName: user.fullName,
      senderAvatar: user.photoUrl
    };

    socket.emit("send_message", messageData);
    setNewMessage("");
  };

  const handleReportMessage = (messageId) => {
    if (!socket) return;
    const reportedMessage = messages.find(msg => msg._id === messageId);
    const alreadyReported = reportedMessage?.reports?.some(
      report => report.reportedBy === user.mongo_uid || report === user.mongo_uid
    );
    
    if (alreadyReported) {
      toast.error("You have already reported this message");
      return;
    }
    
    socket.emit("report_message", { messageId, userId: user.mongo_uid, clubId: id });
    toast.success("Message reported");
  };

  const handleMemberClick = async (memberId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${memberId}`, {
        withCredentials: true,
        headers: { 'x-user-id': user?.mongo_uid }
      });
      if (res.data.username) {
        navigate(`/${res.data.username}`);
      } else {
        toast.error("Could not load member profile");
      }
    } catch (error) {
      console.error("Error fetching member details:", error);
      toast.error("Failed to load member profile");
    }
  };

  const handleCopyInviteLink = () => {
    try {
      const link = `${window.location.origin}/clubs/${id}`;
      void navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy invite link', err);
      toast.error('Failed to copy invite link');
    }
  };
  

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!club) return null;

  const isMember = club.members.some(member => member._id === user?.mongo_uid);

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => navigate("/clubs")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clubs
          </Button>

          {/* Club Header */}
          <div className="space-y-4 pb-4 border-b">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{club.name}</h1>
              <p className="text-xl text-muted-foreground mt-2">{club.motivation}</p>
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {club.members.length} members
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={handleCopyInviteLink}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Invite
              </Button>
              {isMember ? (
                <Button variant="destructive" onClick={() => setShowLeaveConfirm(true)}>Leave Club</Button>
              ) : (
                <Button onClick={handleJoinClub} size="lg">Join Club</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: About & Members */}
            <div className="space-y-8 lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{club.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {club.members.map((member) => (
                      <button 
                        key={member._id} 
                        onClick={() => handleMemberClick(member._id)}
                        className="relative group hover:scale-110 transition-transform"
                      >
                        <Avatar className="h-10 w-10 border-2 border-background hover:border-primary transition-colors cursor-pointer">
                          <AvatarImage src={member.photoUrl} />
                          <AvatarFallback>{member.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {member.fullName}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Club Chat
                  </CardTitle>
                  <CardDescription>
                    {isMember ? "Chat with other members in real-time" : "Join the club to start chatting"}
                  </CardDescription>
                </CardHeader>
                
                {isMember ? (
                  <>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                          <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
                          <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe = msg.sender?._id === user?.mongo_uid || msg.sender === user?.mongo_uid;
                          return (
                            <div key={msg._id || idx} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={msg.sender?.photoUrl || msg.senderAvatar} />
                                <AvatarFallback>{(msg.sender?.fullName || msg.senderName)?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className={`group relative max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {msg.sender?.fullName || msg.senderName}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!isMe && msg.reports?.length > 0 && (
                                  <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded">
                                    Reported {msg.reports.length}
                                  </span>
                                )}
                              </div>
                                <div className={`p-3 rounded-2xl text-sm ${
                                  isMe 
                                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                                    : "bg-muted rounded-tl-none"
                                }`}>
                                  {msg.content}
                                </div>
                                {!isMe && (
                                  <button
                                    onClick={() => handleReportMessage(msg._id)}
                                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive"
                                    title="Report message"
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </CardContent>
                    <div className="p-4 border-t bg-muted/30">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Join the conversation</h3>
                    <p className="mb-6 max-w-xs">Become a member of {club.name} to chat with the community.</p>
                    <Button onClick={handleJoinClub}>Join Club</Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Leave Club Confirmation Dialog */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle>Leave Club?</CardTitle>
                <CardDescription>
                  Are you sure you want to leave {club?.name}? You can always rejoin later.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleLeaveClub}
                >
                  Leave Club
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
