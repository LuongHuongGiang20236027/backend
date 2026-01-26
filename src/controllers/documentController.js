import Document from "../models/Document.js"
// Đọc file hệ thống
import path from "path";
// Dùng fs.existsSync để kiểm tra file có tồn tại
import fs from "fs";
import { uploadToCloudinary, getResourceType } from "../middleware/uploadMiddleware.js"


// Lấy tất cả tài liệu
export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll()
    res.json({ documents })
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tài liệu theo ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params
    const document = await Document.findById(id)
    // Kiểm tra tồn tại
    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }
    // Kiểm tra user đã thích chưa
    if (req.userId) {
      const isLiked = await Document.isLikedByUser(id, req.userId)
      document.isLiked = isLiked
    }

    res.json({ document })
  } catch (error) {
    console.error("Get document error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy danh sách tài liệu của user hiện tại
export const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.findByCreator(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get my documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy danh sách tài liệu đã thích của user hiện tại
export const getLikedDocuments = async (req, res) => {
  try {
    const documents = await Document.findLikedByUser(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get liked documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Tạo tài liệu mới
export const createDocument = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { title, description } = req.body

    if (!title || !req.files?.file?.[0]) {
      return res.status(400).json({ error: "Missing title or file" })
    }

    const file = req.files.file[0]
    const thumbnail = req.files.thumbnail?.[0]

    // Xác định loại file (PDF hay VIDEO)
    const resourceType = getResourceType(file.mimetype)

    // Upload PDF hoặc VIDEO
    const fileUpload = await uploadToCloudinary(
      file.buffer,
      "documents",
      resourceType
    )

    // Upload thumbnail nếu có
    let thumbnailUrl = null
    if (thumbnail) {
      const thumbUpload = await uploadToCloudinary(
        thumbnail.buffer,
        "documents/thumbnails",
        "image"
      )
      thumbnailUrl = thumbUpload.secure_url
    }

    const document = await Document.create({
      title,
      description,
      file_url: fileUpload.secure_url,
      thumbnail: thumbnailUrl,
      created_by: req.userId,
    })

    return res.status(201).json({ document })
  } catch (error) {
    console.error("CREATE DOCUMENT ERROR:", error)
    return res.status(500).json({ error: "Upload failed" })
  }
}


// Xoá tài liệu
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params

    // Kiểm tra tồn tại và quyền sở hữu
    const document = await Document.findById(id)
    // Kiểm tra tồn tại
    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }
    // Chỉ cho xoá nếu là người tạo tài liệu
    if (document.created_by !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    await Document.delete(id)
    res.json({ success: true })
  } catch (error) {
    console.error("Delete document error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Thích / bỏ thích tài liệu
export const toggleLike = async (req, res) => {
  try {
    const { document_id } = req.body
    // Kiểm tra dữ liệu đầu vào
    if (!document_id) {
      return res.status(400).json({ error: "Missing document_id" })
    }
    // Thích / bỏ thích
    const isLiked = await Document.toggleLike(document_id, req.userId)
    // Lấy số lượt thích hiện tại
    const document = await Document.findById(document_id)
    // Trả về kết quả
    res.json({ isLiked, likeCount: document.like_count })
  } catch (error) {
    console.error("Toggle like error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Tải tài liệu
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params
    const document = await Document.findById(id)

    if (!document) {
      return res.status(404).json({ message: "Document not found" })
    }

    const fileName = path.basename(document.file_url)

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "documents",
      fileName
    )

    console.log("DOWNLOAD PATH =", filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" })
    }

    const originalName =
      document.title + path.extname(filePath)

    return res.download(filePath, originalName)
  } catch (err) {
    console.error("Download error:", err)
    return res.status(500).json({ message: "Download failed" })
  }
}

// 🔍 Tìm kiếm tài liệu
export const searchDocuments = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || !q.trim()) {
      return res.json({ documents: [] })
    }

    const documents = await Document.search(q)
    res.json({ documents })
  } catch (error) {
    console.error("Search documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

