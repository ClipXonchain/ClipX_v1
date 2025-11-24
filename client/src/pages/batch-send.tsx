import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Send, CheckCircle2, XCircle, Loader2, DollarSign, Info, Zap, Clock, Rocket, Coins, Sparkles, TrendingUp, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

type TokenType = 'BNB' | 'CLIPX' | 'ASTER' | 'USDT' | 'GIGGLE';
type GasTier = 'slow' | 'standard' | 'fast';

const tokenConfig = {
  BNB: { 
    color: "from-yellow-400 to-orange-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    icon: Coins,
    gradient: "bg-gradient-to-br from-yellow-400/20 to-orange-500/20"
  },
  CLIPX: { 
    color: "from-blue-400 to-purple-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: Zap,
    gradient: "bg-gradient-to-br from-blue-400/20 to-purple-500/20"
  },
  ASTER: { 
    color: "from-green-400 to-emerald-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    icon: Sparkles,
    gradient: "bg-gradient-to-br from-green-400/20 to-emerald-500/20"
  },
  USDT: { 
    color: "from-emerald-400 to-teal-500",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-emerald-400/20 to-teal-500/20"
  },
  GIGGLE: { 
    color: "from-pink-400 to-rose-500",
    textColor: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800",
    icon: Sparkles,
    gradient: "bg-gradient-to-br from-pink-400/20 to-rose-500/20"
  }
};

export default function BatchSend() {
  const [recipients, setRecipients] = useState<string>("");
  const [amountPerPerson, setAmountPerPerson] = useState<string>("");
  const [tokenType, setTokenType] = useState<TokenType>("BNB");
  const [gasTier, setGasTier] = useState<GasTier>("standard");
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet"],
  });

  const batchSendMutation = useMutation({
    mutationFn: async (data: { recipients: string[], amountPerPerson: string, tokenType: string, gasTier: string }) => {
      const response = await apiRequest("POST", "/api/batch-send-tips", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Batch Send Complete!",
        description: `Successfully sent to ${data.successCount} of ${data.totalRecipients} recipients`,
      });

      // Clear form on success
      setRecipients("");
      setAmountPerPerson("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Batch Send Failed",
        description: error.message,
      });
    },
  });

  const recipientList = recipients
    .split(/[\n,]/)
    .map(r => r.trim())
    .filter(r => r.length > 0);

  const totalRecipients = recipientList.length;
  const amount = parseFloat(amountPerPerson) || 0;
  const totalAmount = amount * totalRecipients;

  // Estimate gas costs with tier multipliers
  const estimatedGasPerTx = tokenType === 'BNB' ? 21000 : 65000;
  const baseGasPrice = 5; // Approximate gwei
  const gasTierMultipliers = { slow: 0.8, standard: 1.0, fast: 1.2 };
  const gasPrice = baseGasPrice * gasTierMultipliers[gasTier];
  const estimatedGasCostPerTx = (estimatedGasPerTx * gasPrice) / 1e9;
  const totalEstimatedGas = estimatedGasCostPerTx * totalRecipients;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientList.length === 0) {
      toast({
        variant: "destructive",
        title: "No recipients",
        description: "Please enter at least one recipient",
      });
      return;
    }

    if (recipientList.length > 50) {
      toast({
        variant: "destructive",
        title: "Too many recipients",
        description: "Maximum 50 recipients per batch",
      });
      return;
    }

    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    batchSendMutation.mutate({
      recipients: recipientList,
      amountPerPerson: amountPerPerson,
      tokenType: tokenType,
      gasTier: gasTier,
    });
  };

  const TokenIcon = tokenConfig[tokenType].icon;

  return (
    <div className="space-y-6 pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/send-tips">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Group Tipping
          </h1>
          <p className="text-muted-foreground mt-1">
            Send tips to multiple recipients at once
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          <Card className={`border-2 ${tokenConfig[tokenType].borderColor} ${tokenConfig[tokenType].gradient}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TokenIcon className="h-5 w-5" />
                Batch Send Form
              </CardTitle>
              <CardDescription>
                Send the same amount to multiple people
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Recipients */}
                <div className="space-y-2">
                  <Label htmlFor="recipients" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Recipients (Twitter Usernames)
                  </Label>
                  <Textarea
                    id="recipients"
                    placeholder="@alice&#10;@bob&#10;@charlie&#10;or: @alice, @bob, @charlie"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    rows={8}
                    className="font-mono text-sm resize-none"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {totalRecipients} {totalRecipients === 1 ? 'recipient' : 'recipients'}
                    </span>
                    {totalRecipients > 50 && (
                      <span className="text-destructive font-medium">Max 50 recipients</span>
                    )}
                  </div>
                </div>

                {/* Amount per person */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Amount per Person
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="0.1"
                      value={amountPerPerson}
                      onChange={(e) => setAmountPerPerson(e.target.value)}
                      className="text-lg font-semibold pr-16"
                    />
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 font-semibold ${tokenConfig[tokenType].textColor}`}>
                      {tokenType}
                    </div>
                  </div>
                </div>

                {/* Token type */}
                <div className="space-y-2">
                  <Label htmlFor="token" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Token Type
                  </Label>
                  <Select value={tokenType} onValueChange={(value) => setTokenType(value as TokenType)}>
                    <SelectTrigger id="token" className={`${tokenConfig[tokenType].bgColor} border-2 ${tokenConfig[tokenType].borderColor}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tokenConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{key}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

              {/* Gas speed */}
              <div className="space-y-2">
                <Label htmlFor="gas-speed">Gas Speed</Label>
                <Select value={gasTier} onValueChange={(value) => setGasTier(value as GasTier)}>
                  <SelectTrigger id="gas-speed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Slow (20% cheaper)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="standard">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span>Standard</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fast">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        <span>Fast (20% more expensive)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={batchSendMutation.isPending || totalRecipients === 0 || !amount}
              >
                {batchSendMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending to {totalRecipients} {totalRecipients === 1 ? 'person' : 'people'}...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {totalRecipients} {totalRecipients === 1 ? 'Person' : 'People'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className={`border-2 ${tokenConfig[tokenType].borderColor} ${tokenConfig[tokenType].gradient}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className={`h-5 w-5 ${tokenConfig[tokenType].textColor}`} />
                Transaction Summary
              </CardTitle>
              <CardDescription>
                Review before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Recipients:</span>
                <Badge variant="secondary" className="font-bold">
                  {totalRecipients} {totalRecipients === 1 ? 'person' : 'people'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Amount per person:</span>
                <span className={`font-bold ${tokenConfig[tokenType].textColor}`}>
                  {amount.toFixed(6)} {tokenType}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-semibold">Total Amount:</span>
                <span className={`text-2xl font-bold ${tokenConfig[tokenType].textColor}`}>
                  {totalAmount.toFixed(6)} {tokenType}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Estimated Gas ({gasTier}):
                </span>
                <span className="text-sm font-mono">~{totalEstimatedGas.toFixed(6)} BNB</span>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How it works:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Each recipient gets the same amount</li>
                <li>Unregistered users receive tips via escrow</li>
                <li>All transactions are processed sequentially</li>
                <li>A group announcement tweet will be posted</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Wallet Warning */}
          {walletData?.walletType !== 'external' && (
            <Alert variant="destructive">
              <AlertDescription>
                Batch send requires an external wallet. Please create or import an external wallet first.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Batch Send Results
            </CardTitle>
            <CardDescription>
              Sent to {results.successCount} of {results.totalRecipients} recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">{results.totalAmount} {tokenType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gas Cost</p>
                  <p className="text-lg font-bold">{results.totalGasCost} BNB</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-lg font-bold text-green-600">{results.successCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-lg font-bold text-red-600">{results.failCount}</p>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-2">
                <Label>Individual Results</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.results.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">@{result.username}</p>
                          {result.success && result.txHash && (
                            <a 
                              href={`https://bscscan.com/tx/${result.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              View transaction →
                            </a>
                          )}
                          {!result.success && result.error && (
                            <p className="text-xs text-red-500">{result.error}</p>
                          )}
                        </div>
                      </div>
                      {result.isPending && (
                        <Badge variant="outline">Escrow</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
