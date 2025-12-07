import { useUser } from "../context/UserContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import { UserSidebar } from "../components/UserSidebar";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* User Sidebar */}
        <UserSidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden md:inline">
                Welcome, {user.fullName}!
              </span>
              <ThemeToggle />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-green-50/20 dark:to-green-950/10">
            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
              {/* Welcome Section */}
              <div className="space-y-3 border-b border-border/40 pb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Welcome back, {user.fullName}!
                </h1>
                <p className="text-lg text-muted-foreground">Here's your trekking overview and achievements.</p>
              </div>

              {/* User Profile Card */}
              <Card className="border-border/40 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-card to-green-50/30 dark:to-green-950/20">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Profile</CardTitle>
                  <CardDescription>View your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-green-400 shadow-lg">
                      <AvatarImage src={user.photoUrl} alt={user.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xl font-bold">
                        {user.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                          <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                          <p className="text-xl font-semibold text-foreground">{user.fullName}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50">
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <p className="text-lg font-semibold text-foreground break-all">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-card via-green-50/40 to-green-50/20 dark:via-green-950/20 dark:to-green-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-green-700 dark:text-green-400">Recent Treks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">0</p>
                    <p className="text-xs text-muted-foreground mt-2">No recent treks recorded.</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-card via-teal-50/40 to-teal-50/20 dark:via-teal-950/20 dark:to-teal-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-teal-700 dark:text-teal-400">Tokens Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">0 TRK</p>
                    <p className="text-xs text-muted-foreground mt-2">Complete treks to earn tokens.</p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-br from-card via-cyan-50/40 to-cyan-50/20 dark:via-cyan-950/20 dark:to-cyan-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-cyan-700 dark:text-cyan-400">Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">0</p>
                    <p className="text-xs text-muted-foreground mt-2">Unlock achievements by trekking.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Debug Info */}
              <Card className="border-border/40 shadow-sm bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">Account IDs (Debug)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm p-3 bg-background rounded border border-border/40">
                    <p className="text-muted-foreground font-semibold mb-1">Firebase ID:</p>
                    <p className="font-mono text-xs break-all text-foreground">{user.firebase_id}</p>
                  </div>
                  <div className="text-sm p-3 bg-background rounded border border-border/40">
                    <p className="text-muted-foreground font-semibold mb-1">MongoDB UID:</p>
                    <p className="font-mono text-xs break-all text-foreground">{user.mongo_uid}</p>
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
