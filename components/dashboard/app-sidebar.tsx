"use client";

import { FlaskConical, Dna, ScanSearch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const navItems = [
  { title: "Drug-Gene Interaction", url: "/interactions", icon: FlaskConical },
  { title: "Full patient check", url: "/panel", icon: ScanSearch },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/interactions" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary"><Dna className="size-5 text-primary-foreground" /></div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground">RxGenomics</span>
            <span className="text-xs text-muted-foreground">Pharmacogenomic decision support</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{navItems.map((item) => <SidebarMenuItem key={item.title}><SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}><Link href={item.url}><item.icon data-icon="inline-start" /><span>{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
