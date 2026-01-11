import Document from "../models/Document.js"
import path from "path";
import fs from "fs";      // ✅ thêm dòng này
export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll()
    res.json({ documents })
  } catch (error) {
    console.error("Get documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params
    const document = await Document.findById(id)

    if (!document) {
      return res.status(404).json({ error: "Document not found" })
    }

    // Check if user liked this document
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

export const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.findByCreator(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get my documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}


export const getLikedDocuments = async (req, res) => {
  try {
    const documents = await Document.findLikedByUser(req.userId)
    res.json({ documents })
  } catch (error) {
    console.error("Get liked documents error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const createDocument = async (req, res) => {
  try {
    const { title, description } = req.body

    if (!title || !req.files?.file) {
      return res.status(400).json({ error: "Missing title or file" })
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const file = req.files.file[0]
    const thumbnail = req.files.thumbnail?.[0]

    const document = await Document.create({
      title,
      description,
      file_url: `/uploads/documents/${file.filename}`,
      thumbnail: thumbnail
        ? `/uploads/documents/thumbnails/${thumbnail.filename}`
        : null,
      created_by: req.userId,
    })

    return res.status(201).json({ document })
  } catch (error) {
    console.error("❌ CREATE DOCUMENT ERROR:", error)
    return res.status(500).json({ error: error.message })
  }
}



export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params

    // Check if document exists and user owns it
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

export const toggleLike = async (req, res) => {
  try {
    const { document_id } = req.body

    if (!document_id) {
      return res.status(400).json({ error: "Missing document_id" })
    }

    const isLiked = await Document.toggleLike(document_id, req.userId)

    // Get updated like count
    const document = await Document.findById(document_id)

    res.json({ isLiked, likeCount: document.like_count })
  } catch (error) {
    console.error("Toggle like error:", error)
    res.status(500).json({ error: "Internal server error" })
  }


}


export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Đường dẫn tuyệt đối tới file trong backend/uploads/documents
    const filePath = path.join(
      "D:\\my-web\\backend\\uploads\\documents",
      path.basename(document.file_url) // lấy tên file thôi
    );

    console.log("DOWNLOAD PATH =", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Tải về với tên file gốc hoặc tên document + extension
    const originalName = document.title + path.extname(filePath);

    return res.download(filePath, originalName);
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ message: "Download failed" });
  }
};
