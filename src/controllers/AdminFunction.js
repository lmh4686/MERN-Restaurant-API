import * as dotenv from 'dotenv'
dotenv.config()
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import Admin from '../db/models/AdminModel.js';


//Encryption config
const encAlgorithm = 'aes-256-cbc'
const encPrivateKey = crypto.scryptSync(process.env.ENC_KEY, 'SpecialSalt', 32)
const encIV = crypto.scryptSync(process.env.ENC_IV, 'SpecialSalt', 16)
let cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV)
let decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV)

//Encrypt & Decrypt functions
export function encryptString(data) {
  var cipher = crypto.createCipheriv(encAlgorithm, encPrivateKey, encIV)
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
}

export function decryptString(data) {
  decipher = crypto.createDecipheriv(encAlgorithm, encPrivateKey, encIV)
  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8')
}

export function decryptObject(data) {
  return JSON.parse(decryptString(data))
}

//Hash & Salt

const saltRounds = 10

export async function hashString(stringToHash) {
  let salt = await bcrypt.genSalt(saltRounds)
  return await bcrypt.hash(stringToHash, salt)
}

export async function validateHashedData(unhashedData, hashedData) {
  return await bcrypt.compare(unhashedData, hashedData)
}

//JWT functions

export function generateJWT(obj) {
  return jwt.sign(obj, process.env.JWT_SECRET, {expiresIn: "1d"})
}

export async function generateAdminJWT(req, res, next ) {
  const encryptedAdminCredentials = encryptString(JSON.stringify(req.credentials))
  req.headers.jwt = generateJWT({data: encryptedAdminCredentials})
  next()
}

export function verifyJwt(req, res, next) {
  //complete returns object {payload, header, signature} instead of the only content of the payload
  try{
    const verifiedJwt = jwt.verify(req.headers.jwt, process.env.JWT_SECRET, {complete: true})
    const credentials = JSON.parse(decryptString(verifiedJwt.payload.data))
    req.credentials = credentials
    next()
  } catch(e) {
    res.status(401).send({error: e.message})
  }
}

export async function verifyCredentials(req, res, next) {
  let adminModel = await Admin.findOne().exec()
  adminModel.username = decryptString(adminModel.username)
  adminModel.password = decryptString(adminModel.password)
  if (await validateHashedData(req.credentials.username, adminModel.username) && await validateHashedData(req.credentials.password, adminModel.password)) {
    next()
  } else {
    res.status(401).json({error: 'Invalid credentials'})
  }
}

export function validateBasicAuth(req, res, next) {
  let authHeader = req.headers['authorization'] ?? null
  if (authHeader == null ) {
    res.status(403).json({error: 'Missing Auth'})
  } 
  else if (authHeader.startsWith('Basic ')) {
    authHeader = authHeader.substring(5).trim()
    const decodedAuth = Buffer.from(authHeader, 'base64').toString('ascii')
  
    const credentials = {username: '', password: ''}
    credentials.username = decodedAuth.substring(0, decodedAuth.indexOf(':'))
    credentials.password = decodedAuth.substring(decodedAuth.indexOf(":") + 1)
  
    req.credentials = credentials
    next()
  } else {
    res.status(403).json({error: 'Invalid auth type'})
  }
}