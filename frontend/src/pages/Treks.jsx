import React from "react";
import TrekList from "../components/TrekList";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/components/UserSidebar";

const Treks = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <UserSidebar />
        <main className="flex-1 overflow-auto p-8 lg:ml-64">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Treks</h1>
            <p className="text-muted-foreground mb-8">Explore amazing treks and adventures.</p>
            <TrekList />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Treks;
