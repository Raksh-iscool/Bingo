"use client"

import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu"
import Link from "next/link"

export function MainNav() {
    return (
        <div className="flex justify-center w-full py-4">
            <NavigationMenu>
                <NavigationMenuList className="flex gap-6">
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

                    <NavigationMenuItem>
                        <Link href="/contact" legacyBehavior passHref>
                            <NavigationMenuLink className="text-sm font-medium hover:text-primary">
                                User
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    )
}