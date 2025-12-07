import { useUser } from "../context/UserContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { Home, Mountain, Trophy, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "#" },
    { icon: Mountain, label: "My Treks", href: "#" },
    { icon: Trophy, label: "Achievements", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <Mountain className="h-6 w-6" />
              <span className="text-lg font-bold">Trekky</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild>
                    <a href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <button className="flex items-center gap-3 w-full cursor-pointer">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-card px-4">
            <SidebarTrigger />
            <ThemeToggle />
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="space-y-8">
              {/* Welcome Section */}
              <div>
                <h1 className="text-4xl font-bold">Welcome back, {user.fullName}!</h1>
                <p className="mt-2 text-muted-foreground">Here's your trekking overview.</p>
              </div>

              {/* User Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.photoUrl} alt={user.fullName} />
                      <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-semibold">{user.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Treks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground mt-1">No recent treks recorded.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tokens Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0 TRK</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete treks to earn tokens.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Unlock achievements by trekking.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Debug Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account IDs (Debug)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Firebase ID:</p>
                    <p className="font-mono text-xs break-all">{user.firebase_id}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">MongoDB UID:</p>
                    <p className="font-mono text-xs break-all">{user.mongo_uid}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
