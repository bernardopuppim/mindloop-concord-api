import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface NotificationEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string = "";
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (host && port && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: parseInt(port, 10) === 465,
          auth: { user, pass },
        });
        this.fromAddress = from || user;
        this.isConfigured = true;
        console.log("Email service configured successfully");
      } catch (error) {
        console.error("Failed to configure email service:", error);
        this.isConfigured = false;
      }
    } else {
      console.log("Email service not configured - missing SMTP credentials");
      this.isConfigured = false;
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  public async sendEmail(email: NotificationEmail): Promise<boolean> {
    if (!this.isReady()) {
      console.log("Email service not configured, skipping email send");
      return false;
    }

    try {
      await this.transporter!.sendMail({
        from: this.fromAddress,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      console.log(`Email sent successfully to ${email.to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  public async sendNewOccurrenceNotification(
    recipientEmail: string,
    occurrence: {
      date: string;
      category: string;
      description: string;
      employeeName?: string;
    }
  ): Promise<boolean> {
    const subject = `New Occurrence Registered - ${occurrence.category}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">New Occurrence Notification</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${occurrence.date}</p>
          <p><strong>Category:</strong> ${occurrence.category}</p>
          ${occurrence.employeeName ? `<p><strong>Employee:</strong> ${occurrence.employeeName}</p>` : ""}
          <p><strong>Description:</strong> ${occurrence.description}</p>
        </div>
        <p style="color: #718096; font-size: 14px;">
          This is an automated notification from the Contract Management System.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `New Occurrence: ${occurrence.category} on ${occurrence.date}. ${occurrence.description}`,
    });
  }

  public async sendMissingAllocationNotification(
    recipientEmail: string,
    data: {
      date: string;
      postName: string;
      postCode: string;
    }
  ): Promise<boolean> {
    const subject = `Missing Allocation Alert - ${data.postCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c53030;">Missing Allocation Alert</h2>
        <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c53030;">
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Service Post:</strong> ${data.postName} (${data.postCode})</p>
          <p>No employees have been allocated to this service post for the specified date.</p>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Please review and update the allocations as needed.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Missing Allocation Alert: No allocation for ${data.postName} (${data.postCode}) on ${data.date}`,
    });
  }

  public async sendDocumentExpirationNotification(
    recipientEmail: string,
    documents: Array<{
      documentType: string;
      originalName: string;
      expirationDate: string;
      employeeName?: string;
      postName?: string;
      daysUntilExpiration: number;
    }>
  ): Promise<boolean> {
    const expiredDocs = documents.filter((d) => d.daysUntilExpiration <= 0);
    const expiringDocs = documents.filter((d) => d.daysUntilExpiration > 0);

    const subject = expiredDocs.length > 0
      ? `Document Expiration Alert - ${expiredDocs.length} Expired, ${expiringDocs.length} Expiring Soon`
      : `Document Expiration Alert - ${expiringDocs.length} Documents Expiring Soon`;

    const formatDocList = (docs: typeof documents, isExpired: boolean) => {
      if (docs.length === 0) return "";
      
      const title = isExpired ? "Expired Documents" : "Documents Expiring Soon";
      const bgColor = isExpired ? "#fff5f5" : "#fffaf0";
      const borderColor = isExpired ? "#c53030" : "#dd6b20";
      
      return `
        <div style="background-color: ${bgColor}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <h3 style="color: ${borderColor}; margin-top: 0;">${title}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 8px;">Document</th>
                <th style="text-align: left; padding: 8px;">Type</th>
                <th style="text-align: left; padding: 8px;">Expiration</th>
                <th style="text-align: left; padding: 8px;">Related To</th>
              </tr>
            </thead>
            <tbody>
              ${docs.map((doc) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px;">${doc.originalName}</td>
                  <td style="padding: 8px;">${doc.documentType}</td>
                  <td style="padding: 8px;">${doc.expirationDate}</td>
                  <td style="padding: 8px;">${doc.employeeName || doc.postName || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Document Expiration Notification</h2>
        ${formatDocList(expiredDocs, true)}
        ${formatDocList(expiringDocs, false)}
        <p style="color: #718096; font-size: 14px;">
          Please review these documents and upload updated versions as needed.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Document Expiration Alert: ${expiredDocs.length} expired, ${expiringDocs.length} expiring soon.`,
    });
  }

  public async sendDailySummaryNotification(
    recipientEmail: string,
    summary: {
      date: string;
      newOccurrences: number;
      missingAllocations: number;
      expiredDocuments: number;
      expiringDocuments: number;
    }
  ): Promise<boolean> {
    const hasIssues =
      summary.newOccurrences > 0 ||
      summary.missingAllocations > 0 ||
      summary.expiredDocuments > 0 ||
      summary.expiringDocuments > 0;

    if (!hasIssues) {
      return true;
    }

    const subject = `Daily Summary - ${summary.date}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Daily Summary - ${summary.date}</h2>
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                <strong>New Occurrences:</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                ${summary.newOccurrences}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                <strong>Missing Allocations:</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; ${summary.missingAllocations > 0 ? 'color: #c53030;' : ''}">
                ${summary.missingAllocations}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                <strong>Expired Documents:</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; ${summary.expiredDocuments > 0 ? 'color: #c53030;' : ''}">
                ${summary.expiredDocuments}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px;">
                <strong>Documents Expiring (30 days):</strong>
              </td>
              <td style="padding: 10px; text-align: right; ${summary.expiringDocuments > 0 ? 'color: #dd6b20;' : ''}">
                ${summary.expiringDocuments}
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Log in to the Contract Management System to review these items.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: `Daily Summary for ${summary.date}: ${summary.newOccurrences} new occurrences, ${summary.missingAllocations} missing allocations, ${summary.expiredDocuments} expired documents, ${summary.expiringDocuments} expiring soon.`,
    });
  }
}

export const emailService = new EmailService();
