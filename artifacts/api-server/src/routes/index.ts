import { Router } from "express";
import healthRouter from "./health";
import telegramRouter from "./telegram";

const router = Router();

// Connect your endpoints cleanly
router.use(healthRouter);
router.use("/telegram", telegramRouter);

export default router;
