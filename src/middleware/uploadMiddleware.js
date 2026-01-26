import multer from "multer"
import { v2 as cloudinary } from "cloudinary"

//Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

//Multer storage
const storage = multer.memoryStorage()

// File filter
const fileFilter = (req, file, cb) => {
    // File tài liệu: PDF hoặc VIDEO
    if (file.fieldname === "file") {
        const allowedDocs = [
            "application/pdf",
            "video/mp4",
            "video/mkv",
            "video/webm",
            "video/quicktime" // .mov
        ]

        if (allowedDocs.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Chỉ cho phép PDF hoặc VIDEO"), false)
        }
    }
    // Ảnh cho avatar và thumbnail
    else if (["avatar", "thumbnail"].includes(file.fieldname)) {
        const allowedImages = ["image/jpeg", "image/png", "image/jpg"]
        if (allowedImages.includes(file.mimetype)) cb(null, true)
        else cb(new Error("File ảnh không hợp lệ"), false)
    }
    else cb(new Error("Field upload không hợp lệ"), false)
}


// Upload lên Cloudinary
export const uploadToCloudinary = (buffer, folder, resourceType = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        )

        stream.end(buffer)
    })
}


export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB
    }
})

export const getResourceType = (mimetype) => {
    if (mimetype.startsWith("video")) return "video"
    return "raw" // PDF
}

