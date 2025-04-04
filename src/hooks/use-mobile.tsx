// src/hooks/use-mobile.js
'use client'
import { useState, useEffect } from 'react';

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Function to check if viewport width is mobile-sized
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768); // Typically 768px is considered mobile breakpoint
        };

        // Check on initial load
        checkIsMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // Clean up event listener on component unmount
        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    return isMobile;
}