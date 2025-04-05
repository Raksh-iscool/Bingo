'use client'
import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import { BarChart2, PenSquare, Sparkles, Target, Zap } from "lucide-react"

export function CarouselPlugin() {
    const plugin = React.useRef(
        Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
    )

    const features = [
        {
            icon: <BarChart2 className="h-16 w-16 text-primary" />,
            title: "Smart Analytics",
            description: "Real-time insights and performance tracking"
        },
        {
            icon: <PenSquare className="h-16 w-16 text-primary" />,
            title: "AI Writing",
            description: "Create engaging content in seconds"
        },
        {
            icon: <Target className="h-16 w-16 text-primary" />,
            title: "Audience Focus",
            description: "Target the right readers effectively"
        },
        {
            icon: <Sparkles className="h-16 w-16 text-primary" />,
            title: "Smart Optimization",
            description: "AI-powered content enhancement"
        },
        {
            icon: <Zap className="h-16 w-16 text-primary" />,
            title: "Quick Automation",
            description: "Streamline your content workflow"
        }
    ]

    return (
        <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
        >
            <CarouselContent>
                {features.map((feature, index) => (
                    <CarouselItem key={index}>
                        <div className="h-full w-full flex items-center justify-center p-6">
                            <Card className="bg-gradient-to-br from-background/50 to-primary/5 border-primary/10 hover:border-primary/20 transition-colors">
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="p-4 rounded-full bg-primary/10 backdrop-blur-sm transform hover:scale-105 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                                            {feature.title}
                                        </h3>
                                        <p className="text-lg text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    )
}