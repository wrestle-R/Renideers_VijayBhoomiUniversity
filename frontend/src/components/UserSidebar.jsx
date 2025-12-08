import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Home, LogOut, User, Compass, Users, Mountain } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

export function UserSidebar() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true); // Mobile only

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profiles", path: "/dashboard/profiles" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Users, label: "My Friends", path: "/followers" },
    { icon: Mountain, label: "Treks", path: "/treks" },
    { icon: Users, label: "Clubs", path: "/clubs" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-all duration-300 overflow-x-hidden w-64 lg:w-64"
        initial={false}
        animate={{ x: 0 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <img src="/logo.png" alt="Trekky" className="h-8 w-auto flex-shrink-0" />
          <span className="font-semibold text-lg">Trekky</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const active = isActive(item.path);
              return (
                <li key={index} className="relative">
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <Button
                    variant={active ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className={`w-full justify-start gap-3 transition-all duration-200 ${
                      isOpen ? "px-3" : "px-0 justify-center"
                    } ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm ml-2 hover:bg-primary/20 hover:text-primary"
                        : "text-sidebar-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`${active ? "font-semibold" : ""}`}
                    >
                      {item.label}
                    </motion.span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border">
          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0 border border-sidebar-border">
                  <AvatarImage src={user.photoUrl} alt={user.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {user.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden flex-1 min-w-0"
                >
                  <p className="text-sidebar-foreground font-medium truncate text-sm">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-sidebar-foreground/70 truncate text-xs">
                    {user.email}
                  </p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="p-4 border-b border-sidebar-border">
            <ThemeToggle showLabel={true} className="w-full justify-start text-sidebar-foreground hover:text-primary hover:bg-primary/5" />
          </div>

          {/* Logout Button */}
          <div className="p-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                Sign Out
              </motion.span>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
