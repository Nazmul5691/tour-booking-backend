import { Router } from "express";
import { GuideController } from "./guide.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { applySchema, createGuideZodSchema } from "./guide.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

// logged in USER can apply to become a guide
router.post(
    "/register",
    checkAuth(Role.USER),
    validateRequest(createGuideZodSchema),
    GuideController.registerGuide
);

// admin can view all guides
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    GuideController.getAllGuides
);


// Admin: list - view all applications
router.get("/guide-applications", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), GuideController.list);

// POST /api/v1/tours/:tourId/apply-guide
router.post(
    "/:tourId/apply-guide",
    checkAuth(Role.GUIDE, Role.USER), // allow guides (or users who are guides)
    validateRequest(applySchema),
    GuideController.apply
);



// Admin: approve - approve a guide application 
// router.patch("/guide-applications/:applicationId/approve", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), GuideController.approve);

// // Admin: reject
// router.patch("/guide-applications/:applicationId/reject", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), GuideController.reject);

router.patch(
    "/guide-applications/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    GuideController.updateApplicationStatus
);




router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.USER),
    GuideController.getSingleGuide
);


router.post(
    "/approvedStatus/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    GuideController.updateGuideStatus
)




export const GuideRoutes = router;
