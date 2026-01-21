import Document from "../models/Document.js"
// Đọc file hệ thống
import path from "path";
// Dùng fs.existsSync để kiểm tra file có tồn tại
import fs from "fs";


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
    const { title, description } = req.body
    // Kiểm tra dữ liệu đầu vào
    if (!title || !req.files?.file) {
      return res.status(400).json({ error: "Missing title or file" })
    }
    // Kiểm tra user đã đăng nhập
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }
    // Lấy file và thumbnail
    const file = req.files.file[0]
    const thumbnail = req.files.thumbnail?.[0]
    // Tạo document mới
    const document = await Document.create({
      title,
      description,
      file_url: `/uploads/documents/${file.filename}`,// lưu đường dẫn tương đối
      thumbnail: thumbnail
        ? `/uploads/documents/thumbnails/${thumbnail.filename}`// lưu đường dẫn tương đối
        : null,
      created_by: req.userId,
    })

    return res.status(201).json({ document })
  } catch (error) {
    console.error("CREATE DOCUMENT ERROR:", error)
    return res.status(500).json({ error: error.message })
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
