/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";
import { Readable } from "stream";

// Manual Cloudinary Storage Implementation
const cloudinaryStorage: multer.StorageEngine = {
  _handleFile(
    _req: any,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void
  ) {
    // Generate unique filename
    const fileName = file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/\./g, "-")
      // eslint-disable-next-line no-useless-escape
      .replace(/[^a-z0-9\-\.]/g, "");

    const uniqueFileName =
      Math.random().toString(36).substring(2) +
      "-" +
      Date.now() +
      "-" +
      fileName;

    // ✅ Detect if file is PDF
    const isPDF = file.mimetype === "application/pdf";

    // Upload to Cloudinary
    const uploadStream = cloudinaryUpload.uploader.upload_stream(
      {
        public_id: uniqueFileName,
        resource_type: "auto",
        folder: "tour-images",
        // ✅ Add async for PDFs
        ...(isPDF && { 
          async: true
        }),
        // ✅ Only use quality:auto for images, not PDFs
        ...(!isPDF && { 
          quality: "auto" 
        })
      },
      (error, result) => {
        if (error) {
          return callback(error);
        }
        
        // Return file info
        callback(null, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: result?.public_id || uniqueFileName,
          path: result?.secure_url || "",
          size: result?.bytes || 0,
        } as any);
      }
    );

    // Pipe file stream to Cloudinary
    if (file.stream instanceof Readable) {
      file.stream.pipe(uploadStream);
    } else {
      callback(new Error("File stream is not readable"));
    }
  },

  _removeFile(
    _req: any,
    file: any,
    callback: (error: Error | null) => void
  ) {
    // Delete from Cloudinary
    if (file.filename) {
      cloudinaryUpload.uploader.destroy(file.filename, (error: any) => {
        callback(error || null);
      });
    } else {
      callback(null);
    }
  },
};

export const multerUpload = multer({ storage: cloudinaryStorage });




