import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle, Clock, XCircle, ArrowUpRight, ArrowDownLeft, ArrowLeft, Search, EyeOff, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import type { User, Transaction } from "@shared/schema";

interface TransactionWithUsers extends Transaction {
  fromUser: User;
  toUser: User;
}

interface TransactionsData {
  user: User;
  transactions: TransactionWithUsers[];
}

export default function Transactions() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading } = useQuery<TransactionsData>({
    queryKey: ["/api/transactions"],
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

  const filteredTransactions = data?.transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.fromUser.username?.toLowerCase().includes(query) ||
      tx.toUser.username?.toLowerCase().includes(query) ||
      tx.txHash?.toLowerCase().includes(query) ||
      tx.amount.toString().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load transactions</p>
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
        <h1 className="text-3xl font-semibold mb-2">All Transactions</h1>
        <p className="text-muted-foreground">
          Complete history of your tips sent and received
        </p>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {data.transactions.length} total transaction{data.transactions.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-transactions"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No transactions found matching your search" : "No transactions yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Send your first tip on Twitter to get started
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isSent = tx.fromUserId === data.user.id;
                const otherUser = isSent ? tx.toUser : tx.fromUser;
                
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border hover-elevate"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      isSent ? 'bg-orange-100 dark:bg-orange-950' : 'bg-green-100 dark:bg-green-950'
                    }`}>
                      {isSent ? (
                        <ArrowUpRight className="h-5 w-5 text-orange-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {isSent ? 'Sent to' : 'Received from'} @{otherUser.username}
                        </p>
                        <Badge variant={getStatusBadgeVariant(tx.status)} className="text-xs">
                          {getStatusIcon(tx.status)}
                          <span className="ml-1 capitalize">{tx.status}</span>
                        </Badge>
                        {tx.isPrivate && (
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            <EyeOff className="h-3 w-3 mr-1" />
                            <span>Private</span>
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                        {tx.txHash && (
                          <>
                            <span>•</span>
                            <code className="font-mono">{truncateAddress(tx.txHash)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => copyToClipboard(tx.txHash!, "Transaction hash")}
                              data-testid={`button-copy-tx-${tx.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {tx.status === 'failed' && tx.errorMessage && (
                        <div className="flex items-center gap-2 text-xs text-destructive" data-testid={`error-message-${tx.id}`}>
                          <XCircle className="h-3 w-3" />
                          <span>{tx.errorMessage}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right sm:text-right space-y-1">
                      <p className={`text-sm font-semibold ${
                        isSent ? 'text-orange-600' : 'text-green-600'
                      }`} data-testid={`text-amount-${tx.id}`}>
                        {isSent ? '-' : '+'}{tx.amount} {tx.currency || 'BNB'}
                      </p>
                      {tx.status === 'completed' && tx.gasUsed && tx.gasPriceUsed && (
                        <div className="text-xs text-muted-foreground">
                          <div>Gas: {(parseInt(tx.gasUsed) * parseInt(tx.gasPriceUsed) / 1e18).toFixed(6)} BNB</div>
                          {tx.currency === 'BNB' && (
                            <div className="font-mono">Total: {(parseFloat(tx.amount) + (parseInt(tx.gasUsed) * parseInt(tx.gasPriceUsed) / 1e18)).toFixed(6)} BNB</div>
                          )}
                        </div>
                      )}
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
