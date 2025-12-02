/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { IsActive, Role } from "../modules/user/user.interface";
import { Strategy as LocalStrategy } from "passport-local";
import bcryptjs from 'bcryptjs';
// import AppError from "../errorHelpers/appError";
// import httpStatus from 'http-status-codes'



passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email: string, password: string, done) => {
            try {

                const isUserExit = await User.findOne({ email });

                // if (!isUserExit) {
                //     return done(null, false, { message: "User does not exist" })
                // }

                if (!isUserExit) {
                    return done("User does not exist")
                }

                if (!isUserExit.isVerified) {
                    // throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
                    return done("User does not verified")
                }
                if (isUserExit.isActive === IsActive.BLOCKED || isUserExit.isActive === IsActive.INACTIVE) {
                    // throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExit.isActive}`)
                    return done(`User is ${isUserExit.isActive}`)
                }
                if (isUserExit.isDeleted) {
                    // throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
                    return done("User is deleted")
                }

                const isGoogleAuthenticated = isUserExit.auths.some(providerObjects => providerObjects.provider == 'google')

                if (isGoogleAuthenticated && !isUserExit.password) {
                    return done(null, false, { message: "You have authenticated through Google. So if you want to login with credentials, then at first login with google and set a password for your Gmail and then you can login with email and password." })
                }

                const isPasswordMatch = await bcryptjs.compare(password as string, isUserExit.password as string);

                if (!isPasswordMatch) {
                    return done(null, false, { message: "Password does not match" })
                }

                return done(null, isUserExit)


            } catch (error) {
                console.log(error);
                done(error)
            }
        })
)



passport.use(
    new GoogleStrategy(
        {
            clientID: envVars.GOOGLE_CLIENT_ID,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET,
            callbackURL: envVars.GOOGLE_CALLBACK_URL
        },
        async (accessToken: string, refreshToken, profile: Profile, done: VerifyCallback) => {
            try {
                const email = profile.emails?.[0].value;

                if (!email) {
                    return done(null, false, { message: "No email found" })
                }

                // let user = await User.findOne({ email })
                let isUserExit = await User.findOne({ email })

                if (isUserExit && !isUserExit.isVerified) {
                    // throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
                    // return done("User does not verified")
                    return done(null, false, { message: "User does not verified" })
                }
                if (isUserExit && (isUserExit.isActive === IsActive.BLOCKED || isUserExit.isActive === IsActive.INACTIVE)) {
                    // throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExit.isActive}`)
                    return done(`User is ${isUserExit.isActive}`)
                }
                if (isUserExit && isUserExit.isDeleted) {
                    // throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
                    return done(null, false, { message: "User is deleted" })
                }

                // if (!user) {
                if (!isUserExit) {
                    // user = await User.create({
                    isUserExit = await User.create({
                        email,
                        name: profile.displayName,
                        picture: profile.photos?.[0].value,
                        role: Role.USER,
                        isVerified: true,
                        auths: [
                            {
                                provider: "google",
                                providerId: profile.id
                            }
                        ]
                    })
                }

                // return done(null, user)
                return done(null, isUserExit)

            } catch (error) {
                console.log("Google Strategy error", error);
                return done(error);
            }
        }
    )
)



// frontend localhost:5173/login?redirect=/booking -> localhost:5000/api/v1/auth/google?redirect=/booking -> passport -> Google OAuth Consent -> gmail login -> successful -> callback url localhost:5000/api/v1/auth/google/callback -> db store -> token

// Bridge == Google -> user db store -> token
//Custom -> email , password, role : USER, name... -> registration -> DB -> 1 User create
//Google -> req -> google -> successful : Jwt Token : Role , email -> DB - Store -> token - api access



passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
    done(null, user._id)
})


passport.deserializeUser(async (id: string, done: any) => {
    try {
        const user = await User.findById(id)
        done(null, user)

    } catch (error) {
        console.log(error);
        done(error)
    }
})