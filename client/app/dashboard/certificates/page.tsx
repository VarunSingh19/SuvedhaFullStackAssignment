"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Eye, RefreshCw, Search, X } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"

interface Certificate {
  id: string
  candidate_name: string
  candidate_email?: string
  domain: string
  joining_date: string
  end_date: string
  ref_no: string
  pdf_url: string
  created_at: string
  status: string
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCertificates()
  }, [])

  useEffect(() => {
    // Filter certificates based on search term
    if (searchTerm.trim() === "") {
      setFilteredCertificates(certificates)
    } else {
      const searchTermLower = searchTerm.toLowerCase().trim()
      const filtered = certificates.filter(cert =>
        cert.candidate_name.toLowerCase().includes(searchTermLower) ||
        (cert.candidate_email && cert.candidate_email.toLowerCase().includes(searchTermLower)) ||
        cert.ref_no.toLowerCase().includes(searchTermLower)
      )
      setFilteredCertificates(filtered)
    }
  }, [searchTerm, certificates])

  const fetchCertificates = async () => {
    try {
      setIsLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("No authenticated user")

      const { data, error } = await supabase
        .from("offer_letters")
        .select("*")
        .eq("created_by", user.id)
        .in("status", ["generated", "sent"])
        .order("created_at", { ascending: false })

      if (error) throw error
      setCertificates(data || [])
      setFilteredCertificates(data || [])
    } catch (error) {
      console.error("Error fetching certificates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch certificates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (pdfUrl: string) => {
    try {
      window.open(pdfUrl, "_blank")
    } catch (error) {
      console.error("Error downloading certificate:", error)
      toast({
        title: "Error",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleView = async (pdfUrl: string) => {
    try {
      window.open(pdfUrl, "_blank")
    } catch (error) {
      console.error("Error viewing certificate:", error)
      toast({
        title: "Error",
        description: "Failed to view certificate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Generated Offer Letter</h1>
        <Button onClick={fetchCertificates} className="bg-purple-500 hover:bg-purple-600 text-white">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Offer Letter
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by Name, Email, or Reference Number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchTerm && filteredCertificates.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">No results found</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-700">
              <TableHead className="w-[50px]">Sr No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Reference No</TableHead>
              <TableHead>Generated On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                    <span className="ml-2">Loading Offer Letters...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCertificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No Offer Letter found
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {filteredCertificates.map((cert, index) => (
                  <motion.tr
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{cert.candidate_name}</TableCell>
                    <TableCell>{cert.domain}</TableCell>
                    <TableCell>{format(new Date(cert.joining_date), "dd-MM-yyyy")}</TableCell>
                    <TableCell>{format(new Date(cert.end_date), "dd-MM-yyyy")}</TableCell>
                    <TableCell>{cert.ref_no}</TableCell>
                    <TableCell>{format(new Date(cert.created_at), "dd-MM-yyyy")}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${cert.status === "generated"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                          }`}
                      >
                        {cert.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                          onClick={() => handleDownload(cert.pdf_url)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                          onClick={() => handleView(cert.pdf_url)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}