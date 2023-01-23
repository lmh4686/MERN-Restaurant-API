import express from 'express'
import { validateBasicAuth, generateAdminJWT } from "./AdminFunction.js";

const router = express.Router();

//LOGIN
router.post('/login', validateBasicAuth, generateAdminJWT, async (req, res) => {
  res.json({jwt: req.jwt})
})

export default router