"use client";

import jsPDF from "jspdf";

interface OfferLetterData {
  candidate_name: string;
  domain: string;
  joining_date: string;
  end_date: string;
  ref_no: string;
}

export const generateOfferLetter = (data: OfferLetterData): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      format: "a4",
      unit: "mm",
    });

    // Define standard A4 width and margins
    const pageWidth = 210;
    const marginLeft = 20;
    const contentWidth = pageWidth - marginLeft * 2;

    // logo Section (left side of header)
    doc.addImage("/logo.jpg", "PNG", marginLeft, 15, 25, 25);

    // Header section - Organization name and registration (center)
    doc.setFontSize(16);
    doc.text("Suvidha Mahila Mandal, Walni", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(11);
    doc.text(
      [
        "Registration No. MH/568/1995",
        "F No.12669",
        "Registerd Under the Society Act of 1860",
      ],
      pageWidth / 2,
      25,
      {
        align: "center",
        lineHeightFactor: 1.2,
      }
    );

    // Contact details (right side)
    doc.setFontSize(7);
    doc.text(
      [
        "H.No. 1951, W.N.4, Khaperkheda, Saoner,",
        "Contact: (+91)08010996763",
        "info@suvidhafoundationedutech.org",
        "www.suvidhafoundationedutech.org",
      ],
      pageWidth - marginLeft,
      20,
      {
        align: "right",
        lineHeightFactor: 1.3,
      }
    );

    // Letter details
    doc.setFontSize(11);
    doc.text(
      `Date:${new Date(data.joining_date).toLocaleDateString()}`,
      marginLeft,
      50
    );
    doc.text(`Ref. No. ${data.ref_no}`, marginLeft, 55);

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INTERNSHIP OFFER LETTER", pageWidth / 2, 65, { align: "center" });

    // Recipient
    doc.setFont("helvetica", "normal");
    doc.text("To", marginLeft, 75);
    doc.text(`${data.candidate_name},`, marginLeft, 80);

    // Main content
    const mainContent = `With reference to your interview, we are pleased to inform you that you have been selected as "Volunteer Intern" in our NGO - Suvidha Mahila Mandal, with the following terms and conditions:`;
    const wrappedMainContent = doc.splitTextToSize(mainContent, contentWidth);
    doc.text(wrappedMainContent, marginLeft, 90);

    // Terms and conditions
    let yPos = 103;
    const terms = [
      `• Apart from your domain you will provide the volunteer and fundraising Service to SUVIDHA FOUNDATION`,
      `• The internship period will be from ${new Date(
        data.joining_date
      ).toLocaleDateString()} to ${new Date(
        data.end_date
      ).toLocaleDateString()}.`,
      `• Your Work Base station is Work From Home and six days a week. You have to work for 4 hours daily`,
      `• During the internship period and thereafter, you will not give out to anyone in writing or by word of mouth or otherwise particulars or details of work process, technical know-how, research carried out, security arrangements and/or matters of confidential or secret nature which you may come across during your service in this organization.`,
      `• In case of any misconduct which causes financial loss to the NGO or hurts its reputation and goodwill of the organization, the management has the right to terminate any intern. In case of termination, the management will not be issuing certificates to the intern.`,
      `• It is necessary for an intern to return all the organization belongings (login credentials, media created, and system) at the time of leaving the organization. A clearance and experience certificate will be given after completing the formalities. If any employee leaves the job/internship without completing the formality, the organization will take necessary action.`,
    ];

    terms.forEach((term) => {
      const wrappedTerm = doc.splitTextToSize(term, contentWidth);
      doc.text(wrappedTerm, marginLeft, yPos);
      yPos += wrappedTerm.length * 5;
    });

    // Legal notice
    const legalNotice = `All the source/codes/data developed by the interns or any employee for the Suvidha Mahila Mandal are intellectual property of the organization & are protected by Indian Copyright Act. All the data generated during the internship period, is the property right of organization and can be used for any purpose. In case of any piracy, strict legal action will be taken by the organization against erring persons. No information or source codes or course curriculum or business secrets or financial position or other details of organization shall be discussed among friends or relatives or our competitors. Such leakage of information is likely to cause financial loss to the organization. Hence, in such a case, the organization will terminate the employee immediately and if required, further legal action will be taken against you.`;
    const wrappedLegalNotice = doc.splitTextToSize(legalNotice, contentWidth);
    yPos += 5;
    doc.text(wrappedLegalNotice, marginLeft, yPos);

    // Agreement section
    yPos += wrappedLegalNotice.length * 4 + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Employment /Agreement Internship", marginLeft, yPos);
    doc.setFont("helvetica", "normal");
    const agreement = `This agreement is entered between Suvidha Mahila Mandal, Registered office H.no 1951,W.N.4,Khaperkheda, Saoner, Nagpur and hereafter -called Suvidha Foundation.`;
    const wrappedAgreement = doc.splitTextToSize(agreement, contentWidth);
    yPos += 5;
    doc.text(wrappedAgreement, marginLeft, yPos);

    // Signature section
    yPos += wrappedAgreement.length * 5 + 10;
    doc.text("AND", marginLeft, yPos);
    yPos += 5;
    doc.text(`${data.candidate_name}(                    )`, marginLeft, yPos);
    yPos += 5;
    doc.text(
      "We wish you a successful journey with the Suvidha Foundation.",
      marginLeft,
      yPos
    );
    yPos += 10;
    doc.text("Mrs. ShobhMotghare", marginLeft, yPos);
    doc.text("Secretary, Suvidha Mahila Mandal", marginLeft, yPos + 5);

    resolve(doc.output("blob"));
  });
};
