'use client';

import { useState, useEffect } from "react"
import { LogOut, Menu, X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

export default function Navbar() {
    const { toast } = useToast()
    const [userEmail, setUserEmail] = useState("")
    const [userName, setUserName] = useState("")
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const fetchUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || "")
                const name = user.email?.split('@')[0] || ""
                setUserName(name)
            }
        }
        fetchUserEmail()
    }, [])

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            window.location.href = "/auth"
        } catch (error) {
            console.error("Error signing out:", error)
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive",
            })
        }
    }

    const getUserInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U'
    }

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <motion.h1
                        className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <a href="/dashboard" className="cursor-pointer">
                            Offer Letter Portal
                        </a>
                    </motion.h1>

                    <div className="hidden md:flex items-center space-x-4">
                        <div className="flex items-center space-x-4">
                            <a href="/dashboard/certificates" className="text-sm text-gray-700 dark:text-gray-300">
                                Offer Letters
                            </a>
                            <a href="/dashboard/verify" className="text-sm text-gray-700 dark:text-gray-300">
                                Verify
                            </a>

                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {userName} HR
                            </span>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg cursor-pointer hover:opacity-80 transition-opacity">
                                    {getUserInitials(userName)} HR
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 text-white flex items-center justify-center text-xl font-semibold">
                                            {getUserInitials(userName)} HR
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{userName} HR</p>
                                            <p className="text-xs text-gray-500">{userEmail}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSignOut}
                                        className="w-full"
                                        variant="destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center space-x-2 z-10">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{userName} HR</span>
                        <Button
                            variant="ghost"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden absolute left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-20">
                        <div className="px-4 pt-2 pb-4 space-y-2">
                            <a
                                href="/dashboard/certificates"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                OfferLetters
                            </a>
                            <a
                                href="/dashboard/verify"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Verify
                            </a>
                            <div className="flex items-center space-x-3 px-3 py-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 text-white flex items-center justify-center text-lg font-semibold">
                                    {getUserInitials(userName)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{userName} HR</p>
                                    <p className="text-xs text-gray-500">{userEmail}</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleSignOut}
                                className="w-full"
                                variant="destructive"
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}