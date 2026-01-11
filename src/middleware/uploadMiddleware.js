import multer from "multer";
import path from "path";
import fs from "fs";

// Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "uploads";

        if (file.fieldname === "avatar") {
            uploadPath = "uploads/avatars";
        }
        else if (file.fieldname === "thumbnail") {
            uploadPath = "uploads/documents/thumbnails";
        }
        else if (file.fieldname === "file") {
            uploadPath = "uploads/documents";
        }

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});

// Filter
const fileFilter = (req, file, cb) => {
    // PDF cho tài liệu
    if (file.fieldname === "file") {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Chỉ cho phép file PDF"), false);
    }

    // Ảnh cho avatar & thumbnail
    else if (["avatar", "thumbnail"].includes(file.fieldname)) {
        const allowedImages = ["image/jpeg", "image/png", "image/jpg"];
        if (allowedImages.includes(file.mimetype)) cb(null, true);
        else cb(new Error("File ảnh không hợp lệ"), false);
    }

    else cb(new Error("Field upload không hợp lệ"), false);
};

export const upload = multer({ storage, fileFilter });
