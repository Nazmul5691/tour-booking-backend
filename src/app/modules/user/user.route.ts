
import { Router } from "express";
import { updateUserStatus, UserControllers } from "./user.controller";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "./user.interface";



const router = Router();


// /api/v1/user
router.post("/register", validateRequest(createUserZodSchema), UserControllers.createUser);
router.post("/create-admin", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), UserControllers.createAdmin);
router.get("/all-users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getAllUsers);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);
router.get("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.getSingleUser);
router.patch("/:id", validateRequest(updateUserZodSchema), checkAuth(...Object.values(Role)), UserControllers.updateUser);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), UserControllers.deleteUser);
router.delete("/:id", checkAuth(Role.SUPER_ADMIN), UserControllers.deleteAdmin);
router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    updateUserStatus
);

export const UserRoutes = router;