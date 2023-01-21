import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import Admin from '../db/models/AdminModel.js';
import * as dotenv from 'dotenv'

dotenv.config({path: '../../.env'});

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

export async function generateAdminJWT(adminCredentials) {
  const encryptedAdminCredentials = encryptString(JSON.stringify(adminCredentials))
  return generateJWT({data: encryptedAdminCredentials})
}

export function verifyJwt(givenJwt) {
  //complete returns object {payload, header, signature} instead of the only content of the payload
  try{
    const verifiedJwt = jwt.verify(givenJwt, process.env.JWT_SECRET, {complete: true})
    const credentials = JSON.parse(decryptString(verifiedJwt.payload.data))
    verifyCredentials(credentials)
  } catch(e) {
    throw new Error({error: e.message})
  }
}

export async function verifyCredentials(credentials) {
  let adminModel = await Admin.find().exec()
  if (validateHashedData(credentials.id, Admin.id) && validateHashedData(credentials.password, Admin.password)) {
    //Refresh expiry by assigning a new jwt
    return generateJWT({data: credentials})
  } else {
    throw new Error({error: "Invalid token"})
  }
}