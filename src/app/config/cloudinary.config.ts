
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */



import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/appError";
import stream from "stream";




cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
})


export const uploadBufferToCloudinary = async (buffer: Buffer, fileName: string): Promise<UploadApiResponse> => {
    try {
        console.log("📤 [CLOUDINARY] Starting upload...");
        console.log("📤 [CLOUDINARY] File name:", fileName);
        console.log("📤 [CLOUDINARY] Buffer size:", buffer.length, "bytes");

        return new Promise((resolve, reject) => {

            const public_id = `pdf/${fileName}-${Date.now()}`

            console.log("📤 [CLOUDINARY] Public ID:", public_id);

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "raw", // CRITICAL: Use "raw" for PDFs, not "auto"
                    public_id: public_id,
                    folder: "pdf",
                    format: "pdf"
                },
                (error, result) => {
                    if (error) {
                        console.error("❌ [CLOUDINARY] Upload error:", error);
                        return reject(new AppError(500, `Cloudinary upload failed: ${error.message}`));
                    }
                    
                    if (!result) {
                        console.error("❌ [CLOUDINARY] No result returned");
                        return reject(new AppError(500, "Cloudinary upload returned no result"));
                    }

                    console.log("✅ [CLOUDINARY] Upload successful!");
                    console.log("✅ [CLOUDINARY] URL:", result.secure_url);
                    console.log("✅ [CLOUDINARY] Public ID:", result.public_id);
                    console.log("✅ [CLOUDINARY] Format:", result.format);
                    console.log("✅ [CLOUDINARY] Bytes:", result.bytes);
                    
                    resolve(result);
                }
            );

            // Pipe the buffer to upload stream
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);
            bufferStream.pipe(uploadStream);

        })

    } catch (error: any) {
        console.error("❌ [CLOUDINARY] Exception:", error);
        throw new AppError(500, `Error uploading file: ${error.message}`)
    }
}



export const deleteImageFromCLoudinary = async (url: string) => {
    try {
        //https://res.cloudinary.com/djzppynpk/image/upload/v1753126572/ay9roxiv8ue-1753126570086-download-2-jpg.jpg

        const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;

        const match = url.match(regex);

        console.log({ match });

        if (match && match[1]) {
            const public_id = match[1];
            await cloudinary.uploader.destroy(public_id)
            console.log(`File ${public_id} is deleted from cloudinary`);

        }
    } catch (error: any) {
        throw new AppError(401, "Cloudinary image deletion failed", error.message)
    }
}



export const cloudinaryUpload = cloudinary

