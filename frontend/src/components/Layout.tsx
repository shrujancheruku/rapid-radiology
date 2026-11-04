import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { ModeToggle } from "@/components/ModeToggle";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {ScanEye} from "lucide-react";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { label: "Home", to: "/" },
        { label: "Normal Templates", to: "/templates" },
    ];

    return (
        <div className="flex flex-col min-h-screen w-screen bg-background text-foreground">
            <nav className="flex items-center justify-between p-4 border-b border-border shadow-sm">
                <div className="flex items-center select-none">
                    <ScanEye className='text-primary'/>
                    <h1 className="text-xl text-secondary">RapidRadiology</h1>
                </div>

                <div className="flex items-center space-x-2">
                    <NavigationMenu>
                        <NavigationMenuList className="flex space-x-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.to;
                                return (
                                    <NavigationMenuItem key={item.to}>
                                        <NavigationMenuLink
                                            asChild
                                            className={cn(
                                                "group inline-flex items-center justify-center px-3 py-1 rounded-md transition-colors focus:outline-none no-underline",
                                                isActive
                                                    ? "bg-primary text-background hover:bg-primary hover:text-background"
                                                    : "text-foreground/80 hover:text-foreground"
                                            )}
                                        >
                                            <Link to={item.to}>{item.label}</Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                );
                            })}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <div className="flex items-center space-x-2">
                    <ModeToggle />
                    <Button variant="secondary" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </nav>

            <main className={cn("flex-1 container mx-auto p-4")}>{children}</main>
        </div>
    );
}