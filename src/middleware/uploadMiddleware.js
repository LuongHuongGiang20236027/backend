// Middleware xử lý upload file
import multer from "multer";
// Hỗ trợ đường dẫn và hệ thống file
import path from "path";
// Hỗ trợ hệ thống file
import fs from "fs";

// Cấu hình storage
const storage = multer.diskStorage({
    // Nơi lưu trữ file
    destination: (req, file, cb) => {
        // Xác định thư mục lưu trữ dựa trên fieldname
        let uploadPath = "uploads";
        // Tạo thư mục tương ứng nếu không tồn tại
        if (file.fieldname === "avatar") {
            uploadPath = "uploads/avatars";
        }
        else if (file.fieldname === "thumbnail") {
            uploadPath = "uploads/documents/thumbnails";
        }
        else if (file.fieldname === "file") {
            uploadPath = "uploads/documents";
        }
        // Tạo thư mục nếu chưa tồn tại
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    // Tên file
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất
        const ext = path.extname(file.originalname);
        // Tên file: timestamp-random.ext
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});

// Lọc file upload
const fileFilter = (req, file, cb) => {
    // PDF cho tài liệu
    if (file.fieldname === "file") {
        // Chỉ cho phép file PDF
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Chỉ cho phép file PDF"), false);
    }
    // Ảnh cho avatar và thumbnail
    else if (["avatar", "thumbnail"].includes(file.fieldname)) {
        // Chỉ cho phép file ảnh
        const allowedImages = ["image/jpeg", "image/png", "image/jpg"];
        // Nếu đúng loại ảnh
        if (allowedImages.includes(file.mimetype)) cb(null, true);
        // Nếu không đúng loại ảnh
        else cb(new Error("File ảnh không hợp lệ"), false);
    }

    else cb(new Error("Field upload không hợp lệ"), false);
};

export const upload = multer({ storage, fileFilter });
