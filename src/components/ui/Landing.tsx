"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'

const Landing = () => {
    const [images, setImages] = useState<Array<{ x: number; y: number; src: string; visible: boolean }>>([]);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    const imageUrls = [
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099",
        "https://static.toiimg.com/photo.cms?photoid=106748099"
        // Added more images
    ];
    // Update window size on resize
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        // Set initial size
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate responsive image dimensions
    const getImageDimensions = () => {
        const width = windowSize.width < 640 ? 120 : // mobile
                     windowSize.width < 1024 ? 160 : // tablet
                     200; // desktop
        const height = width * 0.5; // maintain aspect ratio
        return { width, height };
    };

    useEffect(() => {
        if (windowSize.width && windowSize.height) {
            const { width, height } = getImageDimensions();
            setImages(imageUrls.map(src => ({
                x: Math.floor(Math.random() * (windowSize.width - width)),
                y: Math.floor(Math.random() * (windowSize.height - height)),
                src,
                visible: false
            })));
        }
    }, [windowSize]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            setImages(prevImages => {
                const newImages = [...prevImages];
                if (currentIndex >= 18) {
                    const firstVisibleIndex = newImages.findIndex(img => img.visible);
                    if (firstVisibleIndex !== -1 && newImages[firstVisibleIndex]) {
                        newImages[firstVisibleIndex].visible = false;
                    }
                }
                const currentImage = newImages[currentIndex];
                if (currentImage) {
                    currentImage.visible = true;
                }
                currentIndex = (currentIndex + 1) % newImages.length; // Reset index to loop infinitely
                return newImages;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [images.length]);

    const { width, height } = getImageDimensions();

    return (
        <div className='relative w-full h-screen overflow-hidden bg-[#16161d]'>
            {/* Centered text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <h1 className="text-6xl font-bold text-white">Bingo</h1>
                <p className="text-lg text-white mt-2">Schedule ND Automate your content</p>
            </div>
            {/* Images */}
            {images.map((img, index) => (
                <Image 
                    key={index}
                    src={img.src}
                    alt="Landing Image" 
                    width={width}
                    height={height}
                    style={{
                        position: 'absolute',
                        left: `${img.x}px`,
                        top: `${img.y}px`,
                        opacity: img.visible ? 1 : 0,
                        transition: 'opacity 0.3s, width 0.3s, height 0.3s'
                    }}
                />
            ))}
        </div>
    )
}

export default Landing
