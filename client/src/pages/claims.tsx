import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gift, Clock, CheckCircle, AlertTriangle, Sparkles, Wallet, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, PendingClaim } from "@shared/schema";

interface PendingClaimsData {
  claims: (PendingClaim & { fromUser: User })[];
}

export default function Claims() {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery<PendingClaimsData>({
    queryKey: ["/api/pending-claims"],
  });

  const claimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await apiRequest("POST", `/api/pending-claims/${claimId}/claim`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Tip claimed successfully!",
        description: `${data.amount} ${data.currency || 'BNB'} has been transferred to your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim tip. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Pending Claims</h1>
          <p className="text-muted-foreground">View and claim tips sent to you</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load pending claims. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const claims = data?.claims || [];
  const totalClaimable = claims.reduce((sum, claim) => sum + parseFloat(claim.amount), 0);

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Pending Claims</h1>
        <p className="text-muted-foreground">
          View and claim tips that were sent to you on Twitter
        </p>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Gift className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No pending claims</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  When someone sends you a tip on Twitter before you've registered, 
                  it will appear here for you to claim.
                </p>
              </div>
              <div className="pt-4">
                <Alert className="max-w-md mx-auto">
                  <Info className="h-4 w-4" />
                  <AlertTitle>How it works</AlertTitle>
                  <AlertDescription className="text-xs text-left">
                    1. Someone mentions @clipx0_ to tip you on Twitter<br />
                    2. The tip is held securely in escrow<br />
                    3. You register and claim the tip within 3 days<br />
                    4. The BNB is transferred directly to your Privy wallet
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Total Claimable</CardTitle>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {totalClaimable.toFixed(6)} BNB
                </div>
              </div>
              <CardDescription>
                You have {claims.length} pending tip{claims.length !== 1 ? 's' : ''} waiting to be claimed
              </CardDescription>
            </CardHeader>
          </Card>

          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertTitle>Ready to claim</AlertTitle>
            <AlertDescription>
              Your Privy wallet is fully set up—no extra configuration needed. Click "Claim" on any tip below to transfer it to your account.
              All claims expire 3 days after being sent.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {claims.map((claim) => {
              const daysUntilExpiry = Math.ceil(
                (new Date(claim.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const isExpiringSoon = daysUntilExpiry <= 1;

              return (
                <Card 
                  key={claim.id}
                  className={isExpiringSoon ? "border-orange-500 border-2" : ""}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="text-lg font-semibold">
                              Tip from @{claim.fromUser.username}
                            </h3>
                            <Badge variant={isExpiringSoon ? "destructive" : "secondary"}>
                              <Clock className="h-3 w-3 mr-1" />
                              {isExpiringSoon ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}` : `Expires ${new Date(claim.expiresAt).toLocaleDateString()}`}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Sent {new Date(claim.createdAt).toLocaleDateString()}</span>
                            {claim.escrowTxHash && (
                              <a
                                href={`https://bscscan.com/tx/${claim.escrowTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View on BSCScan ↗
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Amount</p>
                            <p className="text-2xl font-bold text-primary">
                              {claim.amount} {claim.currency || 'BNB'}
                            </p>
                          </div>
                          
                          <Button
                            size="lg"
                            onClick={() => claimMutation.mutate(claim.id)}
                            disabled={claimMutation.isPending}
                            className="min-w-[120px]"
                          >
                            {claimMutation.isPending ? (
                              "Claiming..."
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Claim Tip
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
