import { ThemeToggle } from "./ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Home, Mountain, Trophy, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export function UserSidebar() {
  const { logout } = useUser();
  const navigate = useNavigate();

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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Mountain className="h-6 w-6" />
          <span className="text-lg font-bold">Trekky</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild>
                <a href={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
