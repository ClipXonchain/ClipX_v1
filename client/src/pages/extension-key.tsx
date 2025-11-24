import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Eye, EyeOff, ArrowLeft, Key, Chrome, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface ExtensionKey {
    token: string;
    expiresAt: string;
}

export default function ExtensionKey() {
    const { toast } = useToast();
    const [extensionKey, setExtensionKey] = useState<ExtensionKey | null>(null);
    const [showKey, setShowKey] = useState(false);

    const generateKeyMutation = useMutation<ExtensionKey, Error, void>({
        mutationFn: async (): Promise<ExtensionKey> => {
            const res = await apiRequest("POST", "/api/extension/generate-token", {});
            const data = await res.json();
            return {
                token: data.token,
                expiresAt: data.expiresAt
            };
        },
        onSuccess: (data: ExtensionKey) => {
            setExtensionKey(data);
            setShowKey(true);
            toast({
                title: "Extension Key Generated",
                description: "Your key is valid for 24 hours",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Unable to generate extension key",
                variant: "destructive",
            });
        },
    });

    const handleGenerate = () => {
        generateKeyMutation.mutate();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Extension key copied to clipboard",
        });
    };

    const formatExpiryTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    const isExpired = (isoString: string) => {
        return new Date(isoString) < new Date();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-semibold mb-2">Chrome Extension Authentication</h1>
                <p className="text-muted-foreground">
                    Generate a secure key to login to the ClipX Chrome Extension
                </p>
            </div>

            {/* Info Alert */}
            <Alert className="border-primary/50 bg-primary/5">
                <Chrome className="h-5 w-5 text-primary" />
                <AlertTitle className="text-lg font-semibold">How it works</AlertTitle>
                <AlertDescription className="space-y-3 mt-2">
                    <p className="font-medium">
                        Use this key to authenticate the ClipX Chrome Extension without needing to login repeatedly.
                    </p>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-primary font-bold text-xs">1</span>
                            </div>
                            <p>Generate a new extension key below</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-primary font-bold text-xs">2</span>
                            </div>
                            <p>Copy the generated key</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-primary font-bold text-xs">3</span>
                            </div>
                            <p>Open the ClipX extension and paste the key in the login field</p>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>

            <div className="max-w-2xl space-y-6">
                {/* Generate Key Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Extension Authentication Key
                        </CardTitle>
                        <CardDescription>
                            Generate a temporary key that expires in 24 hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!extensionKey ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Click the button below to generate a new extension authentication key.
                                </p>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generateKeyMutation.isPending}
                                    data-testid="button-generate-key"
                                    className="w-full sm:w-auto"
                                >
                                    <Key className="h-4 w-4 mr-2" />
                                    {generateKeyMutation.isPending ? "Generating..." : "Generate New Key"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Key Display */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Your Extension Key</label>
                                    <div className="relative">
                                        <code
                                            className={`block px-3 py-3 bg-muted rounded-lg text-sm font-mono break-all ${showKey ? '' : 'blur-sm select-none'
                                                }`}
                                            data-testid="text-extension-key"
                                        >
                                            {extensionKey.token}
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

                                {/* Expiry Info */}
                                <div className={`text-sm ${isExpired(extensionKey.expiresAt) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {isExpired(extensionKey.expiresAt) ? (
                                        <>⚠️ Expired on {formatExpiryTime(extensionKey.expiresAt)}</>
                                    ) : (
                                        <>🕐 Expires on {formatExpiryTime(extensionKey.expiresAt)}</>
                                    )}
                                </div>

                                {/* Actions */}
                                {showKey && (
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => copyToClipboard(extensionKey.token)}
                                            data-testid="button-copy-key"
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Key
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

                                {/* Generate New Key Button */}
                                <div className="pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={handleGenerate}
                                        disabled={generateKeyMutation.isPending}
                                        data-testid="button-regenerate-key"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        {generateKeyMutation.isPending ? "Generating..." : "Generate New Key"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Note: Generating a new key will invalidate the previous one
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Security Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security Information</CardTitle>
                        <CardDescription>
                            Important details about your extension key
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold mb-2">🔒 Keep Your Key Secure</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Never share your extension key with anyone</li>
                                <li>Don't post it publicly or send it in messages</li>
                                <li>Anyone with this key can access your ClipX account through the extension</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">⏰ Key Expiration</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Each key is valid for 24 hours from generation</li>
                                <li>After expiration, you'll need to generate a new key</li>
                                <li>You can generate a new key at any time</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">🔄 Key Management</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Only one key is active at a time per account</li>
                                <li>Generating a new key immediately invalidates the old one</li>
                                <li>If compromised, generate a new key to revoke access</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
