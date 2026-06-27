"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import ConversationList from "@/components/ConversationList";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isChat = pathname.startsWith("/chat/");
  const activeId = isChat ? pathname.split("/chat/")[1] : null;
  const isRoot = pathname === "/";

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  const handleSelect = (id: string) => {
    router.push(`/chat/${id}`);
    if (isMobile) setSidebarOpen(false);
  };

  if (!token) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div
        className={`flex flex-col border-r border-white/5 bg-background ${
          isMobile
            ? sidebarOpen
              ? "w-full"
              : "hidden"
            : "w-[360px] shrink-0"
        }`}
      >
        <ConversationList
          activeId={activeId}
          onSelect={handleSelect}
          onCloseMobile={() => isMobile && setSidebarOpen(false)}
        />
      </div>

      <div
        className={`flex flex-1 flex-col ${
          isMobile && !sidebarOpen ? "w-full" : "hidden md:flex"
        }`}
      >
        {isRoot && !activeId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h2 className="text-xl font-semibold text-foreground/60">
                Whispr
              </h2>
              <p className="mt-1 text-sm text-foreground/30">
                Select a conversation to start chatting
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </div>
    </div>
  );
}
