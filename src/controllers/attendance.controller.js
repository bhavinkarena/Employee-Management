import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Emp } from "../models/employee.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Attendance } from "../models/attendance.model.js";
import { format } from "date-fns";

const createAttendance = asyncHandler(async (req, res) => {
  try {
    const { checkInTime, checkOutTime, notes } = req.body;
    
    const parsedCheckInTime = new Date(checkInTime);
    const parsedCheckOutTime = new Date(checkOutTime);
    const currentDate = format(new Date(), "dd-MM-yyyy");

    if (isNaN(parsedCheckInTime) || isNaN(parsedCheckOutTime)) {
      throw new ApiError(400, "Invalid date format");
    }

    const currentEmp = await Emp.findById(req.emp?._id);
    if (!currentEmp) {
      throw new ApiError(404, "Employee not found");
    }

    const existingAttendance = await Attendance.findOne({
        $and: [
            { employeeId: currentEmp._id },
            { date: currentDate }
          ]
    });
    console.log(existingAttendance)

    if (existingAttendance) {
      throw new ApiError(400, "Attendance record for this date already exists");
    }

    const timeDiff = Math.abs(
      parsedCheckOutTime.getTime() - parsedCheckInTime.getTime()
    );
    const workHours = parseInt(Math.floor(timeDiff / (1000 * 60 * 60)));
    const attendance = await Attendance.create({
      employeeId: currentEmp._id,
      checkInTime: parsedCheckInTime,
      checkOutTime: parsedCheckOutTime,
      date:currentDate,
      workHours,
      notes,
    });
    console.log(attendance)
    if (!attendance) {
      throw new ApiError(
        500,
        "Something went wrong while registering the attendance"
      );
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          attendance,
          "Attendance record created successfully"
        )
      );
  } catch (error) {

    throw new ApiError(400,error,"internal server not running")
  }
});

const getCurrentEmpAttendance = asyncHandler(async (req, res) => {
  try {
    const currentEmpId = req.emp._id;

    const allAttendance = await Attendance.find({ employeeId: currentEmpId });

    if (!allAttendance || allAttendance.length === 0) {
      throw new ApiError(404, "No attendance records found for the current employee");
    }

    return res.status(200).json(new ApiResponse(200, allAttendance, "Attendance records retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

const getEmpAttendance = asyncHandler(async (req, res) => {
  try {
    const EmpId = req.params.id;
    const allAttendance = await Attendance.find({ employeeId: EmpId });

    if (!allAttendance || allAttendance.length === 0) {
      throw new ApiError(404, "No attendance records found for the current employee");
    }

    return res.status(200).json(new ApiResponse(200, allAttendance, "Attendance records retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

export { 
  createAttendance,
  getCurrentEmpAttendance,
  getEmpAttendance
 };
