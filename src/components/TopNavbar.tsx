import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap, LogIn, User, LogOut } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function TopNavbar() {
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <header className="h-12 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-mono text-muted-foreground">v1.0</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Zap className="h-3 w-3 text-neon-yellow" />
            <span className="text-muted-foreground">XP:</span>
            <span className="text-neon-yellow">0</span>
          </div>

          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="user"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <div className="h-7 px-2.5 rounded-full bg-primary/10 border border-primary/30 flex items-center gap-1.5 text-xs font-display font-bold text-primary">
                  <User className="h-3 w-3" />
                  {user.username}
                </div>
                <button
                  onClick={logout}
                  className="h-7 w-7 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-neon-pink hover:border-neon-pink/30 hover:bg-neon-pink/10 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setShowAuth(true)}
                className="h-7 px-3 rounded-full bg-primary/10 border border-primary/30 flex items-center gap-1.5 text-xs font-display font-bold text-primary hover:bg-primary/20 hover:shadow-[0_0_12px_hsl(195_100%_50%/0.2)] transition-all duration-200 cursor-pointer"
              >
                <LogIn className="h-3 w-3" />
                LOGIN
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
