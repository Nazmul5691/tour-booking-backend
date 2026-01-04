/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (_req: any, file: Express.Multer.File) => {
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

      return uniqueFileName;
    },
  },
});

export const multerUpload = multer({ storage });








// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { cloudinaryUpload } from "./cloudinary.config";

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinaryUpload,
//   params: {
//     public_id: (_req, file) => {
//       // Prefix with underscore since req is unused
//       const fileName = file.originalname
//         .toLowerCase()
//         .replace(/\s+/g, "-")
//         .replace(/\./g, "-")
//         // eslint-disable-next-line no-useless-escape
//         .replace(/[^a-z0-9\-\.]/g, "");

//       const uniqueFileName =
//         Math.random().toString(36).substring(2) +
//         "-" +
//         Date.now() +
//         "-" +
//         fileName;

//       return uniqueFileName;
//     },
//   },
// });

// export const multerUpload = multer({ storage: storage });







// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { cloudinaryUpload } from "./cloudinary.config";


// const storage = new CloudinaryStorage({
//     cloudinary: cloudinaryUpload,
//     params: {
//         public_id: (req, file) => {
//             // My Special.Image#!@.png => 4545adsfsadf-45324263452-my-image.png
//             // My Special.Image#!@.png => [My Special, Image#!@, png]

//             const fileName = file.originalname
//                 .toLowerCase()
//                 .replace(/\s+/g, "-") // empty space remove replace with dash
//                 .replace(/\./g, "-")
//                 // eslint-disable-next-line no-useless-escape
//                 .replace(/[^a-z0-9\-\.]/g, "") // non alpha numeric - !@#$

//             // const extension = file.originalname.split(".").pop()

//             // binary -> 0,1 hexa decimal -> 0-9 A-F base 36 -> 0-9 a-z
//             // 0.2312345121 -> "0.hedfa674338sasfamx" -> 
//             //452384772534
//             const uniqueFileName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileName

//             return uniqueFileName
//         }
//     }
// })

// export const multerUpload = multer({ storage: storage })