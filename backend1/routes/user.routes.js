import express from "express";
import { getTopPlayers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/leaderboard", getTopPlayers);

export default router;
