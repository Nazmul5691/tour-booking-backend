/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from 'resend'
import { envVars } from '../config/env'
import path from 'path'
import ejs from 'ejs'
import fs from 'fs'

// Initialize Resend
const resend = new Resend(envVars.EMAIL_SENDER.RESEND_API_KEY)

console.log('✅ Resend email service is ready');

interface SendEmailOptions {
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, any>
    attachments?: {
        filename: string,
        content: Buffer | string,
        contentType: string
    }[]
}

export const sendEmail = async ({ 
    to, 
    subject, 
    templateName, 
    templateData, 
    attachments 
}: SendEmailOptions): Promise<boolean> => {

    try {
        // Load email template
        const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`)
        
        if (!fs.existsSync(templatePath)) {
            console.error(`❌ Template not found: ${templatePath}`);
            return false;
        }

        const html = await ejs.renderFile(templatePath, templateData)

        // Prepare email data
        const emailData: any = {
            from: 'Tour Booking <onboarding@resend.dev>',
            to: to,
            subject: subject,
            html: html,
        }

        // Add attachments if any
        if (attachments && attachments.length > 0) {
            emailData.attachments = attachments.map(attachment => ({
                filename: attachment.filename,
                content: Buffer.isBuffer(attachment.content) 
                    ? attachment.content 
                    : Buffer.from(attachment.content),
            }))
        }

        // Send email
        const { data, error } = await resend.emails.send(emailData)

        if (error) {
            console.error(`❌ Resend email failed to ${to}:`, error);
            return false;
        }

        console.log(`✅ Email sent via Resend to ${to}`);
        console.log(`📧 Email ID: ${data?.id}`);
        return true;

    } catch (error: any) {
        console.error(`❌ Email sending failed to ${to}`);
        console.error(`📛 Error:`, error.message);
        return false;
    }
}






