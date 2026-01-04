/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodeMailer from 'nodemailer'
import { envVars } from '../config/env'
import path from 'path'
import ejs from 'ejs'
import fs from 'fs'

// ✅ Port 587 use করুন (Render compatible)
const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // ✅ Changed to 587
    secure: false, // ✅ false for port 587
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
})

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
        console.error('Please check your email credentials');
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});

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
        const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`)
        
        if (!fs.existsSync(templatePath)) {
            console.error(`❌ Template not found: ${templatePath}`);
            console.log(`🔍 Available files in templates:`, fs.readdirSync(path.join(__dirname, 'templates')));
            return false;
        }

        const html = await ejs.renderFile(templatePath, templateData)

        const info = await transporter.sendMail({
            from: `Tour Booking <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map(attachment => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType
            }))
        })

        console.log(`✅ Email sent successfully to ${to}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

    } catch (error: any) {
        console.error(`❌ Email sending failed to ${to}`);
        console.error(`📛 Error code: ${error.code}`);
        console.error(`📛 Error message: ${error.message}`);
        
        if (error.code === 'ECONNECTION') {
            console.error('💡 Cannot connect to SMTP server');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('💡 Connection timeout - Check firewall/network');
        } else if (error.code === 'EAUTH') {
            console.error('💡 Authentication failed - Check email/password');
        }
        
        return false;
    }
}






// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import nodeMailer from 'nodemailer'
// import { envVars } from '../config/env'
// import path from 'path'
// import ejs from 'ejs'
// import fs from 'fs'

// const transporter = nodeMailer.createTransport({
//     service: 'gmail', // ✅ Gmail service use করুন (automatic host/port detection)
//     auth: {
//         user: envVars.EMAIL_SENDER.SMTP_USER,
//         pass: envVars.EMAIL_SENDER.SMTP_PASS
//     },
//     // ✅ Timeout settings
//     connectionTimeout: 15000, // 15 seconds
//     greetingTimeout: 15000,
//     socketTimeout: 15000
// })

// // ✅ SMTP connection verify করুন startup এ
// transporter.verify((error, success) => {
//     if (error) {
//         console.error('❌ SMTP Connection Error:', error.message);
//     } else {
//         console.log('✅ SMTP Server is ready to send emails');
//     }
// });

// interface SendEmailOptions {
//     to: string,
//     subject: string,
//     templateName: string,
//     templateData: Record<string, any>
//     attachments?: {
//         filename: string,
//         content: Buffer | string,
//         contentType: string
//     }[]
// }

// export const sendEmail = async ({ 
//     to, 
//     subject, 
//     templateName, 
//     templateData, 
//     attachments 
// }: SendEmailOptions): Promise<boolean> => {

//     try {
//         // Template path
//         const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`)
        
//         // Check if template exists
//         if (!fs.existsSync(templatePath)) {
//             console.error(`❌ Template not found: ${templatePath}`);
//             console.log(`🔍 Looking in: ${__dirname}/templates/`);
//             return false;
//         }

//         // Render template
//         const html = await ejs.renderFile(templatePath, templateData)

//         // Send email
//         const info = await transporter.sendMail({
//             from: `Tour Booking <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
//             to: to,
//             subject: subject,
//             html: html,
//             attachments: attachments?.map(attachment => ({
//                 filename: attachment.filename,
//                 content: attachment.content,
//                 contentType: attachment.contentType
//             }))
//         })

//         console.log(`✅ Email sent successfully to ${to}`);
//         console.log(`📧 Message ID: ${info.messageId}`);
//         return true;

//     } catch (error: any) {
//         console.error(`❌ Email sending failed to ${to}`);
//         console.error(`📛 Error: ${error.message}`);
        
//         // Detailed error logging
//         if (error.code === 'ECONNECTION') {
//             console.error('💡 Connection failed. Check SMTP credentials.');
//         } else if (error.code === 'ETIMEDOUT') {
//             console.error('💡 Connection timeout. Network/Firewall issue.');
//         } else if (error.code === 'EAUTH') {
//             console.error('💡 Authentication failed. Check App Password.');
//         } else if (error.code === 'EENVELOPE') {
//             console.error('💡 Invalid email address.');
//         }
        
//         return false;
//     }
// }









// /* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import nodeMailer from 'nodemailer'
// import { envVars } from '../config/env'
// import path from 'path'
// import ejs from 'ejs'
// import AppError from '../errorHelpers/appError'

// const transporter = nodeMailer.createTransport({
//     secure: true,
//     auth: {
//         user: envVars.EMAIL_SENDER.SMTP_USER,
//         pass: envVars.EMAIL_SENDER.SMTP_PASS
//     },
//     port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
//     host: envVars.EMAIL_SENDER.SMTP_HOST
// })


// interface SendEmailOptions {
//     to: string,
//     subject: string,
//     templateName: string,
//     templateData: Record<string, any>
//     attachments?: {
//         filename: string,
//         content: Buffer | string,
//         contentType: string
//     }[]
// }


// export const sendEmail = async ({ to, subject, templateName, templateData, attachments, }: SendEmailOptions) => {

//     try {
//         const templatePath = path.join(__dirname, `templates/${templateName}.ejs`)
//         const html = await ejs.renderFile(templatePath, templateData)

//         const info = await transporter.sendMail({
//             from: envVars.EMAIL_SENDER.SMTP_FROM,
//             to: to,
//             subject: subject,
//             html: html,
//             attachments: attachments?.map(attachment => ({
//                 filename: attachment.filename,
//                 content: attachment.content,
//                 contentType: attachment.contentType
//             }))
//         })

//         console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);

//     } catch (error: any) {
//         console.log("email sending error",error.message);
//         throw new AppError(401, "Email sending error")
//     }
// }