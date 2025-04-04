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

    const handleCardClick = (platformName: string) => {
        setSelectedPlatform(platformName);
        fetchCredentials(platformName);
        setIsDialogOpen(true);
    };

    const fetchCredentials = async (platformName: string) => {
        try {
            const response = await fetch(`/api/credentials?platform=${platformName}`);
            const data = await response.json();
            setCredentials(data);
        } catch (error) {
            console.error("Failed to fetch credentials:", error);
            setCredentials(null);
        }
    };

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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
