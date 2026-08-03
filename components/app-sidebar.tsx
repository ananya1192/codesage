"use client";
import React from 'react'
import { SiGithub } from '@icons-pack/react-simple-icons';
import { BookOpen, Settings, Moon, Sun, LogOut, icons} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState,useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar , AvatarFallback , AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu , DropdownMenuContent , DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Logout from '@/module/auth/components/logout';
import { signOut } from "@/lib/auth-client";

export const AppSidebar = () => {
 const{theme, setTheme} = useTheme();
 const[mounted, setMounted]=useState(false);
 const pathname = usePathname();

 const {data:session} =useSession();

 useEffect(()=>{
  setMounted(true)
 },[])

 const navigationItems = [
  {
    title : "Dashboard",
    url: "/dashboard",
    icon: BookOpen,
  },
  {
    title:"Repository",
    url:"/dashboard/repository",
    icon:SiGithub,
  },
  {
    title:"Reviews",
    url:"/dashboard/reviews",
    icon:BookOpen,
  },
  {
    title:"Subscription",
    url:"/dashboard/subscription",
    icon:BookOpen,
  },
  {
    title:"Settings",
    url:"/dashboard/settings",
    icon:Settings
  }
 ]

 const isActive = (url:string)=>{
  return pathname === url || pathname.startsWith(url + "/dashboard")
 }

 if(!mounted||!session) return null

 const user = session.user;
 const userName = user.name || "GUEST"
 const userEmail = user.email || ""
 const userAvatar = user.image || ""
 const userInitials = userName
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase();
 return (
  <Sidebar>
  <SidebarHeader className="border-b">
    <div className="flex flex-col gap-4 px-2 py-6">
      <div className="flex items-center gap-4 rounded-lg bg-sidebar-accent/50 px-3 py-4 hover:bg-sidebar-accent">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <SiGithub className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-sidebar-foreground">
            Connected Account
          </p>
          <p className="text-sm font-medium text-sidebar-foreground/90">
            @{userName}
          </p>
        </div>
      </div>
    </div>
  </SidebarHeader>

  <SidebarContent className="flex flex-col gap-1 px-3 py-6">
  <div className="mb-2">
    <p className="text-xs font-semibold text-sidebar-foreground/60 px-3 mb-3 uppercase tracking-widest">
      Menu
    </p>
  </div>

  <SidebarMenu className="gap-2">
  {navigationItems.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
  render={<Link href={item.url} />}
  tooltip={item.title}
  className={`h-11 rounded-lg px-4 transition-all duration-200 ${
    isActive(item.url)
      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent/60"
  }`}
>
  <item.icon className="h-5 w-5 shrink-0" />
  <span className="text-sm font-medium">{item.title}</span>
</SidebarMenuButton>
    </SidebarMenuItem>
  ))}
</SidebarMenu>
</SidebarContent>

<SidebarFooter className="border-t px-3 py-4">
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-lg px-4 transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            >
              <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                <AvatarImage
                  src={userAvatar || "/placeholder.svg"}
                  alt={userName}
                />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 text-left">
                <div className="grid text-sm leading-relaxed">
                  <span className="truncate text-base font-semibold">
                    {userName}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {userEmail}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          }
        />

        <DropdownMenuContent 
        className="w-80 rounded-lg"
        align="end" 
        side="right"
        sideOffset={8}>
        
         <div className="border-y px-2 py-3">
  <DropdownMenuItem
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-sidebar-accent/50"
  >
    {theme === "dark" ? (
      <>
        <Sun className="h-5 w-5 shrink-0" />
        <span>Light Mode</span>
      </>
    ) : (
      <>
        <Moon className="h-5 w-5 shrink-0" />
        <span>Dark Mode</span>
      </>
    )}
  
  </DropdownMenuItem>

<DropdownMenuItem
  className="my-1 cursor-pointer rounded-md px-3 py-3 font-medium text-red-600 hover:bg-red-500/10"
  onClick={async () => {
    console.log("Calling signOut...");

    await signOut({
      fetchOptions: {
        onSuccess: () => {
          console.log("Signed out successfully");
          window.location.href = "/login";
        },
        onError: (ctx) => {
          console.error("Sign out failed:", ctx);
        },
      },
    });
  }}
>
  <LogOut className="mr-3 h-5 w-5 shrink-0" />
  Sign Out
</DropdownMenuItem>
</div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
</Sidebar>
 )
}

export default AppSidebar