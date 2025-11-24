import { Button } from "@/components/ui/button";
import clipxLogo from "@assets/ClipX Logo with Neon Blue X and Newspaper Icon_1763034906334.png";
import { Link } from "wouter";

export default function TermsConditions() {
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
                <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
                <div className="prose dark:prose-invert max-w-none space-y-6">
                    <p className="text-muted-foreground">Last updated: November 22, 2025</p>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using ClipX ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                        <p>
                            ClipX provides a browser extension and web platform that facilitates cryptocurrency tipping on social media platforms. We do not take custody of your funds; all transactions occur directly on the blockchain.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>You are responsible for maintaining the security of your wallet and private keys.</li>
                            <li>You agree not to use the Service for any illegal or unauthorized purpose.</li>
                            <li>You must comply with all applicable laws and regulations in your jurisdiction.</li>
                            <li>You acknowledge that cryptocurrency transactions are irreversible.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Risks</h2>
                        <p>
                            You acknowledge that using cryptocurrency involves significant risks, including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Market volatility</li>
                            <li>Technical failures</li>
                            <li>Regulatory uncertainty</li>
                        </ul>
                        <p className="mt-2">
                            ClipX is not responsible for any losses you may incur while using the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
                        <p>
                            The Service and its original content, features, and functionality are owned by ClipX and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
                        <p>
                            We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
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
