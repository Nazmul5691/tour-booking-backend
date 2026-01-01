/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/appError";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpStatus from 'http-status-codes';
import bcryptjs from 'bcryptjs';
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/queryBuilder";
import { divisionSearchableFields } from "../division/division.constant";
import { userSearchableFields } from "./user.constant";


// const createUser = async (payload: Partial<IUser>) =>{

//     const {name, email}  = payload;

//         const user = await User.create({
//             name, 
//             email
//         })

//         return user;
// }




// create user
const createUser = async (payload: Partial<IUser>) => {

    const { email, password, ...rest } = payload;

    const isUserExit = await User.findOne({ email });

    if (isUserExit) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist")
    }

    const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));

    const authProvider: IAuthProvider = { provider: "credentials", providerId: email as string }

    const user = await User.create({
        email,
        password: hashedPassword,
        auths: [authProvider],
        ...rest
    })

    return user;
}



const createAdmin = async (payload: Partial<IUser>) => {

    const { email, password, role, ...rest } = payload;

    const isUserExit = await User.findOne({ email });

    if (isUserExit) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist")
    }

    const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));

    const authProvider: IAuthProvider = { provider: "credentials", providerId: email as string }

    const user = await User.create({
        email,
        password: hashedPassword,
        role: role ? role : Role.ADMIN,
        auths: [authProvider],
        ...rest
    })

    return user;
};



const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {

    /**
     * email - can not change
     * only name, phone,  address
     */

    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
        if (userId !== decodedToken.userId) {
            throw new AppError(401, "You are not authorized")
        }
    }


    const ifUserExists = await User.findById(userId);
    // const isPhoneNumberExits = await User.findOne(phone)

    if (!ifUserExists) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (decodedToken.role === Role.ADMIN && ifUserExists.role === Role.SUPER_ADMIN) {
        throw new AppError(401, "You are not authorized")
    }


    if (payload.phone) {
        const isPhoneNumberExits = await User.findOne({ phone: payload.phone });

        if (isPhoneNumberExits && isPhoneNumberExits._id.toString() !== userId) {
            throw new AppError(httpStatus.BAD_REQUEST, "This phone number is already taken");
        }
    }

    if (payload.role) {
        if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        }

        // if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
        //     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        // }
    }

    if (payload.isActive || payload.isDeleted || payload.isVerified) {
        if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
        }
    }

    const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true })

    return newUpdatedUser;

}


// get all users
// const getAllUsers = async () => {
//     const users = await User.find();

//     const totalUsers = await User.countDocuments()

//     return {
//         data: users,
//         meta: {
//             total: totalUsers
//         }
//     };
// }



const getAllUsers = async (query: Record<string, string>) => {

    const queryBuilder = new QueryBuilder(User.find(), query)

    const usersData = await queryBuilder
        .search(userSearchableFields)
        .sort()
        .filter()
        .fields()
        .paginate()

    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
}


const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");

    return {
        data: user
    }
};


const getSingleUser = async (id: string) => {
    const user = await User.findById(id).select("-password");
    return {
        data: user
    }
};


const deleteUser = async (id: string) => {
    const user = await User.findByIdAndDelete(id);

    return null;

}
// const deleteAdmin = async (id: string) => {
//     const user = await User.findByIdAndDelete(id);

//     return null;

// }


// const deleteAdmin = async (id: string) => {
//     const user = await User.findById(id);

//     if (!user) {
//         throw new AppError(httpStatus.NOT_FOUND, "User not found");
//     }

//     if (user.role !== Role.SUPER_ADMIN) {
//         throw new AppError(
//             httpStatus.BAD_REQUEST,
//             "Only super admin can delete and admin"
//         );
//     }

//     await User.findByIdAndDelete(id);
//     return null;
// };


export const deleteAdminService = async (id: string, decodedToken: JwtPayload) => {
    const loggedInUserRole = decodedToken.role;

    if (loggedInUserRole !== Role.SUPER_ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "Only super admin can delete admins");
    }

    const user = await User.findById(id);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role !== Role.ADMIN) {
        throw new AppError(httpStatus.BAD_REQUEST, "You can only delete admins");
    }

    await User.findByIdAndDelete(id);

    return null;
};



export const updateUserStatusService = async (
    userId: string,
    isActive: IsActive,
    decodedToken: JwtPayload
) => {
    const user = await User.findById(userId);

    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    // ADMIN restrictions
    if (decodedToken.role === Role.ADMIN) {
        if (user.role === Role.SUPER_ADMIN) {
            throw new AppError(403, "Admin cannot modify super admin");
        }

        // ADMIN can only block or unblock users (toggle isActive)
        if (user.role === Role.USER) {
            user.isActive = isActive; // must be IsActive enum
            await user.save();
            return user;
        } else {
            throw new AppError(403, "Admin cannot modify other admins");
        }
    }

    // SUPER_ADMIN can update anyone's status
    user.isActive = isActive;
    await user.save();
    return user;
};



export const UserServices = {
    createUser,
    createAdmin,
    getAllUsers,
    getMe,
    getSingleUser,
    updateUser,
    deleteUser,
    updateUserStatusService,
    deleteAdminService
}