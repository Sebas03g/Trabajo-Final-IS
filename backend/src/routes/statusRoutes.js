import express from "express";

let currentStatus = { state: "IDLE" };

export const setStatus = (status) => {
  currentStatus = status;
};

const router = express.Router();

router.get("/", (req, res) => {
  res.json(currentStatus);
});

export default router;
