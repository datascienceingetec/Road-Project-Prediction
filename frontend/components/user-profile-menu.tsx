"use client";

import { useAuth } from "@/contexts/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UserProfileMenuProps {
    collapsed?: boolean;
    align?: "start" | "end" | "center";
}

export function UserProfileMenu({
    collapsed = false,
    align = "end",
}: UserProfileMenuProps) {
    const { user, logout } = useAuth();

    if (!user) return null;

    const initials = user.employeeName
        ? user.employeeName.substring(0, 2).toUpperCase()
        : "U";

    // Construct full name safely
    const fullName = [user.employeeName, user.employeeLastName]
        .filter(Boolean)
        .join(" ");

    // Prepare image source, handling potential base64 without prefix
    const imageSrc = user.employeePicture
        ? user.employeePicture.startsWith("data:") ||
          user.employeePicture.startsWith("http")
            ? user.employeePicture
            : `data:image/jpeg;base64,${user.employeePicture}`
        : undefined;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "relative h-10 w-full rounded-full p-0 hover:bg-white/10",
                        collapsed ? "justify-center" : "justify-start px-2"
                    )}
                >
                    <Avatar className="h-8 w-8 border border-white/20">
                        <AvatarImage src={imageSrc} alt={fullName} />
                        <AvatarFallback className="bg-primary-dark text-white text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {!collapsed && (
                        <div className="ml-3 flex flex-col items-start text-left">
                            <span className="text-sm font-medium text-white max-w-[140px] truncate">
                                {fullName || "Usuario"}
                            </span>
                            <span className="text-xs text-gray-400 max-w-[140px] truncate">
                                {user.employeeDepartment || "Sin departamento"}
                            </span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align={align} forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {fullName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.employeeMail}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <span className="material-symbols-outlined mr-2 h-4 w-4">
                            badge
                        </span>
                        <span>{user.employeeCategorie || "N/A"}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        <span className="material-symbols-outlined mr-2 h-4 w-4">
                            domain
                        </span>
                        <span>{user.employeeDepartment || "N/A"}</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/configuracion"
                        className="cursor-pointer w-full flex items-center"
                    >
                        <span className="material-symbols-outlined mr-2 h-4 w-4">
                            settings
                        </span>
                        <span>Configuración</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
                >
                    <span className="material-symbols-outlined mr-2 h-4 w-4">
                        logout
                    </span>
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
