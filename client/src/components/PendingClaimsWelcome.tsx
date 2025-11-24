import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, Wallet } from "lucide-react";
import { Link } from "wouter";
import type { PendingClaim, User } from "@shared/schema";

interface PendingClaimsWelcomeProps {
  claims: (PendingClaim & { fromUser: User })[];
}

export function PendingClaimsWelcome({ claims }: PendingClaimsWelcomeProps) {
  const [open, setOpen] = useState(false);
  const STORAGE_KEY = "clipx_welcome_shown";

  useEffect(() => {
    if (claims.length > 0) {
      const hasShown = sessionStorage.getItem(STORAGE_KEY);
      if (!hasShown) {
        setOpen(true);
        sessionStorage.setItem(STORAGE_KEY, "true");
      }
    }
  }, [claims.length]);

  if (claims.length === 0) return null;

  const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.amount), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Welcome! You Have Tips Waiting! 🎉
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary text-lg">
                  {totalAmount.toFixed(6)} BNB
                </span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                You have <strong>{claims.length} pending tip{claims.length !== 1 ? 's' : ''}</strong> from:
              </p>
              <div className="space-y-1">
                {claims.slice(0, 3).map((claim) => (
                  <p key={claim.id} className="font-medium text-foreground">
                    @{claim.fromUser.username} sent {claim.amount} BNB
                  </p>
                ))}
                {claims.length > 3 && (
                  <p className="text-xs italic">...and {claims.length - 3} more</p>
                )}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
              <div className="flex items-start gap-2">
                <Wallet className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-foreground">Good news!</p>
                  <p>
                    Your Privy wallet is ready to receive these tips. No extra setup needed—simply click "Claim" to transfer the funds to your account.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Claims expire after 3 days. Make sure to claim them before they're refunded to the sender.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/claims" onClick={() => setOpen(false)}>
              View & Claim Tips
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
            I'll do it later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
