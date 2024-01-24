import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Emp } from "../models/employee.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateAccessAndRefereshTokens = async (empId) => {
  try {
    const emp = await Emp.findById(empId);
    const accessToken = emp.generateAccessToken();
    const refreshToken = emp.generateRefreshToken();

    emp.refreshToken = refreshToken;
    await emp.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerEmp = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { firstname, lastname, DOB, phone, email, favorite, password, role } =
    req.body;
  //console.log("email: ", email);

  if (
    [firstname, DOB, phone, email, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedEmp = await Emp.findOne({
    $or: [{ phone }, { email }],
  });

  if (existedEmp) {
    throw new ApiError(
      409,
      "Employee with email or phone number already exists"
    );
  }
  //console.log(req.files);

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.profileImage[0]?.path;
  let flag = false;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.profileImage) &&
    req.files.profileImage.length > 0
  ) {
    coverImageLocalPath = req.files.profileImage[0].path;
    console.log(coverImageLocalPath);
  } else {
    flag = true;
    coverImageLocalPath = path.join(__dirname, "..", "static", "profile.jpg");
    console.log(coverImageLocalPath);
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath)
  const profileimage = await uploadOnCloudinary(coverImageLocalPath, flag);
  // console.log(profileimage)

  const emp = await Emp.create({
    firstname,
    lastname,
    DOB,
    phone,
    email,
    profileImage: profileimage?.url || "",
    favorite,
    password,
    role,
  });
  // console.log(emp)
  const createdUser = await Emp.findById(emp._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "Employee registered Successfully")
    );
});

const loginEmp = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie
  const { email, password } = req.body;
  console.log(email);
  if (!email) {
    throw new ApiError(400, "email is required");
  }
  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")
  // }
  const emp = await Emp.findOne({ email });
  if (!emp) {
    throw new ApiError(404, "Employee does not exist");
  }
  const isPasswordValid = await emp.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid employee credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    emp._id
  );
  const loggedInUser = await Emp.findById(emp._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          emp: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Employee logged In Successfully"
      )
    );
});

const logoutEmp = asyncHandler(async (req, res) => {
  await Emp.findByIdAndUpdate(
    req.emp._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Employee logged Out"));
});

// const refreshAccessToken = asyncHandler(async (req, res) => {
//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

//     if (!incomingRefreshToken) {
//         throw new ApiError(401, "unauthorized request")
//     }

//     try {
//         const decodedToken = jwt.verify(
//             incomingRefreshToken,
//             process.env.REFRESH_TOKEN_SECRET
//         )

//         const user = await User.findById(decodedToken?._id)

//         if (!user) {
//             throw new ApiError(401, "Invalid refresh token")
//         }

//         if (incomingRefreshToken !== user?.refreshToken) {
//             throw new ApiError(401, "Refresh token is expired or used")

//         }

//         const options = {
//             httpOnly: true,
//             secure: true
//         }

//         const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

//         return res
//             .status(200)
//             .cookie("accessToken", accessToken, options)
//             .cookie("refreshToken", newRefreshToken, options)
//             .json(
//                 new ApiResponse(
//                     200,
//                     { accessToken, refreshToken: newRefreshToken },
//                     "Access token refreshed"
//                 )
//             )
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid refresh token")
//     }

// })

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const emp = await Emp.findById(req.emp?._id);

  const isPasswordCorrect = await emp.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  emp.password = newPassword;
  await emp.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentEmp = asyncHandler(async (req, res) => {
  const currentEmp = await Emp.findById(req.emp._id).select(
    "firstname lastname email phone profileImage role DOB"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, currentEmp, "Employee fetched successfully"));
});

const onDOBToday = asyncHandler(async (req, res) => {
  // const today = moment().format('MM-DD');
  // const birthdayEmployees = await Emp.find({
  //     $expr: {
  //         $eq: [
  //             { $concat: [{ $substrCP: ['$DOB', 5, 2] }, '-', { $substrCP: ['$DOB', 8, 2] }] },
  //             today,
  //         ],
  //     },
  // });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(today);

  const day = today.getDate();
  const month = today.getMonth() + 1;

  const birthdayEmployees = await Emp.find({
    $expr: {
      $and: [
        { $eq: [{ $dayOfMonth: "$DOB" }, day] },
        { $eq: [{ $month: "$DOB" }, month] },
      ],
    },
  }).select("firstname lastname phone profileImage DOB role");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        birthdayEmployees,
        "Employees with birthdays today fetched successfully"
      )
    );
});

const updateEmpDetails = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, phone, role, DOB } = req.body;

  const emp = await Emp.findByIdAndUpdate(
    req.emp?._id,
    {
      $set: {
        firstname:firstname,
        lastname:lastname,
        DOB:DOB,
        phone:phone,
        email:email,
        role:role,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, emp, "Account details updated successfully"));
});

const updateProfileImage = asyncHandler(async (req, res) => {
  let profileImageLocalPath = req.file?.path;
  let flag = false;
  if (!profileImageLocalPath) {
    flag = true;
    profileImageLocalPath = path.join(__dirname, "..", "static", "profile.jpg");
    console.log(profileImageLocalPath);
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath, flag);

  if (!profileImage.url) {
    throw new ApiError(400, "Error while uploading on profileImage");
  }

  const emp = await Emp.findByIdAndUpdate(
    req.emp?._id,
    {
      $set: {
        profileImage: profileImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, emp, "Profile image updated successfully"));
});

const getEmpDetails = asyncHandler(async (req, res) => {
    try {
      const EmpId = req.params.id;
      const emp = await Emp.find({ _id: EmpId });
  
      if(!emp){
        throw new ApiError(400,"Employee not Found")
      }
  
      return res.status(200).json(new ApiResponse(200, emp, "Employee records retrieved successfully"));
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      } else {
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

export {
  registerEmp,
  loginEmp,
  logoutEmp,
  changeCurrentPassword,
  getCurrentEmp,
  onDOBToday,
  updateProfileImage,
  updateEmpDetails,
  getEmpDetails
};
