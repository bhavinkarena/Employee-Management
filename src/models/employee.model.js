import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const empSchema = new Schema(
    {
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
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
            validate: {
                validator: function (v) {
                  return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); 
                },
                message: (props) => `${props.value} is not a valid email!`,
              },
        },
        profileImage: {
            type: String, // cloudinary url
            require:true,
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        phone:{
            type: String,
            required:true,
            validate: {
                validator: function (v) {
                  return /^[a-zA-Z0-9]{3,30}$/.test(v); 
                },
                message: (props) => `${props.value} is not a valid Password!`,
              },
            
        },
        role:{
            type: String,
            
        },
        favorite:{
            type: Boolean,
            default:false
        },
        DOB:{
            type:Date,
            required: true

        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

empSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

empSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

empSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            phone: this.phone,
            firstName: this.firstName,
            lastName: this.lastName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
empSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Emp = mongoose.model("Emp", empSchema)