import multer from "multer";

// Use memory storage instead of disk storage
// Files will be stored in memory as Buffer, not saved to disk
const storage = multer.memoryStorage()

const upload = multer({ storage })

export default upload