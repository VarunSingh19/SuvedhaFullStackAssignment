export async function sendEmail(
  to: string,
  subject: string,
  pdfUrl: string,
  recipientName: string
) {
  try {
    console.log("Sending email with data:", {
      to,
      subject,
      pdfUrl,
      recipientName,
    });

    const response = await fetch("http://localhost:5000/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        pdfUrl,
        recipientName,
      }),
    });

    const data = await response.json();
    console.log("Server response:", data);

    if (!response.ok) {
      throw new Error(data.error || data.details || "Failed to send email");
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error in sendEmail:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}
