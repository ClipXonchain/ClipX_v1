import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Info, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import type { Wallet } from "@shared/schema";

export default function Deposit() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: wallet, isLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
    // Poll wallet address/balance periodically in case deposit completes while user is on this page
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (wallet?.address && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, wallet.address, {
        width: 200,
        margin: 2,
      });
    }
  }, [wallet?.address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load wallet information</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4" data-testid="button-back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Deposit BNB</h1>
        <p className="text-muted-foreground">
          Send BNB to your wallet address to start tipping
        </p>
      </div>

      {/* Deposit Instructions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Wallet Address</CardTitle>
            <CardDescription>Send BNB (BSC) to this address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <canvas ref={canvasRef} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono break-all" data-testid="text-deposit-address">
                  {wallet.address}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(wallet.address)}
                  data-testid="button-copy-deposit-address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium mb-1">Copy your wallet address</p>
                    <p className="text-sm text-muted-foreground">
                      Click the copy button or scan the QR code
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium mb-1">Send BNB from your wallet</p>
                    <p className="text-sm text-muted-foreground">
                      Use MetaMask, Trust Wallet, or any BSC-compatible wallet
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium mb-1">Wait for confirmation</p>
                    <p className="text-sm text-muted-foreground">
                      Your balance will update after 1-2 minutes
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium mb-1">Start tipping!</p>
                    <p className="text-sm text-muted-foreground">
                      Mention @clipx0_ on Twitter to send tips
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-sm space-y-2">
              <p>• Only send BNB on Binance Smart Chain (BSC)</p>
              <p>• DO NOT send BNB on Binance Beacon Chain or other networks</p>
              <p>• Small amounts are recommended for testing</p>
              <p>• Transactions are irreversible</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
