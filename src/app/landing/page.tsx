"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

// Predefined positions and animations to avoid hydration mismatch
const FLOATING_DOTS = [
    { width: 12.61, height: 12.94, left: 12.39, top: 44.99, duration: 13.98, delay: 1.14 },
    { width: 14.50, height: 8.53, left: 47.80, top: 0.84, duration: 17.34, delay: 4.15 },
    { width: 13.88, height: 5.22, left: 43.95, top: 90.70, duration: 19.70, delay: 4.13 },
    { width: 14.44, height: 10.01, left: 2.47, top: 54.27, duration: 13.44, delay: 2.64 },
    { width: 7.18, height: 7.88, left: 52.24, top: 18.31, duration: 14.38, delay: 1.09 },
    { width: 8.92, height: 13.76, left: 21.87, top: 81.61, duration: 10.33, delay: 1.02 },
    { width: 7.47, height: 5.30, left: 50.18, top: 72.38, duration: 17.60, delay: 2.21 },
    { width: 10.19, height: 10.52, left: 32.60, top: 15.88, duration: 15.39, delay: 0.50 },
    { width: 14.85, height: 6.16, left: 68.87, top: 32.70, duration: 12.35, delay: 2.69 },
    { width: 12.65, height: 10.50, left: 15.85, top: 65.29, duration: 11.37, delay: 0.92 },
];

// Image URLs defined outside component to avoid recreating on every render
const IMAGE_URLS = [
    "https://img.icons8.com/?size=100&id=32323&format=png&color=FFFFFF",
    "https://img.icons8.com/?size=100&id=13963&format=png&color=FFFFFF",
    "https://img.icons8.com/?size=100&id=19318&format=png&color=FFFFFF",
    "https://img.icons8.com/?size=100&id=118497&format=png&color=FFFFFF",
    "https://img.icons8.com/?size=100&id=13930&format=png&color=FFFFFF",
    "https://img.icons8.com/?size=100&id=13642&format=png&color=000000",
    "https://img.icons8.com/?size=100&id=63676&format=png&color=000000",
];

const Landing = () => {
    const [images, setImages] = useState<Array<{ x: number; y: number; src: string; visible: boolean; rotation: number }>>([]);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const router = useRouter();

    const { 
        data: session
    } = authClient.useSession() 

    // Memoize the getImageDimensions function to prevent recreating on every render
    const getImageDimensions = useCallback(() => {
        if (typeof window === "undefined") return { width: 0, height: 0 };

        const baseSize = Math.min(windowSize.width, windowSize.height) * 0.1;
        const width = baseSize;
        const height = width * 0.8;
        return { width, height };
    }, [windowSize.width, windowSize.height]);

    // Handle window resize
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        // Initial size
        handleResize();

        // Setup event listener
        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Initialize images when window size changes
    useEffect(() => {
        if (typeof window === "undefined" || !windowSize.width || !windowSize.height) return;

        const { width, height } = getImageDimensions();
        const initialImages = IMAGE_URLS.map((src) => ({
            x: Math.floor(Math.random() * (windowSize.width - width)),
            y: Math.floor(Math.random() * (windowSize.height - height)),
            src,
            visible: false,
            rotation: Math.random() * 60 - 30,
        }));

        setImages(initialImages);
    }, [windowSize.width, windowSize.height, getImageDimensions]);

    // Animation effect - only run when images array length changes
    useEffect(() => {
        if (typeof window === "undefined" || images.length === 0) return;

        let currentIndex = 0;
        const interval = setInterval(() => {
            setImages((prevImages) => {
                // Prevent manipulation if no images
                if (prevImages.length === 0) return prevImages;

                // Create a new array to avoid direct mutations
                const newImages = [...prevImages];
                const visibleImages = newImages.filter((img) => img.visible);

                // Handle removing oldest visible if we have too many
                if (visibleImages.length > 10 && visibleImages[0]) {
                    const oldestIndex = newImages.findIndex((img) => img === visibleImages[0]);
                    if (oldestIndex !== -1) {
                        newImages[oldestIndex] = {
                            ...newImages[oldestIndex],
                            visible: false,
                            x: newImages[oldestIndex]?.x ?? 0,
                            y: newImages[oldestIndex]?.y ?? 0,
                            src: newImages[oldestIndex]?.src ?? "",
                            rotation: newImages[oldestIndex]?.rotation ?? 0,
                        };
                    }
                }

                // Make sure we don't access out of bounds
                if (currentIndex < newImages.length) {
                    const { width, height } = getImageDimensions();

                    // Create a new object instead of mutating
                    newImages[currentIndex] = {
                        ...newImages[currentIndex],
                        visible: true,
                        rotation: Math.random() * 60 - 30,
                        x: Math.max(
                            0,
                            Math.min(
                                windowSize.width - width,
                                (newImages[currentIndex]?.x ?? 0) + (Math.random() * 40 - 20)
                            )
                        ),
                        y: Math.max(
                            0,
                            Math.min(
                                windowSize.height - height,
                                (newImages[currentIndex]?.y ?? 0) + (Math.random() * 40 - 20)
                            )
                        ),
                        src: newImages[currentIndex]?.src ?? "", // Ensure src is always a string
                    };
                }

                currentIndex = (currentIndex + 1) % newImages.length;
                return newImages;
            });
        }, 800);

        return () => clearInterval(interval);
    }, [images.length, windowSize.width, windowSize.height, getImageDimensions]);

    // Get dimensions for rendering
    const { width, height } = getImageDimensions();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
            {/* Background dots */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    {FLOATING_DOTS.map((dot, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: `${dot.width}px`,
                                height: `${dot.height}px`,
                                left: `${dot.left}%`,
                                top: `${dot.top}%`,
                                animation: `float ${dot.duration}s linear infinite`,
                                animationDelay: `${dot.delay}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <h1 className="text-8xl md:text-9xl font-extrabold text-white tracking-tighter">
                    Bingo
                </h1>
                <p className="text-2xl md:text-3xl font-medium text-white/90 mt-6 tracking-wide max-w-2xl px-4">
                    Schedule <span className="font-bold text-purple-300">and</span> automate your content
                </p>
                <button
                    onClick={() => session?.user?.id ? router.push("/createnew") : router.push("/login")}
                    className="mt-12 px-8 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-lg font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20"
                >
                    Get Started
                </button>
            </div>

            {/* Floating images */}
            {typeof window !== "undefined" &&
                images.map((img, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            left: `${img.x}px`,
                            top: `${img.y}px`,
                            opacity: img.visible ? 0.7 : 0,
                            transform: `rotate(${img.rotation}deg)`,
                            transition:
                                "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                            filter: "drop-shadow(0 4px 12px rgba(255, 255, 255, 0.1))",
                            zIndex: 5,
                            pointerEvents: "none",
                        }}
                    >
                        <Image
                            src={img.src}
                            alt="Decorative icon"
                            width={width}
                            height={height}
                            className="hover:scale-110 transition-transform duration-300"
                        />
                    </div>
                ))}

            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-600/30 blur-3xl pointer-events-none"></div>

            {/* Global styles */}
            <style jsx global>{`
                @keyframes float {
                    0% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    100% {
                        transform: translateY(0) translateX(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Landing;