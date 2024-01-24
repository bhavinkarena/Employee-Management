import mongoose, { Schema } from "mongoose"

const leaveSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: "Emp"
    },
    firstname: {
        type: String,
        required: true,
        lowercase: true, 
        index: true
    },
    lastname: {
        type: String,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        lowecase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
        required:true
    },
    leaveType: {
        type: String,
        enum: ['Casual Leave', 'Earned Leave', 'Leave Without Pay', 'Paternity Leave', 'Sabbatical Leave', 'Sick Leave'],
        required: true
    },
    leaveStatus:{
        type : String,
        enum: ['Pending', 'Approved', 'Not Approved'],
        default  : "Pending"

    },

    date: {
        type: Date,
        required: true
    },

    reason: {
        type: String,
        required: true
    }

}, { timestamps: true })

export const Leave = mongoose.model("Leave", leaveSchema)