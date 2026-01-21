import Document from "../models/Document.js"
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js"

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

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    if (req.userId) {
      const isLiked = await Document.isLikedByUser(id, req.userId)
      document.isLiked = isLiked
    }

    return res.json({ document })
  } catch (error) {
    console.error("Get document error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tài liệu của user
export const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.findByCreator(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get my documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Lấy tài liệu đã thích
export const getLikedDocuments = async (req, res) => {
  try {
    const documents = await Document.findLikedByUser(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get liked documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Tạo tài liệu
export const createDocument = async (req, res) => {
  try {
    const { title, description } = req.body

    if (!title || !req.files?.file) {
      return res.status(400).json({ error: "Missing title or file" })
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    let fileUrl = null
    let thumbnailUrl = null

    // Upload PDF (PHẢI LÀ RAW)
    if (req.files.file?.[0]) {
      const fileResult = await uploadToCloudinary(
        req.files.file[0].buffer,
        "documents/files",
        "image"
      )
      fileUrl = fileResult.secure_url
    }

    // Upload thumbnail
    if (req.files.thumbnail?.[0]) {
      const thumbResult = await uploadToCloudinary(
        req.files.thumbnail[0].buffer,
        "documents/thumbnails",
        "image"
      )
      thumbnailUrl = thumbResult.secure_url
    }

    const document = await Document.create({
      title,
      description,
      file_url: fileUrl,
      thumbnail: thumbnailUrl,
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

    const document = await Document.findById(id)
    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

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

// Like / Unlike
export const toggleLike = async (req, res) => {
  try {
    const { document_id } = req.body

    if (!document_id) {
      return res.status(400).json({ error: "Missing document_id" })
    }

    const isLiked = await Document.toggleLike(document_id, req.userId)
    const document = await Document.findById(document_id)

    res.json({ isLiked, likeCount: document.like_count })
  } catch (error) {
    console.error("Toggle like error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Download
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params
    const document = await Document.findById(id)

    if (!document || !document.file_url) {
      return res.status(404).json({ message: "Document not found" })
    }

    const downloadUrl = document.file_url.replace(
      "/upload/",
      "/upload/fl_attachment/"
    )

    return res.json({ downloadUrl })
  } catch (err) {
    console.error("Download error:", err)
    return res.status(500).json({ message: "Download failed" })
  }
}
