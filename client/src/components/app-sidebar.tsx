import { Home, ArrowDownToLine, Key, Receipt, LogOut, Send, Wallet, Twitter, Gift, Users, Chrome } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User } from "@shared/schema";

interface AppSidebarProps {
  user?: User;
  onLogout?: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Pending Claims",
    url: "/claims",
    icon: Gift,
  },
  {
    title: "Deposit",
    url: "/deposit",
    icon: ArrowDownToLine,
  },
  {
    title: "External Wallet",
    url: "/link-wallet",
    icon: Wallet,
  },
  {
    title: "Send Tips",
    url: "/send-tips",
    icon: Send,
  },
  {
    title: "Batch Send",
    url: "/batch-send",
    icon: Users,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
  },
  {
    title: "Export Key",
    url: "/export-key",
    icon: Key,
  },
  {
    title: "Extension Key",
    url: "/extension-key",
    icon: Chrome,
  },
];

function getUserDisplayName(user: User): string {
  // Prefer Twitter display name, fallback to user name
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email || "User";
}

function getUserSubtext(user: User): string {
  // Show Twitter username if available, otherwise show email
  if (user.username) return `@${user.username}`;
  return user.email || "";
}

function getUserInitial(user: User): string {
  const displayName = getUserDisplayName(user);
  return displayName[0]?.toUpperCase() || "U";
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold">ClipX</h2>
        </div>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.profileImageUrl || user.avatarUrl || undefined}
                  alt={getUserDisplayName(user)}
                />
                <AvatarFallback>{getUserInitial(user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getUserDisplayName(user)}</p>
                <p className="text-xs text-muted-foreground truncate">{getUserSubtext(user)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>

            <div className="mt-2 flex items-center justify-center">
              <a
                href="https://x.com/ClipX0_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                aria-label="Follow ClipX on X (Twitter)"
              >
                <Twitter className="h-4 w-4" />
                <span>Follow @ClipX0_</span>
              </a>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
