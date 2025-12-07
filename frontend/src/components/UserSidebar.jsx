import { ThemeToggle } from "./ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import { Home, Mountain, Trophy, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

export function UserSidebar() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <Sidebar className="border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white font-bold shadow-md">
            <Mountain className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Trekky
            </span>
            <span className="text-xs text-muted-foreground">Adventure awaits</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-0 px-3 py-4">
        {user && (
          <>
            {/* User Profile Card */}
            <div className="mb-6 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 p-4 border border-green-200 dark:border-green-800/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-green-400 shadow-md">
                  <AvatarImage src={user.photoUrl} alt={user.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white font-bold">
                    {user.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <SidebarSeparator className="my-2" />
          </>
        )}

        {/* Navigation Menu */}
        <SidebarMenu className="gap-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-950/50 hover:text-green-700 dark:hover:text-green-400 group"
              >
                <a href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 px-3 py-4">
        <div className="space-y-3">
          <SidebarSeparator className="my-2" />
          
          {/* Footer Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:text-destructive/90"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
