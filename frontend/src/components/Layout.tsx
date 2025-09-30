import {type ReactNode} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Link} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";
import {ModeToggle} from "@/components/ModeToggle";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({children}: LayoutProps) {
    const {logout} = useAuth();

    const navItems = [
        {label: "Home", to: "/"},
        {label: "Templates", to: "/templates"},
    ];

    return (
        <div className="flex flex-col min-h-screen w-screen bg-background text-foreground">
            <nav className="flex items-center justify-between p-4 border-b border-border shadow-sm">
                <h1 className="text-xl font-bold">Rapid Radiology</h1>

                <div className="flex items-center space-x-2">
                    <NavigationMenu>
                        <NavigationMenuList className="flex space-x-2">
                            {navItems.map((item) => (
                                <NavigationMenuItem key={item.to}>
                                    <NavigationMenuLink
                                        asChild
                                        className={cn(
                                            "px-2 py-1",
                                            window.location.pathname === item.to
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                                                : ""
                                        )}
                                    >
                                        <Link to={item.to}>{item.label}</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>

                    <ModeToggle/>
                    <Button variant="ghost" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </nav>

            <main className={cn("flex-1 container mx-auto p-4")}>{children}</main>
        </div>
    );
}