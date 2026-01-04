/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';

  interface CloudinaryStorageOptions {
    cloudinary: typeof cloudinary;
    params:
      | {
          folder?: string;
          format?: string;
          public_id?: (req: any, file: Express.Multer.File) => string;
          transformation?: object[];
          [key: string]: any;
        }
      | ((
          req: any,
          file: Express.Multer.File
        ) => {
          folder?: string;
          format?: string;
          public_id?: string;
          transformation?: object[];
          [key: string]: any;
        });
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(
      req: any,
      file: Express.Multer.File,
      callback: (error?: any, info?: Partial<Express.Multer.File>) => void
    ): void;
    _removeFile(
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null) => void
    ): void;
  }
}








// /* eslint-disable @typescript-eslint/no-explicit-any */
// declare module 'multer-storage-cloudinary' {
//   import { StorageEngine } from 'multer';
//   import { v2 as cloudinary } from 'cloudinary';

//   interface CloudinaryStorageOptions {
//     cloudinary: typeof cloudinary;
//     params:
//       | {
//           folder?: string;
//           format?: string;
//           public_id?: (req: Express.Request, file: Express.Multer.File) => string;
//           transformation?: object[];
//           [key: string]: any;
//         }
//       | ((
//           req: Express.Request,
//           file: Express.Multer.File
//         ) => {
//           folder?: string;
//           format?: string;
//           public_id?: string;
//           transformation?: object[];
//           [key: string]: any;
//         });
//   }

//   export class CloudinaryStorage implements StorageEngine {
//     constructor(options: CloudinaryStorageOptions);
//     _handleFile(
//       req: Express.Request,
//       file: Express.Multer.File,
//       callback: (error?: any, info?: Partial<Express.Multer.File>) => void
//     ): void;
//     _removeFile(
//       req: Express.Request,
//       file: Express.Multer.File,
//       callback: (error: Error | null) => void
//     ): void;
//   }
// }