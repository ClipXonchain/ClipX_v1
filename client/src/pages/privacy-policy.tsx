import { Button } from "@/components/ui/button";
import { SiX } from "react-icons/si";
import clipxLogo from "@assets/ClipX Logo with Neon Blue X and Newspaper Icon_1763034906334.png";
import { Link } from "wouter";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <div className="flex items-center gap-3 cursor-pointer">
                                <img src={clipxLogo} alt="ClipX" className="h-10 w-10" />
                                <span className="text-xl font-semibold">ClipX</span>
                            </div>
                        </Link>
                        <Button variant="ghost" asChild>
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none space-y-6">
                    <p className="text-muted-foreground">Last updated: November 22, 2025</p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p>
                            ClipX ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website clipx.app and use our browser extension.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                        <p>We collect information that you provide directly to us when you:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Connect your Twitter/X account via Privy</li>
                            <li>Connect your crypto wallet</li>
                            <li>Send or receive tips</li>
                            <li>Contact our support team</li>
                        </ul>
                        <p className="mt-4">
                            <strong>Blockchain Data:</strong> Please note that all transactions on the blockchain are public. Your wallet address and transaction history are visible on the public ledger.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Facilitate cryptocurrency transactions</li>
                            <li>Verify your identity and prevent fraud</li>
                            <li>Provide customer support</li>
                            <li>Send you technical notices and updates</li>
                            <li>Improve our services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal information. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
                        <p>
                            We use third-party services like Privy for authentication and wallet management. Their use of your information is governed by their respective privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us via our official Twitter account @ClipX0_.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="border-t py-8 mt-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground text-sm">
                    © 2025 ClipX. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
