import { Router } from "express";
import { uploadPdf } from "../middleware/upload.js";
import * as analyzeController from "../controllers/analyzeController.js";

const router = Router();

router.post(
  "/verify",
  (req, res, next) => {
    uploadPdf.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  analyzeController.verifyPdf
);

router.get("/history", analyzeController.listRecentJobs);

export default router;
