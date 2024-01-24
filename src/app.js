import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// app.use(express.json({limit: "16kb"}))
// app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))   
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

//routes import
import EmpRouter from './routes/employee.router.js'
import Leave from "./routes/leave.router.js"
import Attendance from "./routes/attendance.router.js"

//routes declaration
app.use("/api/v1", EmpRouter)
app.use("/api/v2",Leave)
app.use("/api/v3",Attendance)

// http://localhost:8000/api/v1/users/register

export { app }