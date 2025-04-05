'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart2, PenSquare } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background/80">
            <div className="container px-4 py-16 md:py-24 relative">
                {/* Profile Avatar */}
                <div className="absolute top-4 right-4">
                    <Link href="/userprofile">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition">
                            <img
                                src="/path-to-avatar.jpg" // Replace with the actual path to the avatar image
                                alt="User Avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </Link>
                </div>

                <div className="text-center mb-20">
                    <div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
                        AI-Powered Content Platform
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                        Transform Your Content Strategy
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Create and analyze content with powerful AI-driven tools
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <Link href="/youtube/analytics" className="group">
                        <div className="p-8 rounded-2xl border-2 border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
                            <div className="bg-primary/10 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform">
                                <BarChart2 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">Advanced Analytics</h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                Track performance metrics, analyze engagement rates, and gain valuable insights into your content&apos;s impact with our comprehensive analytics dashboard.
                            </p>
                            <div className="text-primary font-medium group-hover:translate-x-2 transition-transform">
                                View Analytics →
                            </div>
                        </div>
                    </Link>

                    <Link href="/createnew" className="group">
                        <div className="p-8 rounded-2xl border-2 border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
                            <div className="bg-primary/10 rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform">
                                <PenSquare className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">Content Creation</h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                Generate engaging content with our AI-powered writing assistant. Create, edit, and optimize your content with intelligent suggestions and automated improvements.
                            </p>
                            <div className="text-primary font-medium group-hover:translate-x-2 transition-transform">
                                Create Content →
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}