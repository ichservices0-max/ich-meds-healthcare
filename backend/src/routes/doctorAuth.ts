import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';
import { bucket } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { authIpLimiter, authAccountLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Setup Multer for memory storage (for Firebase upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to generate JWT
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

const uploadToFirebase = async (file: Express.Multer.File, folder: string): Promise<string | null> => {
  if (!file) return null;
  try {
    if (!bucket) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(file.originalname)}&background=random`;
    }
    const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    const fileUpload = bucket.file(fileName);
    
    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });
    
    try {
      await fileUpload.makePublic();
    } catch (e) {
      console.warn('Could not make file public (might be uniform bucket-level access):', e);
    }
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error('Firebase upload failed:', error);
    // Return a mock URL so registration does not crash during local testing
    return `https://via.placeholder.com/150?text=${encodeURIComponent(file.originalname)}`;
  }
};

// @route   POST /api/doctor/auth/register
// @desc    Register a new doctor with document uploads
router.post(
  '/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'medicalLicense', maxCount: 1 },
    { name: 'registrationCertificate', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
    { name: 'governmentId', maxCount: 1 },
  ]),
  authIpLimiter,
  authAccountLimiter,
  async (req, res) => {
    try {
      const {
        name, email, phone, password, registrationNumber, qualification,
        degree, experience, specialty, clinicName, clinicAddress,
        city, state, country, lat, lng, fee
      } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !password || !registrationNumber || !specialty || !clinicAddress || !city || !state || !country) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check duplicates
      const existingUser = await prisma.doctor.findFirst({
        where: {
          OR: [
            { email },
            { phone },
            { registrationNumber }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Doctor with this email, phone, or registration number already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Extract uploaded files and upload to Firebase
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const imageUrl = files.profileImage?.[0] ? await uploadToFirebase(files.profileImage[0], 'doctors/profiles') : null;
      
      const documents = {
        medicalLicense: files.medicalLicense?.[0] ? await uploadToFirebase(files.medicalLicense[0], 'doctors/documents') : null,
        registrationCertificate: files.registrationCertificate?.[0] ? await uploadToFirebase(files.registrationCertificate[0], 'doctors/documents') : null,
        degreeCertificate: files.degreeCertificate?.[0] ? await uploadToFirebase(files.degreeCertificate[0], 'doctors/documents') : null,
        governmentId: files.governmentId?.[0] ? await uploadToFirebase(files.governmentId[0], 'doctors/documents') : null,
      };

      // Create doctor
      const doctor = await prisma.doctor.create({
        data: {
          name, email, phone, passwordHash, registrationNumber, qualification, degree,
          experience: isNaN(parseInt(experience, 10)) ? 0 : parseInt(experience, 10),
          specialty, clinicName, clinicAddress, city, state, country,
          lat: isNaN(parseFloat(lat)) ? 0 : parseFloat(lat),
          lng: isNaN(parseFloat(lng)) ? 0 : parseFloat(lng),
          fee: isNaN(parseFloat(fee)) ? 0 : parseFloat(fee),
          imageUrl,
          documents,
          verificationStatus: 'PENDING',
        },
      });

      const token = generateToken(doctor.id, 'doctor');

      // Do not return password hash
      const { passwordHash: _, ...doctorData } = doctor;

      res.status(201).json({ token, doctor: doctorData });
    } catch (error: any) {
      console.error('Doctor Registration Error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// @route   POST /api/doctor/auth/login
// @desc    Authenticate doctor & get token
router.post('/login', authIpLimiter, authAccountLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const doctor = await prisma.doctor.findUnique({ where: { email } });

    if (!doctor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, doctor.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(doctor.id, 'doctor');

    const { passwordHash: _, ...doctorData } = doctor;

    res.json({ token, doctor: doctorData });
  } catch (error: any) {
    console.error('Doctor Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/doctor/auth/me
// @desc    Get current logged in doctor
router.get('/me', authenticateDoctor, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.user.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { passwordHash: _, ...doctorData } = doctor;
    res.json({ doctor: doctorData });
  } catch (error: any) {
    console.error('Doctor Get Me Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/doctor/auth/verify-firebase
// @desc    Verify Firebase phone auth token and login
router.post('/verify-firebase', authIpLimiter, authAccountLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Verify token with Firebase Admin
    const { auth: firebaseAuth } = require('../lib/firebase');
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'No phone number linked to this Firebase credential' });
    }

    // Find doctor by phone number
    const doctor = await prisma.doctor.findUnique({
      where: { phone: phoneNumber }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'No doctor account found with this phone number.' });
    }

    // Issue our own JWT
    const jwtToken = generateToken(doctor.id, 'doctor');
    const { passwordHash: _, ...doctorData } = doctor;

    res.json({ token: jwtToken, doctor: doctorData });
  } catch (error: any) {
    console.error('Firebase Verify Error:', error);
    res.status(401).json({ error: 'Invalid or expired OTP token' });
  }
});

// @route   PATCH /api/doctor/auth/pay-membership
// @desc    Activate doctor membership
router.patch('/pay-membership', authenticateDoctor, async (req, res) => {
  try {
    const doctor = await prisma.doctor.update({
      where: { id: req.user.id },
      data: {
        membershipStatus: 'ACTIVE',
        membershipPaidAt: new Date(),
      },
    });
    
    const { passwordHash: _, ...doctorData } = doctor;
    res.json({ success: true, doctor: doctorData });
  } catch (error: any) {
    console.error('Pay Membership Error:', error);
    res.status(500).json({ error: 'Server error updating membership' });
  }
});

export default router;
