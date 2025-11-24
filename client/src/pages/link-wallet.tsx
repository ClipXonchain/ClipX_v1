import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Wallet, Check, Twitter, AlertCircle, Download, Eye, EyeOff, Copy } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";

export default function LinkWallet() {
  const { toast } = useToast();
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [showImportKey, setShowImportKey] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const { data: dashboardData } = useQuery<{
    wallet: { walletType: string; address: string };
  }>({
    queryKey: ["/api/dashboard"],
  });

  const hasExternalWallet = dashboardData?.wallet?.walletType === 'external';

  const generateWalletMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wallet/generate", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Wallet Generated!",
        description: "Your tipping wallet is ready. Send BNB to start tipping!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate wallet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/wallet/export", {});
      const data = await res.json();
      return data.privateKey;
    },
    onSuccess: (privateKey: string) => {
      setExportedKey(privateKey);
      toast({
        title: "Private Key Exported",
        description: "Keep this secure! Anyone with this key can access your funds.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export private key.",
        variant: "destructive",
      });
    },
  });

  const importWalletMutation = useMutation({
    mutationFn: async (privateKey: string) => {
      const res = await apiRequest("POST", "/api/wallet/import", { privateKey });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setImportKey('');
      toast({
        title: "Wallet Imported!",
        description: `Successfully imported wallet: ${data.address}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import wallet. Check your private key.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Private key copied to clipboard",
    });
  };

  const handleImportWallet = () => {
    if (!importKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a private key",
        variant: "destructive",
      });
      return;
    }
    importWalletMutation.mutate(importKey.trim());
  };

  const handleReplaceWalletClick = () => {
    if (!importKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a private key",
        variant: "destructive",
      });
      return;
    }
    setShowReplaceConfirm(true);
  };

  const confirmReplaceWallet = () => {
    setShowReplaceConfirm(false);
    importWalletMutation.mutate(importKey.trim());
  };

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
        <h1 className="text-3xl font-semibold mb-2">External Wallet</h1>
        <p className="text-muted-foreground">
          Connect an external wallet to enable Twitter bot tipping
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Wallet Status</CardTitle>
          <CardDescription>Your active wallet configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasExternalWallet ? (
            <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <Check className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-primary">External Wallet Connected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Twitter bot tipping enabled!
                </p>
                <code className="text-xs font-mono mt-2 block">{dashboardData?.wallet?.address}</code>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">No External Wallet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add an external wallet below to enable Twitter bot tipping
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Twitter Bot Tipping Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Twitter Bot Tipping
          </CardTitle>
          <CardDescription>
            Enable automatic tipping via Twitter mentions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasExternalWallet && (
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>External wallet required:</strong> Twitter bot tipping needs an external wallet (MetaMask, WalletConnect, etc.) because the bot operates independently and cannot access Privy embedded wallet keys.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">How it works:</h4>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
              <li>Connect your MetaMask or other external wallet</li>
              <li>Your wallet will be used for Twitter bot tips</li>
              <li>Mention @clipx0_ on Twitter: <code className="text-xs bg-muted px-1 py-0.5 rounded">@clipx0_ send 0.1 bnb to @username</code></li>
              <li>Bot processes tip automatically using your connected wallet</li>
            </ol>
          </div>

          {hasExternalWallet ? (
            <Alert className="border-primary/50 bg-primary/5">
              <Check className="h-4 w-4 text-primary" />
              <AlertDescription>
                Your tipping wallet is ready! You can now send tips via Twitter bot.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Import Existing Wallet</h4>
                <Alert className="border-blue-500/50 bg-blue-500/5">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm">
                    <strong>Lost your wallet?</strong> Import it back using your private key to restore access to your funds.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                      type={showImportKey ? "text" : "password"}
                      placeholder="Enter your private key (0x...)"
                      className="font-mono text-xs pr-12"
                      data-testid="input-import-key"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowImportKey(!showImportKey)}
                        data-testid="button-toggle-import-visibility"
                      >
                        {showImportKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    onClick={handleImportWallet}
                    disabled={importWalletMutation.isPending || !importKey.trim()}
                    className="w-full"
                    data-testid="button-import-wallet"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {importWalletMutation.isPending ? "Importing..." : "Import Wallet"}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Generate New Wallet</h4>
                <Alert className="border-amber-500/50 bg-amber-500/5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    <strong>About Your Tipping Wallet:</strong> We'll generate a dedicated wallet just for ClipX tips. 
                    You can export the private key anytime for backup. This keeps your main wallet safe!
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => generateWalletMutation.mutate()}
                  disabled={generateWalletMutation.isPending}
                  size="lg"
                  className="w-full"
                  data-testid="button-generate-wallet"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  {generateWalletMutation.isPending ? "Generating Wallet..." : "Generate Tipping Wallet"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your private key will be encrypted and stored securely
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replace Wallet Card - Only shown when external wallet exists */}
      {hasExternalWallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Replace Wallet
            </CardTitle>
            <CardDescription>
              Import a different wallet using your private key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>Current Wallet:</strong> {dashboardData?.wallet?.address}
                <br />
                <strong>Warning:</strong> Importing a new wallet will replace your current one. Make sure you've backed up your current private key if needed!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  type={showImportKey ? "text" : "password"}
                  placeholder="Enter your private key (0x...)"
                  className="font-mono text-xs pr-12"
                  data-testid="input-import-key"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImportKey(!showImportKey)}
                    data-testid="button-toggle-import-visibility"
                  >
                    {showImportKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleReplaceWalletClick}
                disabled={importWalletMutation.isPending || !importKey.trim()}
                className="w-full"
                variant="destructive"
                data-testid="button-import-wallet"
              >
                <Download className="h-5 w-5 mr-2" />
                {importWalletMutation.isPending ? "Importing..." : "Replace with Imported Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Replace Wallet Confirmation Dialog */}
      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Wallet?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to replace your current wallet:
              </p>
              <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
                {dashboardData?.wallet?.address}
              </code>
              <p className="font-semibold text-destructive">
                ⚠️ This action will permanently replace your current wallet. Make sure you have backed up the current wallet's private key if you need it!
              </p>
              <p>
                Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReplaceWallet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Replace Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Private Key Card - Only shown when external wallet exists */}
      {hasExternalWallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Private Key
            </CardTitle>
            <CardDescription>
              Backup your wallet's private key for recovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> Never share your private key with anyone! Anyone with this key can access your funds.
              </AlertDescription>
            </Alert>

            {!exportedKey ? (
              <Button 
                onClick={() => exportKeyMutation.mutate()}
                disabled={exportKeyMutation.isPending}
                variant="outline"
                className="w-full"
                data-testid="button-export-key"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportKeyMutation.isPending ? "Exporting..." : "Export Private Key"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    value={exportedKey}
                    type={showKey ? "text" : "password"}
                    readOnly
                    className="font-mono text-xs pr-20"
                    data-testid="input-exported-key"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKey(!showKey)}
                      data-testid="button-toggle-key-visibility"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(exportedKey)}
                      data-testid="button-copy-key"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save this in a secure location like a password manager
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Why Use a Tipping Wallet?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Automatic Twitter Tipping</p>
              <p className="text-sm text-muted-foreground">
                Bot processes tips instantly when you mention @clipx0_
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Keep Your Main Wallet Safe</p>
              <p className="text-sm text-muted-foreground">
                Dedicated tipping wallet - only fund it with what you need
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">24/7 Bot Operation</p>
              <p className="text-sm text-muted-foreground">
                Send tips anytime, anywhere via Twitter mentions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
