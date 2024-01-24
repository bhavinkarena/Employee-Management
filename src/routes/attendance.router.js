import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createAttendance, getCurrentEmpAttendance, getEmpAttendance } from "../controllers/attendance.controller.js";
const router = Router()

router.route("/attendance/createattendance").post(verifyJWT,createAttendance)
router.route("/attendance/getcurrentempattendance").get(verifyJWT,getCurrentEmpAttendance)
router.route("/attendance/getempattendance/:id").get(verifyJWT,getEmpAttendance)

export default router   