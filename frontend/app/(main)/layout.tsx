"use client";

import { AppLayout } from "@/layouts/app-layout";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
