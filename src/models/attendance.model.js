import mongoose, { Schema } from "mongoose"

const attendanceSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Emp"
    },
    date: {
        type: String,
        unique:false
    },
    checkInTime: {
        type: Date,
        required: true
    },
    checkOutTime: {
        type: Date,
        required:true
    },
    workHours: {
        type: Number
    },
    notes:{
        type : String
    }
}, { timestamps: true })


export const Attendance = mongoose.model("Attendance", attendanceSchema)