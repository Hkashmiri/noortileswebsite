import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Music, Sparkles, Trophy, Smartphone, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const FORM_NAME = "mobile-app-signup";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [botField, setBotField] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      // Submit to current path so Netlify Forms can process it when deployed
      const res = await fetch(window.location.pathname || "/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": FORM_NAME,
          email: email.trim(),
          "bot-field": botField,
        }).toString(),
      });
      if (!res.ok) {
        if (res.status === 404) {
          setStatus("error");
          setMessage("This form only works when the site is deployed to Netlify. Deploy the site, then try again.");
          return;
        }
        throw new Error("Submission failed");
      }
      setStatus("success");
      setEmail("");
      setMessage("You're on the list! We'll notify you when the app launches.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 space-y-8"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Learn Quran & Nasheeds interactively
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight">
                Rhythm of the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Soul
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Experience spiritual learning like never before. Tap to the rhythm of beautiful recitations, unlock knowledge, and climb the leaderboards.
              </p>
              
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-lg px-8 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="text-lg px-8 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                    onClick={() => document.getElementById("app-signup")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Get notified when we launch <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 relative"
            >
              {/* Abstract decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
              <div className="relative z-10 grid grid-cols-2 gap-4">
                {/* Mock Gameplay UI Cards */}
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-2xl rotate-3 mt-12">
                   <Music className="w-12 h-12 text-primary mb-4" />
                   <h3 className="font-bold text-lg">Nasheed Mode</h3>
                   <p className="text-sm text-muted-foreground">Flow with the melody</p>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-2xl -rotate-2">
                   <Trophy className="w-12 h-12 text-secondary mb-4" />
                   <h3 className="font-bold text-lg">Earn Rewards</h3>
                   <p className="text-sm text-muted-foreground">Unlock new levels</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile app waitlist signup */}
      <section id="app-signup" className="py-20 border-t border-border/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6"
          >
            <Smartphone className="w-7 h-7" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold mb-3">
            Join the waitlist for the mobile app
          </h2>
          <p className="text-muted-foreground mb-8">
            We're building Rhythm of the Soul for iOS and Android. Leave your email and we'll notify you when it's ready.
          </p>
          <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <label htmlFor="bot-field" className="sr-only">Leave empty</label>
            <input
              id="bot-field"
              type="text"
              name="bot-field"
              value={botField}
              onChange={(e) => setBotField(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
            />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="flex-1 h-12 rounded-full text-base"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Joining…" : "Notify me"}
            </Button>
          </form>
          {status === "success" && (
            <p className="mt-4 text-primary font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> {message}
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 text-destructive text-sm">{message}</p>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Rhythm Gameplay", desc: "Sync your taps with professional Quran recitations and nasheeds.", icon: Music },
              { title: "Spiritual Quiz", desc: "Test your knowledge after every level to earn bonus stars.", icon: Sparkles },
              { title: "Global Leaderboard", desc: "Compete with friends and the ummah for the top spot.", icon: Trophy },
            ].map((feature, i) => (
              <div key={i} className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
