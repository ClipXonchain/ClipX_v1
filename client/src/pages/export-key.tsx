import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Eye, EyeOff, AlertTriangle, ArrowLeft, ShieldAlert, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrivy } from "@privy-io/react-auth";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function ExportKey() {
  const { toast } = useToast();
  const { exportWallet, ready: privyReady, authenticated: privyAuthenticated, user: privyUser } = usePrivy();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Fetch dashboard data to check wallet type
  const { data: dashboardData, isLoading } = useQuery<{
    wallet: { walletType: string; address: string };
  }>({
    queryKey: ["/api/dashboard"],
  });

  const isPrivyWallet = dashboardData?.wallet?.walletType === "privy_embedded";

  const hasEmbeddedWallet = !!privyUser?.linkedAccounts?.find(
    (account: any) =>
      account.type === "wallet" && account.walletClientType === "privy"
  );

  const canPrivyExport = privyReady && privyAuthenticated && hasEmbeddedWallet;

  const exportMutation = useMutation<{ privateKey: string }, Error, void>({
    mutationFn: async (): Promise<{ privateKey: string }> => {
      const res = await apiRequest("POST", "/api/wallet/export", {});
      return await res.json();
    },
    onSuccess: (data: { privateKey: string }) => {
      setPrivateKey(data.privateKey);
      toast({
        title: "Private Key Revealed",
        description: "Keep this safe and never share it",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to export key",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Private key copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4" data-testid="button-back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold mb-2">Export Private Key</h1>
        <p className="text-muted-foreground">
          {isPrivyWallet ? "Manage your Privy wallet security" : "Access your wallet's private key for backup or import"}
        </p>
      </div>

      {/* Privy Wallet Info */}
      {isPrivyWallet ? (
        <div className="max-w-2xl space-y-6">
          <Alert className="border-primary/50 bg-primary/5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <AlertTitle className="text-lg font-semibold">Secure Privy Wallet</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
              <p className="font-medium">
                Your wallet is managed by Privy's secure infrastructure, providing enhanced security.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <p><strong>Private key is secure:</strong> Stored in Privy's secure enclaves, never exposed to applications</p>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <p><strong>No manual management:</strong> You don't need to worry about backing up or securing keys</p>
                </div>
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <p><strong>Export availability:</strong> Depending on how the wallet was created, Privy may allow exporting the embedded wallet's private key from a secure modal.</p>
                    </div>
              </div>
            </AlertDescription>
          </Alert>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => exportWallet && exportWallet()}
                  disabled={!canPrivyExport}
                  data-testid="button-privy-export"
                >
                  Export my wallet
                </Button>
                {!canPrivyExport && (
                  <p className="text-sm text-muted-foreground">Sign in and ensure your embedded wallet exists to enable export.</p>
                )}
              </div>

          <Card>
            <CardHeader>
              <CardTitle>Why can't I export my private key?</CardTitle>
              <CardDescription>
                Understanding Privy embedded wallets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                When you logged in with Twitter, Google, or another social account, Privy automatically created 
                a <strong>secure embedded wallet</strong> for you. This is actually <strong>more secure</strong> than 
                traditional wallets because:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Your private key never leaves Privy's secure infrastructure</li>
                <li>You can't accidentally expose or lose your key</li>
                <li>No one can trick you into giving away your private key</li>
                <li>Your wallet is tied to your social login (easy recovery)</li>
              </ul>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Access your wallet:</p>
                <p className="text-sm text-muted-foreground">
                  Simply log in with the same social account you used to create it. 
                  Privy handles all the security for you automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Warning Banner for External Wallets */}
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Security Warning</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p className="font-medium">Your private key controls access to your wallet and funds.</p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Never share your private key with anyone</li>
                <li>ClipX will never ask for your private key</li>
                <li>Anyone with your private key can steal your funds</li>
                <li>Store it securely offline in multiple locations</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Export Form */}
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Reveal Private Key</CardTitle>
                <CardDescription>
                  Click the button below to decrypt and display your private key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!privateKey ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your private key is encrypted and secured. Click below to reveal it.
                    </p>
                    <Button
                      onClick={handleExport}
                      disabled={exportMutation.isPending}
                      data-testid="button-reveal-key"
                    >
                      {exportMutation.isPending ? "Decrypting..." : "Reveal Private Key"}
                    </Button>
                  </div>
                ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Private Key</label>
                  <div className="relative">
                    <code className={`block px-3 py-3 bg-muted rounded-lg text-sm font-mono break-all ${
                      showKey ? '' : 'blur-sm select-none'
                    }`} data-testid="text-private-key">
                      {privateKey}
                    </code>
                    {!showKey && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowKey(true)}
                          data-testid="button-show-key"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Click to Reveal
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {showKey && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(privateKey)}
                      data-testid="button-copy-key"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowKey(false)}
                      data-testid="button-hide-key"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Key
                    </Button>
                  </div>
                )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Security Reminders */}
            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Best Practices</AlertTitle>
              <AlertDescription className="text-sm space-y-1">
                <p>• Write down your private key on paper and store in a safe</p>
                <p>• Use a hardware wallet for long-term storage of large amounts</p>
                <p>• Never enter your private key on unknown websites</p>
                <p>• Consider using this key only for ClipX tipping</p>
              </AlertDescription>
            </Alert>
          </div>
        </>
      )}
    </div>
  );
}
