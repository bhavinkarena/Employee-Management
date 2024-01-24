import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentEmp,
  getEmpDetails,
  loginEmp,
  logoutEmp,
  onDOBToday,
  registerEmp,
  updateEmpDetails,
  updateProfileImage,
} from "../controllers/employee.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/emp/register").post(
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  registerEmp
);

router.route("/emp/login").get(loginEmp);
router.route("/emp/getemp/:id").get(getEmpDetails);
router.route("/emp/logout").post(verifyJWT, logoutEmp);
router.route("/emp/profile").get(verifyJWT, getCurrentEmp);
router.route("/emp/changepassword").put(verifyJWT, changeCurrentPassword);
router.route("/emp/updateempdetails").put(verifyJWT, updateEmpDetails);
router.route("/emp/birthday").get(verifyJWT, onDOBToday);
router.route("/emp/updateimage").put(verifyJWT,upload.single("profileImage"), updateProfileImage);

export default router;
