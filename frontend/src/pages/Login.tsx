import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, Gavel, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const highlights = [
  {
    icon: Zap,
    title: "Fast Triage",
    desc: "Benign requests pass in milliseconds",
  },
  {
    icon: Gavel,
    title: "Adversarial Debate",
    desc: "Prosecutor vs. Defender agents argue every risky prompt",
  },
  {
    icon: Eye,
    title: "Explainable Verdicts",
    desc: "Every block comes with plain‑English reasoning",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await register(email, username, password);

      // Normalise role exactly as AuthContext does.
      const normalizedRole = (user?.role ?? "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "");

      const redirectTo =
        normalizedRole === "superadmin" || normalizedRole === "admin"
          ? "/admin"
          : "/dashboard";
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] overflow-x-hidden bg-background">
      {/* Left – brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] flex-shrink-0 relative overflow-hidden border-r border-border bg-surface/40">
        <div className="absolute inset-0 grid-pattern" />
        <div className="ambient-orb w-96 h-96 bg-primary -top-24 -left-24" />
        <div className="ambient-orb w-80 h-80 bg-accent bottom-10 -right-16" />

        <div className="relative p-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl accent-gradient shadow-glow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Prohori AI
              </span>
              <p className="text-xs text-muted-foreground">Security Gateway</p>
            </div>
          </div>

          <div className="relative px-10 pb-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-bold tracking-tight leading-tight"
            >
              Every prompt defended.
              <br />
              <span className="gradient-text">Every verdict explained.</span>
            </motion.h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              A multi‑agent adversarial security layer that triages, debates,
              and explains every request before it reaches your LLM.
            </p>
          </div>

          <div className="relative px-10 pb-10 space-y-5">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.15 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <h.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{h.title}</div>
                  <div className="text-sm text-muted-foreground">{h.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right – auth form */}
      <div className="flex min-w-0 flex-1 items-center justify-center px-4 py-8 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="p-2 rounded-lg accent-gradient shadow-glow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Prohori AI</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-6">
            {isLogin
              ? "Sign in to your security console"
              : "Register to start protecting your prompts"}
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-surface border border-border mb-6">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setIsLogin(tab === "login")}
                className={cn(
                  "min-h-11 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  isLogin === (tab === "login")
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="analyst"
                  autoComplete="username"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm px-3 py-2.5 flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing…" : isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Multi‑agent explainable AI security gateway
          </p>
        </motion.div>
      </div>
    </div>
  );
}
