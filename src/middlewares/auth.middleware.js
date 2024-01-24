import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Emp } from "../models/employee.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const emp = await Emp.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!emp) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.emp = emp;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});


