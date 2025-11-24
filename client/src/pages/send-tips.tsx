import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Send, Loader2, Sparkles, Zap, Coins, TrendingUp, Shield, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Wallet } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SendTipResponse {
  success: boolean;
  txHash?: string;
  message?: string;
  isPending?: boolean;
  tweetUrl?: string;
}

type TokenType = "BNB" | "CLIPX" | "ASTER" | "USDT" | "GIGGLE";

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

const quickAmounts = [0.01, 0.1, 0.5, 1.0];

export default function SendTips() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState<TokenType>("BNB");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: dashboardData } = useQuery<{
    balance: string;
    clipxBalance: string;
    asterBalance: string;
    usdtBalance: string;
    giggleBalance: string;
    estimatedGasCost: string;
    estimatedTokenGasCost: string;
  }>({
    queryKey: ["/api/dashboard"],
  });

  const sendTipMutation = useMutation({
    mutationFn: async (data: { username: string; amount: string; tokenType: TokenType; isPrivate: boolean }) => {
      const response = await apiRequest("POST", "/api/send-tip", data);
      return response.json() as Promise<SendTipResponse>;
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      toast({
        title: "Tip Sent! 🎉",
        description: data.isPending 
          ? `Tip sent to escrow for @${username}. They have 3 days to claim it.`
          : `Successfully sent ${amount} ${tokenType} to @${username}`,
      });
      setUsername("");
      setAmount("");
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to Send Tip",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a Twitter username",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const balance = tokenType === "BNB" 
      ? parseFloat(dashboardData?.balance || "0")
      : tokenType === "CLIPX"
      ? parseFloat(dashboardData?.clipxBalance || "0")
      : tokenType === "ASTER"
      ? parseFloat(dashboardData?.asterBalance || "0")
      : tokenType === "USDT"
      ? parseFloat(dashboardData?.usdtBalance || "0")
      : parseFloat(dashboardData?.giggleBalance || "0");
    const gasCost = tokenType === "BNB"
      ? parseFloat(dashboardData?.estimatedGasCost || "0.001")
      : parseFloat(dashboardData?.estimatedTokenGasCost || "0.002");
    
    if (tokenType === "BNB" && parsedAmount + gasCost > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${(parsedAmount + gasCost).toFixed(6)} BNB (including gas)`,
        variant: "destructive",
      });
      return;
    }

    if (tokenType === "CLIPX") {
      const bnbBalance = parseFloat(dashboardData?.balance || "0");
      if (parsedAmount > balance) {
        toast({
          title: "Insufficient ClipX Balance",
          description: `You need at least ${parsedAmount.toFixed(6)} ClipX`,
          variant: "destructive",
        });
        return;
      }
      if (gasCost > bnbBalance) {
        toast({
          title: "Insufficient BNB for Gas",
          description: `You need at least ${gasCost.toFixed(6)} BNB for gas fees`,
          variant: "destructive",
        });
        return;
      }
    }

    if (tokenType === "ASTER") {
      const bnbBalance = parseFloat(dashboardData?.balance || "0");
      if (parsedAmount > balance) {
        toast({
          title: "Insufficient Aster Balance",
          description: `You need at least ${parsedAmount.toFixed(6)} Aster`,
          variant: "destructive",
        });
        return;
      }
      if (gasCost > bnbBalance) {
        toast({
          title: "Insufficient BNB for Gas",
          description: `You need at least ${gasCost.toFixed(6)} BNB for gas fees`,
          variant: "destructive",
        });
        return;
      }
    }

    if (tokenType === "USDT") {
      const bnbBalance = parseFloat(dashboardData?.balance || "0");
      if (parsedAmount > balance) {
        toast({
          title: "Insufficient USDT Balance",
          description: `You need at least ${parsedAmount.toFixed(6)} USDT`,
          variant: "destructive",
        });
        return;
      }
      if (gasCost > bnbBalance) {
        toast({
          title: "Insufficient BNB for Gas",
          description: `You need at least ${gasCost.toFixed(6)} BNB for gas fees`,
          variant: "destructive",
        });
        return;
      }
    }

    if (tokenType === "GIGGLE") {
      const bnbBalance = parseFloat(dashboardData?.balance || "0");
      if (parsedAmount > balance) {
        toast({
          title: "Insufficient Giggle Balance",
          description: `You need at least ${parsedAmount.toFixed(6)} Giggle`,
          variant: "destructive",
        });
        return;
      }
      if (gasCost > bnbBalance) {
        toast({
          title: "Insufficient BNB for Gas",
          description: `You need at least ${gasCost.toFixed(6)} BNB for gas fees`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    sendTipMutation.mutate({ 
      username: username.replace('@', ''),
      amount: amount,
      tokenType: tokenType,
      isPrivate: isPrivate
    });
  };

  const cleanedUsername = username.replace('@', '');
  const currentBalance = tokenType === "BNB" 
    ? parseFloat(dashboardData?.balance || "0")
    : tokenType === "CLIPX"
    ? parseFloat(dashboardData?.clipxBalance || "0")
    : tokenType === "ASTER"
    ? parseFloat(dashboardData?.asterBalance || "0")
    : tokenType === "USDT"
    ? parseFloat(dashboardData?.usdtBalance || "0")
    : parseFloat(dashboardData?.giggleBalance || "0");

  const TokenIcon = tokenConfig[tokenType].icon;

  return (
    <div className="min-h-screen space-y-8 px-4 sm:px-6 lg:px-0 pb-12">
      {/* Header with gradient */}
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${tokenConfig[tokenType].color} opacity-10 blur-3xl -z-10 rounded-3xl`}></div>
        <Button variant="ghost" size="sm" asChild className="mb-4" data-testid="button-back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${tokenConfig[tokenType].color}`}>
            <Send className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Send Tips
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg">
          Reward creators instantly with BNB, ClipX, Aster, USDT, or Giggle tokens
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Main Form - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className={`${tokenConfig[tokenType].gradient} border-b`}>
              <div className="flex items-center gap-3">
                <TokenIcon className={`h-6 w-6 ${tokenConfig[tokenType].textColor}`} />
                <div>
                  <CardTitle className="text-2xl">Send a Tip</CardTitle>
                  <CardDescription className="text-base">
                    Quick and easy crypto tipping on Twitter
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Token Selection with Visual Cards */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Token</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {(["BNB", "CLIPX", "ASTER", "USDT", "GIGGLE"] as TokenType[]).map((token) => {
                      const config = tokenConfig[token];
                      const Icon = config.icon;
                      const isSelected = tokenType === token;
                      return (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setTokenType(token)}
                          disabled={isSubmitting}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all duration-200
                            ${isSelected 
                              ? `${config.borderColor} ${config.bgColor} shadow-md scale-105` 
                              : 'border-border hover:border-muted-foreground/50 hover:scale-102'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Icon className={`h-6 w-6 ${isSelected ? config.textColor : 'text-muted-foreground'}`} />
                            <span className={`font-semibold ${isSelected ? config.textColor : 'text-muted-foreground'}`}>
                              {token}
                            </span>
                          </div>
                          {isSelected && (
                            <div className={`absolute top-1 right-1 h-3 w-3 rounded-full bg-gradient-to-br ${config.color}`}></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {dashboardData && (
                    <div className={`p-3 rounded-lg ${tokenConfig[tokenType].bgColor} border ${tokenConfig[tokenType].borderColor}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Available Balance</span>
                        <span className={`text-lg font-bold ${tokenConfig[tokenType].textColor}`}>
                          {currentBalance.toFixed(6)} {tokenType}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Username Input */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base font-semibold">Twitter Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">@</span>
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isSubmitting}
                      className="pl-8 h-12 text-lg border-2"
                      data-testid="input-username"
                    />
                  </div>
                  {cleanedUsername && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Sending to: <span className="font-semibold">@{cleanedUsername}</span>
                    </p>
                  )}
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-base font-semibold">
                    Amount ({tokenType})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting}
                    className="h-14 text-xl font-semibold border-2"
                    data-testid="input-amount"
                  />
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {quickAmounts.map((quickAmt) => (
                      <Button
                        key={quickAmt}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(quickAmt.toString())}
                        disabled={isSubmitting}
                        className="flex-1 hover:scale-105 transition-transform"
                      >
                        {quickAmt} {tokenType}
                      </Button>
                    ))}
                  </div>

                  {dashboardData && amount && (
                    <Alert className={`${tokenConfig[tokenType].bgColor} border ${tokenConfig[tokenType].borderColor}`}>
                      <Zap className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <div className="flex justify-between items-center">
                          <span>Gas fee:</span>
                          <span className="font-semibold">
                            ~{tokenType === "BNB" 
                              ? dashboardData.estimatedGasCost 
                              : dashboardData.estimatedTokenGasCost} BNB
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Private Mode Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed hover:border-solid transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {isPrivate ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <Label htmlFor="private-mode" className="text-base font-semibold cursor-pointer">
                          Private Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {isPrivate 
                            ? "No Twitter announcement will be posted" 
                            : "Tip will be announced on Twitter by @clipx0_"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="private-mode"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                      disabled={isSubmitting}
                    />
                  </div>
                  {isPrivate && (
                    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                        Private tip: Only you and the recipient will see this transaction in your history.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className={`w-full h-14 text-lg font-semibold bg-gradient-to-r ${tokenConfig[tokenType].color} hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105`}
                  disabled={isSubmitting || !wallet}
                  data-testid="button-send-tip"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending Tip...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Tip Now
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* How It Works */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Choose Token</p>
                    <p className="text-xs text-muted-foreground">
                      Pick BNB, ClipX, or Aaster
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Enter Details</p>
                    <p className="text-xs text-muted-foreground">
                      Username and amount
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Public Announcement</p>
                    <p className="text-xs text-muted-foreground">
                      Posted on Twitter by @clipx0_
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Instant Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      Direct transfer or 3-day escrow
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="border-2 bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure on BSC</p>
                  <p className="text-xs text-muted-foreground">All transactions on Binance Smart Chain</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">3-Day Claim Window</p>
                  <p className="text-xs text-muted-foreground">Unregistered users can claim within 3 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Public Announcements</p>
                  <p className="text-xs text-muted-foreground">Tips announced on Twitter</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Low Gas Fees</p>
                  <p className="text-xs text-muted-foreground">Minimal transaction costs on BSC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
