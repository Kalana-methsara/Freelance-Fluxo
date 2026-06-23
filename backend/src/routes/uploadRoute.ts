import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary"; // 👈 ඔයාගේ cloudinary config එක මෙතනින් import කරන්න

const router = Router();
const storage = multer.memoryStorage(); // Image එක memory එකට ගන්නවා direct cloudinary යවන්න
const upload = multer({ storage });

router.post("/upload-avatar", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    // Buffer එක Base64 string එකකට හරවනවා Cloudinary යවන්න
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    
    // Cloudinary එකට Upload කිරීම
    const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: "user_profiles",
    });

    // 🎯 සාර්ථකයි! Cloudinary URL එක front-end එකට යවනවා
    return res.status(200).json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({ message: "Server Error during image upload" });
  }
});

export default router;