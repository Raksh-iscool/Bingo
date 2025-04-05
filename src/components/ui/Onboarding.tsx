"use client"
import ImageCard from '@/components/ui/image-cardneo'
import { Dialog, DialogContent } from '@/components/ui/dialogneo'
import React, { useState, useEffect } from 'react'

interface CardData {
    platformName: string;
    imageUrl: string;
}

const Onboarding = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('');
    const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

    const cardData: CardData[] = [
        {
            platformName: "Instagram",
            imageUrl: "https://example.com/instagram.jpg"
        },
        {
            platformName: "Twitter",
            imageUrl: "https://example.com/twitter.jpg"
        },
        {
            platformName: "Facebook",
            imageUrl: "https://example.com/facebook.jpg"
        }
    ];

    const handleCardClick = async (platformName: string) => {
        setSelectedPlatform(platformName);
        await fetchCredentials(platformName); // Added `await` to handle the promise
        setIsDialogOpen(true);
    };

    const fetchCredentials = async (platformName: string): Promise<void> => {
        try {
            const response = await fetch(`/api/credentials?platform=${platformName}`);
            const data = (await response.json()) as { username: string; password: string }; // Explicit type assertion
            setCredentials(data); // Safe assignment
        } catch (error) {
            console.error("Failed to fetch credentials:", error);
            setCredentials(null);
        }
    };

    useEffect(() => {
        // Example usage of useEffect
    }, []);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {cardData.map((card, index) => (
                    <div onClick={() => handleCardClick(card.platformName)} key={index}>
                        <ImageCard
                            caption={card.platformName}
                            imageUrl={card.imageUrl}
                        />
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => setIsDialogOpen(isOpen)}> {/* Explicit type-safe handler */}
                <DialogContent>
                    <h3 className="text-lg font-bold">{selectedPlatform}</h3>
                    {credentials ? (
                        <div>
                            <p><strong>Username:</strong> {credentials.username}</p>
                            <p><strong>Password:</strong> {credentials.password}</p>
                        </div>
                    ) : (
                        <p>Loading credentials...</p>
                    )}
                    <button
                        className="mt-2 text-sm text-blue-500 underline"
                        onClick={() => setIsDialogOpen(false)}
                    >
                        Close
                    </button>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Onboarding
