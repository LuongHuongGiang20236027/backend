import multer from "multer"
import { v2 as cloudinary } from "cloudinary"

// =====================
// Cloudinary config
// =====================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// =====================
// Multer memory storage
// =====================
const storage = multer.memoryStorage()

// =====================
// File filter
// =====================
const fileFilter = (req, file, cb) => {
    // PDF cho tài liệu
    if (file.fieldname === "file") {
        if (file.mimetype === "application/pdf") cb(null, true)
        else cb(new Error("Chỉ cho phép file PDF"), false)
    }
    // Ảnh cho avatar và thumbnail
    else if (["avatar", "thumbnail"].includes(file.fieldname)) {
        const allowedImages = ["image/jpeg", "image/png", "image/jpg"]
        if (allowedImages.includes(file.mimetype)) cb(null, true)
        else cb(new Error("File ảnh không hợp lệ"), false)
    }
    else cb(new Error("Field upload không hợp lệ"), false)
}

// =====================
// Upload helper
// =====================
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

// =====================
// Multer export
// =====================
export const upload = multer({ storage, fileFilter })
