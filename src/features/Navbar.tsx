

import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"

export function MainNav() {
    const router = useRouter()
    const isLoggedIn = false 

    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/login")
        }
    }, [isLoggedIn, router])

    return (
        <div className="flex justify-center w-full py-4 bg-zinc-700 text-white">
            <NavigationMenu className="flex justify-around">
                <NavigationMenuList className="flex gap-6 justify-around w-full"> 
                <div className="flex">
                    <NavigationMenuItem>
                        <Link href="/" legacyBehavior passHref>
                            <NavigationMenuLink className="text-sm font-medium hover:text-primary">
                                Analytics
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <Link href="/products" legacyBehavior passHref>
                            <NavigationMenuLink className="text-sm font-medium hover:text-primary">
                                Scheduling
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <Link href="/about" legacyBehavior passHref>
                            <NavigationMenuLink className="text-sm font-medium hover:text-primary">
                                Generate Posts
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </div>
                    <NavigationMenuItem>
                        {isLoggedIn ? (
                            <Link href="/user" legacyBehavior passHref>
                                <NavigationMenuLink className="text-sm font-medium hover:text-primary pr-4">
                                    <Avatar />
                                </NavigationMenuLink>
                            </Link>
                        ) : (
                            <div className="text-sm font-medium hover:text-primary pr-4">
                                User Card
                            </div>
                        )}
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}
