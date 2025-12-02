/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import AppError from "../../errorHelpers/appError";
import { User } from "../user/user.model";
import httpStatus from 'http-status-codes';
import bcryptjs from 'bcryptjs';
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { IAuthProvider, IsActive } from "../user/user.interface";
import jwt from 'jsonwebtoken'
import { sendEmail } from "../../utils/sendEmail";




// const credentialsLogin = async (payload: Partial<IUser>) => {

//     const { email, password } = payload;

//     const isUserExit = await User.findOne({ email });

//     if (!isUserExit) {
//         throw new AppError(httpStatus.BAD_REQUEST, "Email does not exist")
//     }

//     const isPasswordMatch = await bcryptjs.compare(password as string, isUserExit.password as string);

//     if (!isPasswordMatch) {
//         throw new AppError(httpStatus.BAD_REQUEST, "Incorrect Password")
//     }


//     // const jwtPayload = {
//     //     userId : isUserExit._id,
//     //     email: isUserExit.email,
//     //     role: isUserExit.role
//     // }

//     // // const accessToken = jwt.sign(jwtPayload, "secret", {expiresIn: "1d"})
//     // const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

//     // const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)

//     const userTokens = createUserTokens(isUserExit);

//     // delete isUserExit.password
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const { password: pass, ...rest } = isUserExit.toObject();

//     return {
//         // email: isUserExit.email
//         accessToken: userTokens.accessToken,
//         refreshToken: userTokens.refreshToken,
//         user: rest
//     }


// }


const getNewAccessToken = async (refreshToken: string) => {
    const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken)

    return {
        accessToken: newAccessToken
    }
}


const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {

    const user = await User.findById(decodedToken.userId)

    const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user!.password as string)

    if (!isOldPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match")
    }

    user!.password = await bcryptjs.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND))

    user!.save();

}



const setPassword = async (userId: string, plainPassword: string) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(404, "User not found")
    }

    if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
    }

    const hashedPassword = await bcryptjs.hash(
        plainPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    const credentialProvider: IAuthProvider = {
        provider: "credentials",
        providerId: user.email
    }

    const auths: IAuthProvider[] = [...user.auths, credentialProvider]

    user.password = hashedPassword

    user.auths = auths

    await user.save()
}


const forgotPassword = async (email: string) => {

    const isUserExit = await User.findOne({ email });

    if (!isUserExit) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist")
    }
    if (!isUserExit.isVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
    }
    if (isUserExit.isActive === IsActive.BLOCKED || isUserExit.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExit.isActive}`)
    }
    if (isUserExit.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
    }


    const jwtPayload = {
        userId: isUserExit._id,
        email: isUserExit.email,
        role: isUserExit.role
    }

    const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, { expiresIn: "10m" })

    const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExit._id}&token=${resetToken}`

    sendEmail({
        to: isUserExit.email,
        subject: "Password Reset",
        templateName: "forgetPassword",      //make sure to give the same name in utils/template/(forgetPassword)
        templateData: {
            name: isUserExit.name,
            resetUILink
        }
    })

    /**
     * http://localhost:5173/reset-password?id=6899b136e10db37fb097ed38&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk5YjEzNmUxMGRiMzdmYjA5N2VkMzgiLCJlbWFpbCI6Im5hem11bGlzbGFtNTY5MUBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc1NDkwMzAwMSwiZXhwIjoxNzU0OTAzNjAxfQ.GLp-lmLzmau9WRhgjojWj2GyEtDAGj2XOpWrDqQnMPA
     */

}


// const resetPassword = async ( newPassword: string, id: string, decodedToken: JwtPayload) => {
const resetPassword = async (payload: Record<string, any>, decodedToken: JwtPayload) => {
    if (payload.id != decodedToken.userId) {
        throw new AppError(401, "You can not reset your password")
    }

    const isUserExist = await User.findById(decodedToken.userId)
    if (!isUserExist) {
        throw new AppError(401, "User does not exist")
    }

    const hashedPassword = await bcryptjs.hash(
        payload.newPassword,
        Number(envVars.BCRYPT_SALT_ROUND)
    )

    isUserExist.password = hashedPassword;

    await isUserExist.save()
}




export const AuthServices = {
    // credentialsLogin,
    getNewAccessToken,
    resetPassword,
    setPassword,
    changePassword,
    forgotPassword
}