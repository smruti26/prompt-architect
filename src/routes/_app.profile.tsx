import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — ArchAI" }] }),
  component: Profile,
});

function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your identity and access.</p>
      </div>

      <Card className="glass border-border/60">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--cyan-glow)] to-[var(--violet-glow)] text-2xl font-semibold text-background">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-display text-xl font-semibold">{user.displayName}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-primary" />{user.role} · @{user.username}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={user.username} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={user.role} disabled />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => { updateProfile({ displayName, email }); toast.success("Profile updated"); }}
              className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background"
            >
              <Save className="mr-2 h-4 w-4" />Save changes
            </Button>
            <Button variant="outline" onClick={() => { logout(); navigate({ to: "/auth" }); }}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/60">
        <CardContent className="space-y-2 p-6">
          <h3 className="font-display text-lg font-semibold">Role-based access</h3>
          <p className="text-sm text-muted-foreground">Your role determines which generators and exports are available.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(["Architect", "Developer", "Admin"] as const).map((r) => (
              <div key={r} className={`rounded-lg border p-3 text-sm ${user.role === r ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 bg-card/40 text-muted-foreground"}`}>
                {r}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
