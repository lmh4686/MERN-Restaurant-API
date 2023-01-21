import express from 'express'
import { validateBasicAuth, verifyCredentials, generateAdminJWT } from "./AdminFunction.js";

const router = express.Router();

//LOGIN
router.post('/login', validateBasicAuth, verifyCredentials, generateAdminJWT, async (req, res) => {
  res.send({jwt: req.jwt})
})

export default router