import { envVars } from "../config/env";
import { IAuthProvider, IUser, Role } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import bcryptjs from "bcryptjs"

export const seedSuperAdmin = async() =>{
    try {
        const isSuperAdminExit = await User.findOne({email: envVars.SUPER_ADMIN_EMAIL});

        if(isSuperAdminExit){
            console.log("Super Admin already exists");
            return;
        }

        console.log("trying to create superAdmin...");

        const hashPassword = await bcryptjs.hash(envVars.SUPER_ADMIN_PASSWORD, Number(envVars.BCRYPT_SALT_ROUND));

        const authProvider: IAuthProvider = {
            provider: "credentials",
            providerId: envVars.SUPER_ADMIN_EMAIL

        }

        const payload: IUser = {
            name: "Super Admin",
            role: Role.SUPER_ADMIN,
            email: envVars.SUPER_ADMIN_EMAIL,
            password: hashPassword,
            phone: envVars.SUPER_ADMIN_PHONE,
            isVerified: true,
            auths: [authProvider],
        }

        const superAdmin = await User.create(payload);

        console.log("superAdmin successfully created");
        console.log(superAdmin);

    } catch (error) {
        console.log(error);
    }
}