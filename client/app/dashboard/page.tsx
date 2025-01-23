"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import CreateOfferLetterModal from "@/components/create-offer-letter-modal"
import { Search, LogOut, Download, Eye, Mail, Trash2, Moon, Sun } from "lucide-react"
import { generateOfferLetter } from "@/lib/generate-pdf"
import { sendEmail } from "@/lib/sendEmail"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AnimatedNameWithEmail from "@/components/animated-name-with-email"

interface OfferLetter {
  id: number
  candidate_name: string
  candidate_email: string
  domain: string
  joining_date: string
  end_date: string
  ref_no: string
  created_at: string
  created_by: string
  status: string
  pdf_url: string | null
}

export default function Dashboard() {
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState("10")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<OfferLetter | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOfferLetters()
    const savedMode = localStorage.getItem("darkMode")
    if (savedMode) {
      setDarkMode(JSON.parse(savedMode))
    }
  }, [entriesPerPage])

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode)
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  const fetchOfferLetters = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) throw new Error("No authenticated user")

      const { data, error } = await supabase
        .from("offer_letters")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(Number.parseInt(entriesPerPage))

      if (error) throw error
      setOfferLetters(data || [])
    } catch (error) {
      console.error("Error fetching offer letters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch offer letters",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (letter: OfferLetter) => {
    try {
      if (letter.pdf_url) {
        window.open(letter.pdf_url, "_blank")
        return
      }

      const pdfBlob = await generateOfferLetter(letter)
      const fileName = `${letter.ref_no}.pdf`

      try {
        const { data: bucketData, error: bucketError } = await supabase.storage.createBucket("offer-letters", {
          public: true,
          fileSizeLimit: 5242880,
        })

        if (bucketError && !bucketError.message.includes("already exists")) {
          throw bucketError
        }
      } catch (bucketError) {
        console.log("Bucket already exists or creation failed:", bucketError)
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("offer-letters")
        .upload(fileName, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("offer-letters").getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("offer_letters")
        .update({
          pdf_url: publicUrl,
          status: "generated",
        })
        .eq("id", letter.id)

      if (updateError) throw updateError

      await fetchOfferLetters()
      window.open(publicUrl, "_blank")

      toast({
        title: "Success",
        description: "Offer letter generated successfully",
      })
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate offer letter",
        variant: "destructive",
      })
    }
  }

  const handleView = async (letter: OfferLetter) => {
    if (!letter.pdf_url) {
      toast({
        title: "Error",
        description: "PDF not yet generated",
        variant: "destructive",
      })
      return
    }
    window.open(letter.pdf_url, "_blank")
  }

  const handleDelete = async (letter: OfferLetter) => {
    setSelectedLetter(letter)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedLetter) return

    try {
      if (selectedLetter.pdf_url) {
        const fileName = `${selectedLetter.ref_no}.pdf`
        const { error: storageError } = await supabase.storage.from("offer-letters").remove([fileName])

        if (storageError) throw storageError
      }

      const { error: dbError } = await supabase.from("offer_letters").delete().eq("id", selectedLetter.id)

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Certificate deleted successfully",
      })

      await fetchOfferLetters()
    } catch (error: any) {
      console.error("Error deleting certificate:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete certificate",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setSelectedLetter(null)
    }
  }

  const handleSendMail = async (letter: OfferLetter) => {
    try {
      if (!letter.pdf_url) {
        throw new Error("Please generate the certificate first")
      }

      // Show loading toast
      toast({
        title: "Sending Email",
        description: "Please wait while we send the email...",
      })

      const result = await sendEmail(
        letter.candidate_email,
        `Offer Letter - ${letter.ref_no}`,
        letter.pdf_url,
        letter.candidate_name,
      )

      if (!result.success) {
        throw new Error()
      }

      // Update status in database
      const { error: updateError } = await supabase.from("offer_letters").update({ status: "sent" }).eq("id", letter.id)

      if (updateError) throw updateError

      // Refresh the list
      await fetchOfferLetters()

      // Show success toast
      toast({
        title: "Success",
        description: "Email sent successfully to " + letter.candidate_email,
      })
    } catch (error: any) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      })
    }
  }

  const filteredOfferLetters = offerLetters.filter((letter) =>
    searchQuery.trim()
      ? letter.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.ref_no.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  return (
    <>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "dark bg-gray-900" : "bg-gray-100"}`}>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => setDarkMode(!darkMode)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <motion.div
            className="px-4 py-6 sm:px-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden mb-6 backdrop-blur-lg bg-opacity-30 dark:bg-opacity-30">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                      <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                        <SelectTrigger className="w-[70px] border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-purple-400 to-pink-600 hover:from-purple-500 hover:to-pink-700 text-white"
                  >
                    Generate OfferLetter
                  </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-inner rounded-lg overflow-hidden">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-700">
                          <TableHead className="w-[50px] text-gray-800 dark:text-gray-200">Sr No</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">Name</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">Designation</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">From</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">To</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">Reference No</TableHead>
                          <TableHead className="text-gray-800 dark:text-gray-200">Status</TableHead>
                          <TableHead className="text-center text-gray-800 dark:text-gray-200">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="inline-block w-6 h-6 border-t-2 border-purple-500 rounded-full"
                                />
                              </TableCell>
                            </TableRow>
                          ) : filteredOfferLetters.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                No certificates found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredOfferLetters.map((letter, index) => (
                              <motion.tr
                                key={letter.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <AnimatedNameWithEmail name={letter.candidate_name} email={letter.candidate_email} />
                                </TableCell>
                                <TableCell>{letter.domain}</TableCell>
                                <TableCell>{format(new Date(letter.joining_date), "dd-MM-yyyy")}</TableCell>
                                <TableCell>{format(new Date(letter.end_date), "dd-MM-yyyy")}</TableCell>
                                <TableCell>{letter.ref_no}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${letter.status === "generated"
                                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                      : letter.status === "sent"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                      }`}
                                  >
                                    {letter.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors duration-200"
                                      onClick={() => handleDownload(letter)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white transition-colors duration-200"
                                      onClick={() => handleView(letter)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white transition-colors duration-200"
                                      onClick={() => handleSendMail(letter)}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors duration-200"
                                      onClick={() => handleDelete(letter)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <CreateOfferLetterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchOfferLetters}
        />

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Offer Letter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this Offer Letter? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}

