"use client"
import { useState, useEffect } from "react"
import { XCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/trpc/react"
import ImageCard from "@/components/ui/image-cardneo"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialogneo"
import { Button } from "@/components/ui/button"

interface CardData {
  platformName: string
  imageUrl: string
  color: string
}

const Onboarding = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const router = useRouter()

  // YouTube connection logic
  const youtubeAuthUrlQuery = api.youtube.getAuthUrl.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  })

  const handleConnectYouTube = () => {
    if (youtubeAuthUrlQuery.data?.url) {
      window.location.href = youtubeAuthUrlQuery.data.url
    }
  }

  // Twitter connection logic
  const twitterAuthStatusQuery = api.twitter.checkToken.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  })

  const handleTwitterConnect = async () => {
    try {
      window.location.href = "/api/auth/twitter"
    } catch (error) {
      console.error("Twitter auth error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // LinkedIn connection logic
  const handleLinkedinConnect = async () => {
    try {
      // Redirect to our backend auth route
      window.location.href = "/api/auth/linkedin";
    } catch (error) {
      console.error("LinkedIn auth error:", error);
    }
  };

  useEffect(() => {
    if (twitterAuthStatusQuery?.data?.isValid) {
      setIsConnected(true)
    } else {
      setIsConnected(false)
    }
    setIsLoading(false)
  }, [twitterAuthStatusQuery.data])

  const cardData: CardData[] = [
    {
      platformName: "YouTube",
      imageUrl: "https://img.icons8.com/?size=100&id=19318&format=png&color=000000",
      color: "bg-red-600",
    },
    {
      platformName: "Twitter",
      imageUrl: "https://img.icons8.com/?size=100&id=6Fsj3rv2DCmG&format=png&color=000000",
      color: "bg-blue-400",
    },
    {
      platformName: "LinkedIn",
      imageUrl: "https://img.icons8.com/?size=100&id=447&format=png&color=000000",
      color: "bg-blue-700",
    },
    // Add more platforms as needed
  ]

  const handleCardClick = (platformName: string) => {
    setSelectedPlatform(platformName)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Connect Your Accounts</h1>
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a platform to connect</h2>
          <p className="text-gray-500">Connect your social media accounts to manage your content in one place</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardData.map((card, index) => (
            <div
              onClick={() => handleCardClick(card.platformName)}
              key={index}
              className="transform transition-transform hover:scale-105 cursor-pointer"
            >
              <ImageCard caption={card.platformName} imageUrl={card.imageUrl} />
            </div>
          ))}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => setIsDialogOpen(isOpen)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedPlatform} Integration</DialogTitle>
          </DialogHeader>

          {selectedPlatform === "YouTube" ? (
            <div className="flex flex-col items-center py-4">
              <div className="flex items-center text-amber-600 mb-3">
                {isConnected ? (
                  <>
                    <CheckCircle className="mr-2 text-green-500" />
                    <span className="font-medium text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2" />
                    <span className="font-medium">Not Connected</span>
                  </>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 w-full">
                <p className="text-sm text-gray-600">
                  Connect your account to YouTube to upload and manage videos directly from this application.
                </p>
              </div>

              <Button
                onClick={handleConnectYouTube}
                disabled={!youtubeAuthUrlQuery.data?.url || isLoading}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
              >
                {isLoading ? "Loading..." : "Connect to YouTube"}
              </Button>
            </div>
          ) : selectedPlatform === "Twitter" ? (
            <div className="flex flex-col items-center py-4">
              <div className="flex items-center text-amber-600 mb-3">
                {isConnected ? (
                  <>
                    <CheckCircle className="mr-2 text-green-500" />
                    <span className="font-medium text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2" />
                    <span className="font-medium">Not Connected</span>
                  </>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 w-full">
                <p className="text-sm text-gray-600">
                  Connect your account to Twitter to post and manage tweets directly from this application.
                </p>
              </div>

              <Button
                onClick={handleTwitterConnect}
                disabled={isLoading || isConnected}
                className="bg-blue-400 hover:bg-blue-500 text-white w-full"
              >
                {isLoading ? "Loading..." : isConnected ? "Connected" : "Connect to Twitter"}
              </Button>
            </div>
          ) : selectedPlatform === "LinkedIn" ? (
            <div className="flex flex-col items-center py-4">
              <button
                onClick={handleLinkedinConnect}
                className="rounded-full bg-[#1DA1F2] px-6 py-3 font-semibold text-white hover:bg-[#1a8cd8] disabled:opacity-50"
              >
                Connect to LinkedIn
              </button>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <p>Loading platform details...</p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-500">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Onboarding

