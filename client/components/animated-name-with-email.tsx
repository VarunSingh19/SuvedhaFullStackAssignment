import type React from "react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AnimatedNameWithEmailProps {
    name: string
    email: string
}

const AnimatedNameWithEmail: React.FC<AnimatedNameWithEmailProps> = ({ name, email }) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <motion.span className="cursor-pointer inline-block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <span className="border-b-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 transition-colors duration-300">
                        {name}
                    </span>
                </motion.span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="bg-gray-800 text-white dark:bg-white dark:text-gray-800 px-3 py-2 rounded-md shadow-lg tooltip-content"
            >
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    {email}
                </motion.p>
            </TooltipContent>
        </Tooltip>
    )
}

export default AnimatedNameWithEmail

