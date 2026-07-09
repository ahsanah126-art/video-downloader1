import { Router } from "express";
import { getInfo, download } from "../controllers/videoController.js";

const router = Router();

router.post("/info", getInfo);
router.get("/download", download);

export default router;
