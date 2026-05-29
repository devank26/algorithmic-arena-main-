import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Lock, Mail, User, Eye, EyeOff, ArrowRight, Shield, Sparkles, Github, Chrome } from "lucide-react";

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const labels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-neon-green", "bg-neon-cyan"];
  const glows = ["", "shadow-red-500/30", "shadow-orange-500/30", "shadow-yellow-500/30", "shadow-neon-green/30", "shadow-neon-cyan/30"];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-1"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              level <= strength ? `${colors[strength]} shadow-sm ${glows[strength]}` : "bg-muted/40"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: level * 0.05 }}
          />
        ))}
      </div>
      <p className={`text-[10px] font-mono tracking-wider ${
        strength <= 1 ? "text-red-400" : strength <= 2 ? "text-orange-400" : strength <= 3 ? "text-yellow-400" : "text-neon-green"
      }`}>
        {labels[strength]}
      </p>
    </motion.div>
  );
}

function FloatingParticle({ delay, size, x, duration }: { delay: number; size: number; x: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 blur-sm"
      style={{ width: size, height: size, left: `${x}%` }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{
        y: "-100%",
        opacity: [0, 0.6, 0.6, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isLogin) {
        const data = await api.login(email, password);
        login(data.token, data.user);
        onClose();
      } else {
        await api.register(username, email, password);
        const data = await api.login(email, password);
        login(data.token, data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setPassword("");
  };

  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      duration: Math.random() * 6 + 8,
    })),
    []
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 bg-transparent border-none shadow-none overflow-hidden [&>button]:hidden">
        {/* Floating particles behind the modal */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {particles.map((p) => (
            <FloatingParticle key={p.id} {...p} />
          ))}
        </div>

        {/* Animated gradient border wrapper */}
        <div className="relative rounded-2xl p-px overflow-hidden">
          {/* Rotating gradient border */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "conic-gradient(from 0deg, hsl(195 100% 50% / 0.4), hsl(270 80% 60% / 0.4), hsl(150 100% 45% / 0.4), hsl(195 100% 50% / 0.4))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner content */}
          <div className="relative rounded-2xl bg-background/95 backdrop-blur-2xl overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-green" />

            {/* Header section */}
            <div className="px-8 pt-8 pb-4">
              {/* Logo */}
              <motion.div
                className="flex items-center justify-center mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="relative">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 neon-glow-cyan">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-neon-yellow" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login" : "register"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <h2 className="font-display text-xl font-bold neon-text-cyan tracking-wider">
                    {isLogin ? "WELCOME BACK" : "JOIN THE ARENA"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-body">
                    {isLogin ? "Enter your credentials to continue" : "Create your warrior profile"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-4 space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="username-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase flex items-center gap-1.5">
                      <User className="h-3 w-3" /> USERNAME
                    </label>
                    <div className="relative group">
                      <input
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your_codename"
                        className="w-full bg-muted/30 border border-border/60 rounded-lg px-4 py-2.5 text-sm font-body placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-muted/40 focus:shadow-[0_0_12px_hsl(195_100%_50%/0.1)] transition-all duration-300"
                      />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> EMAIL
                </label>
                <div className="relative group">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="warrior@arena.io"
                    className="w-full bg-muted/30 border border-border/60 rounded-lg px-4 py-2.5 text-sm font-body placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-muted/40 focus:shadow-[0_0_12px_hsl(195_100%_50%/0.1)] transition-all duration-300"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> PASSWORD
                </label>
                <div className="relative group">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-muted/30 border border-border/60 rounded-lg px-4 py-2.5 pr-10 text-sm font-body placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-muted/40 focus:shadow-[0_0_12px_hsl(195_100%_50%/0.1)] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
                {!isLogin && <PasswordStrengthBar password={password} />}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 text-xs font-bold text-neon-pink bg-neon-pink/10 border border-neon-pink/20 p-3 rounded-lg"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display font-bold text-sm tracking-wider shadow-[0_0_20px_hsl(195_100%_50%/0.3)] hover:shadow-[0_0_30px_hsl(195_100%_50%/0.5)] transition-all duration-300 gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      {isLogin ? "ENTER ARENA" : "CREATE ACCOUNT"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="px-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">OR CONTINUE WITH</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>

              {/* Social Login Buttons */}
              <div className="flex gap-3 mt-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted/30 border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all duration-200"
                >
                  <Github className="h-4 w-4" />
                  <span className="font-body text-xs font-semibold">GitHub</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted/30 border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all duration-200"
                >
                  <Chrome className="h-4 w-4" />
                  <span className="font-body text-xs font-semibold">Google</span>
                </motion.button>
              </div>
            </div>

            {/* Footer switch */}
            <div className="px-8 pb-6">
              <p className="text-xs text-center text-muted-foreground font-body">
                {isLogin ? "New to the arena? " : "Already a warrior? "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:text-primary/80 font-bold transition-colors relative group"
                >
                  {isLogin ? "Create Account" : "Log In"}
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                </button>
              </p>
            </div>

            {/* Bottom accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
