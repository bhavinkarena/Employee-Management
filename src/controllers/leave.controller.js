import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Emp } from "../models/employee.model.js";
import { Leave } from "../models/leave.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const applyLeave = asyncHandler(async (req, res) => {
  const { email, leaveType, leaveStatus, date, reason } = req.body;
  if (
    [email, leaveType, leaveStatus, date, reason].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const currentEmp = await Emp.findById(req.emp?._id);
  if (!currentEmp) {
    throw new ApiError(404, "Employee not found");
  }
  const leave = await Leave.create({
    employeeId: currentEmp._id, 
    firstname: currentEmp.firstname,
    lastname: currentEmp.lastname,
    email: currentEmp.email,
    leaveType,
    leaveStatus,
    date,
    reason,
  });
  if (!leave) {
    throw new ApiError(500, "Something went wrong while apply the leave");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, leave, "Leave Apply Successfully"));
});

const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { leaveId, status } = req.body;

  if (!leaveId || !status) {
    throw new ApiError(400, "Leave ID and status are required");
  }

  if (!['Approved', 'Not Approved'].includes(status)) {
    throw new ApiError(400, "Invalid status. It should be 'Approved' or 'Not Approved'");
  }

  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new ApiError(404, "Leave not found");
  }

  leave.leaveStatus = status;
  await leave.save();

  return res.status(200).json(new ApiResponse(200, leave, "Leave status updated successfully"));
});

const onLeaveToday = asyncHandler(async (req, res) => {
  const allEmployees = await Emp.find();
  const employeeIds = allEmployees.map(emp => emp._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaves = await Leave.aggregate([
    {
      $match: {
        employeeId: { $in: employeeIds },
        leaveStatus: 'Approved',
        $or: [
          { date: today },
          { date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
        ],
      },
    },
    {
      $lookup: {
        from: 'emps', 
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employee',
      },
    },
    {
      $unwind: '$employee',
    },
    {
      $project: {
        _id: 0,
        'employee.leaveStatus': '$leaveStatus',
        'employee.firstname': 1,
        'employee.lastname': 1,
        'employee.email': 1,
        'employee.phone': 1,
        'employee.profileImage': 1,
      },
    },
  ]);
  

  return res.status(200).json(new ApiResponse(200, leaves, "Leaves for today fetched successfully"));
});

export {
  applyLeave,
  updateLeaveStatus,
  onLeaveToday
};
