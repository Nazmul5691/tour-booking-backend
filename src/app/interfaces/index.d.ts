import { JwtPayload } from "jsonwebtoken";


//create custom type for express.js
declare global {
    namespace Express {
        interface Request {
            user: JwtPayload
        }
    }
}



// if it does not work add this in tsconfig.json file  - "include": ["./src/app/interfaces/index.d.ts"]   