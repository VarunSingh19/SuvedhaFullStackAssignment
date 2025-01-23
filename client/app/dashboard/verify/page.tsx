"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface OfferLetterDetails {
    candidate_name: string
    candidate_email: string
    domain: string
    joining_date: string
    end_date: string
    ref_no: string
    pdf_url: string
    status: string
}

export default function OfferLetterVerification() {
    const [referenceNumber, setReferenceNumber] = useState("")
    const [offerLetterDetails, setOfferLetterDetails] = useState<OfferLetterDetails | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const { toast } = useToast()

    const handleVerification = async () => {
        if (!referenceNumber.trim()) {
            toast({
                title: "Error",
                description: "Please enter a reference number",
                variant: "destructive"
            })
            return
        }

        try {
            setIsVerifying(true)

            const { data, error } = await supabase
                .from("offer_letters")
                .select("*")
                .eq("ref_no", referenceNumber.trim())
                .in("status", ["generated", "sent"])
                .single()

            if (error) throw error

            if (data) {
                setOfferLetterDetails(data)
                toast({
                    title: "Verification Successful",
                    description: "Offer letter found!",
                    variant: "default"
                })
            } else {
                setOfferLetterDetails(null)
                toast({
                    title: "Verification Failed",
                    description: "No offer letter found with this reference number",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("Verification error:", error)
            toast({
                title: "Error",
                description: "Failed to verify offer letter. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsVerifying(false)
        }
    }

    const handleDownload = () => {
        if (offerLetterDetails?.pdf_url) {
            window.open(offerLetterDetails.pdf_url, "_blank")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 ">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center ">Offer Letter Verification</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Enter Reference Number"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full"
                        />
                        <Button
                            onClick={handleVerification}
                            disabled={isVerifying}
                            className="w-full  bg-gradient-to-r from-purple-400 to-pink-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg"
                        >
                            {isVerifying ? "Verifying..." : "Verify Offer Letter"}
                        </Button>

                        {offerLetterDetails && (
                            <div className="mt-6 bg-white shadow-md rounded-lg p-6">
                                <h2 className="text-xl font-bold mb-4 text-center">Offer Letter Details</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Name:</span>
                                        <span>{offerLetterDetails.candidate_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Email:</span>
                                        <span>{offerLetterDetails.candidate_email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Domain:</span>
                                        <span>{offerLetterDetails.domain}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Joining Date:</span>
                                        <span>{format(new Date(offerLetterDetails.joining_date), "dd-MM-yyyy")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">End Date:</span>
                                        <span>{format(new Date(offerLetterDetails.end_date), "dd-MM-yyyy")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Reference No:</span>
                                        <span>{offerLetterDetails.ref_no}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Status:</span>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${offerLetterDetails.status === "generated"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {offerLetterDetails.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 flex space-x-4">
                                    <Button
                                        onClick={handleDownload}
                                        className="w-full  bg-gradient-to-r from-purple-400 to-pink-600 text-white flex items-center justify-center text-lg font-semibold shadow-lg"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Offer Letter
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}