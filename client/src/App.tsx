import { Switch, Route, Redirect } from "wouter";
import { queryClient, setAuthTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import type { User } from "@shared/schema";
import clipxLogo from "@assets/ClipX Logo with Neon Blue X and Newspaper Icon_1763034906334.png";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Claims from "@/pages/claims";
import Deposit from "@/pages/deposit";
import ExportKey from "@/pages/export-key";
import ExtensionKey from "@/pages/extension-key";
import Transactions from "@/pages/transactions";
import SendTips from "@/pages/send-tips";
import BatchSend from "@/pages/batch-send";
import LinkWallet from "@/pages/link-wallet";
import NotFound from "@/pages/not-found";
import { ExtensionAuthBridge } from "@/components/extension-auth-bridge";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsConditions from "@/pages/terms-conditions";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, user: privyUser } = usePrivy();
  const { data: dbUser, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: ready && authenticated,
  });

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    window.location.href = "/";
  };

  if (!ready || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && authenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="mb-4 text-destructive">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to verify your authentication. The server may not be properly configured.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!authenticated || !dbUser) {
    return <Redirect to="/" />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={dbUser} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <img src={clipxLogo} alt="ClipX" className="h-8 w-8" />
              <h2 className="text-lg font-semibold">ClipX</h2>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function AuthTokenSetter() {
  const { getAccessToken, ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready) {
      setAuthTokenGetter(getAccessToken);
    }
  }, [getAccessToken, ready, authenticated]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicRoute>
          <Landing />
        </PublicRoute>
      </Route>
      <Route path="/privacy">
        <PrivacyPolicy />
      </Route>
      <Route path="/terms">
        <TermsConditions />
      </Route>
      <Route path="/dashboard">
        <AuthenticatedLayout>
          <Dashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/claims">
        <AuthenticatedLayout>
          <Claims />
        </AuthenticatedLayout>
      </Route>
      <Route path="/deposit">
        <AuthenticatedLayout>
          <Deposit />
        </AuthenticatedLayout>
      </Route>
      <Route path="/export-key">
        <AuthenticatedLayout>
          <ExportKey />
        </AuthenticatedLayout>
      </Route>
      <Route path="/extension-key">
        <AuthenticatedLayout>
          <ExtensionKey />
        </AuthenticatedLayout>
      </Route>
      <Route path="/transactions">
        <AuthenticatedLayout>
          <Transactions />
        </AuthenticatedLayout>
      </Route>
      <Route path="/send-tips">
        <AuthenticatedLayout>
          <SendTips />
        </AuthenticatedLayout>
      </Route>
      <Route path="/batch-send">
        <AuthenticatedLayout>
          <BatchSend />
        </AuthenticatedLayout>
      </Route>
      <Route path="/link-wallet">
        <AuthenticatedLayout>
          <LinkWallet />
        </AuthenticatedLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWithPrivy() {
  const [privyAppId, setPrivyAppId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config/privy")
      .then((res) => res.json())
      .then((data) => {
        setPrivyAppId(data.appId);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch Privy config:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!privyAppId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p>Failed to load Privy configuration</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["twitter", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#3B82F6",
          logo: undefined,
        },
        embeddedWallets: {
          showWalletUIs: true,
        },
        supportedChains: [
          {
            id: 56, // BSC Mainnet
            name: "BNB Smart Chain",
            network: "bsc",
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://bsc-dataseed1.binance.org"],
              },
            },
            blockExplorers: {
              default: {
                name: "BscScan",
                url: "https://bscscan.com",
              },
            },
          },
        ],
      }}
    >
      <ExtensionAuthBridge />
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthTokenSetter />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </PrivyProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithPrivy />
    </QueryClientProvider>
  );
}

export default App;
