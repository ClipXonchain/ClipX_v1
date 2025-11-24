import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowDownToLine, Key, CheckCircle, Clock, XCircle, ArrowUpRight, ArrowDownLeft, Gift, TrendingUp, TrendingDown, Activity, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Wallet, Transaction, PendingClaim } from "@shared/schema";
import { useEffect } from "react";
import { PendingClaimsWelcome } from "@/components/PendingClaimsWelcome";

interface DashboardData {
  user: User;
  wallet: Wallet;
  balance: string;
  clipxBalance: string;
  asterBalance: string;
  estimatedGasCost: string;
  estimatedTokenGasCost: string;
  recentTransactions: (Transaction & { 
    fromUser: User; 
    toUser: User;
  })[];
  stats: {
    totalSent: {
      count: number;
      bnbAmount: number;
      clipxAmount: number;
      asterAmount: number;
    };
    totalReceived: {
      count: number;
      bnbAmount: number;
      clipxAmount: number;
      asterAmount: number;
    };
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
  };
}

interface PendingClaimsData {
  claims: (PendingClaim & { fromUser: User })[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    // Poll dashboard every 30s so balance updates after on-chain deposits
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: pendingClaimsData, isLoading: isLoadingClaims } = useQuery<PendingClaimsData>({
    queryKey: ["/api/pending-claims"],
  });

  const claimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const response = await apiRequest("POST", `/api/pending-claims/${claimId}/claim`);
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Tip claimed!",
        description: `Successfully claimed ${data.amount} ${data.currency || 'BNB'}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim tip",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Subscribe to server-sent events for balance updates and update the react-query cache
  useEffect(() => {
    let es: EventSource | null = null;

    try {
      es = new EventSource('/api/sse/balance');
    } catch (e) {
      console.debug('SSE not available:', e);
      return;
    }

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload && typeof payload.balance === 'string') {
          queryClient.setQueryData(['/api/dashboard'], (old: any) => {
            if (!old) return old;
            return { ...old, balance: payload.balance };
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    es.onerror = (err) => {
      // On error, close the connection. React-query polling still exists as fallback.
      try { es.close(); } catch (_) {}
    };

    return () => { if (es) es.close(); };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Welcome Dialog for new users with pending claims */}
      {!isLoadingClaims && pendingClaimsData && (
        <PendingClaimsWelcome claims={pendingClaimsData.claims} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your wallet and view transaction history
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{data.stats.totalSent.count}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{data.stats.totalSent.bnbAmount.toFixed(4)} BNB</p>
                <p>{data.stats.totalSent.clipxAmount.toFixed(2)} ClipX</p>
                <p>{data.stats.totalSent.asterAmount.toFixed(2)} Aster</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Received */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Received</p>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{data.stats.totalReceived.count}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{data.stats.totalReceived.bnbAmount.toFixed(4)} BNB</p>
                <p>{data.stats.totalReceived.clipxAmount.toFixed(2)} ClipX</p>
                <p>{data.stats.totalReceived.asterAmount.toFixed(2)} Aster</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Activity</p>
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{data.stats.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">
                All transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {data.stats.totalTransactions > 0
                  ? Math.round((data.stats.successfulTransactions / data.stats.totalTransactions) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">
                {data.stats.successfulTransactions} of {data.stats.totalTransactions} successful
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Claims Banner */}
      {!isLoadingClaims && pendingClaimsData && pendingClaimsData.claims.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle>Pending Tips Awaiting Claim</CardTitle>
            </div>
            <CardDescription>
              You have {pendingClaimsData.claims.length} tip{pendingClaimsData.claims.length !== 1 ? 's' : ''} waiting to be claimed. Your Privy wallet is ready—no extra setup needed!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingClaimsData.claims.slice(0, 2).map((claim) => (
              <div
                key={claim.id}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border"
                data-testid={`pending-claim-${claim.id}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">
                      Tip from @{claim.fromUser.username}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Expires {new Date(claim.expiresAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sent {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-right flex items-center gap-3">
                  <p className="text-lg font-semibold text-primary">
                    {claim.amount} {claim.currency || 'BNB'}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => claimMutation.mutate(claim.id)}
                    disabled={claimMutation.isPending}
                    data-testid={`button-claim-${claim.id}`}
                  >
                    {claimMutation.isPending ? "Claiming..." : "Claim"}
                  </Button>
                </div>
              </div>
            ))}
            {pendingClaimsData.claims.length > 2 && (
              <div className="pt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/claims">
                    View All {pendingClaimsData.claims.length} Claims
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Wallet Overview Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your BNB balance on BSC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1" data-testid="text-balance">
                    {Number(data.balance).toFixed(6)} BNB
                  </div>
                <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] })}>
                  Refresh
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Est. Gas per Tip</p>
                <p className="text-sm font-mono font-medium" data-testid="text-gas-cost">
                  ~{data.estimatedGasCost} BNB
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available for Tips</p>
                <p className="text-sm font-mono font-medium text-green-600" data-testid="text-available-balance">
                  ~{(Math.max(0, Number(data.balance) - Number(data.estimatedGasCost))).toFixed(6)} BNB
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono break-words max-w-full" data-testid="text-wallet-address">
                  {data.wallet.address}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(data.wallet.address, "Wallet address")}
                  data-testid="button-copy-address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="w-full sm:w-auto" data-testid="button-deposit">
                <Link href="/deposit">
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Deposit BNB
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto" data-testid="button-export-key">
                <Link href="/export-key">
                  <Key className="h-4 w-4 mr-2" />
                  Export Private Key
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bot Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Status</CardTitle>
            <CardDescription>ClipX tipping bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Bot Username</p>
              <p className="text-sm text-muted-foreground">@clipx0_</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">How to Send a Tip</p>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-xs">
                  @clipx0_ send tip 0.1 bnb to @username
                </code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Checking mentions every 5 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest tip activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions" data-testid="link-view-all-transactions">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Send your first tip on Twitter to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((tx) => {
                const isSent = tx.fromUserId === data.user.id;
                const otherUser = isSent ? tx.toUser : tx.fromUser;
                
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isSent ? 'bg-orange-100 dark:bg-orange-950' : 'bg-green-100 dark:bg-green-950'
                    }`}>
                      {isSent ? (
                        <ArrowUpRight className="h-5 w-5 text-orange-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {isSent ? 'Sent to' : 'Received from'} @{otherUser.username}
                        </p>
                        <Badge variant={getStatusBadgeVariant(tx.status)} className="text-xs">
                          {getStatusIcon(tx.status)}
                          <span className="ml-1 capitalize">{tx.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tx.txHash && (
                          <>
                            <code className="font-mono">{truncateAddress(tx.txHash)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => copyToClipboard(tx.txHash!, "Transaction hash")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                      {tx.status === 'failed' && tx.errorMessage && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-destructive" data-testid={`error-message-${tx.id}`}>
                          <XCircle className="h-3 w-3" />
                          <span>{tx.errorMessage}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        isSent ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {isSent ? '-' : '+'}{tx.amount} {tx.currency || 'BNB'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
