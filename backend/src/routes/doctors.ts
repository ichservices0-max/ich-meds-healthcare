import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/doctors/specialties ─────────────────────────────────────────────
// Must be defined BEFORE /:id to avoid route conflict
router.get('/specialties', async (_req: Request, res: Response): Promise<void> => {
  try {
    const specialties = await prisma.doctor.findMany({
      select: { specialty: true },
      distinct: ['specialty'],
      orderBy: { specialty: 'asc' },
    });

    res.status(200).json({ specialties: specialties.map((s) => s.specialty) });
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({ error: 'Could not fetch specialties.' });
  }
});

// ─── GET /api/doctors/search ──────────────────────────────────────────────────
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      specialty,
      city,
      lat,
      lng,
      radius = '50',
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;
    const radiusKm = parseFloat(radius) || 50;

    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;
    const useGeo = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

    if (useGeo) {
      // Haversine distance via raw SQL
      // Build dynamic WHERE clauses
      const conditions: string[] = [
        `d."membershipStatus" = 'ACTIVE'`,
        `(6371 * acos(
            cos(radians(${parsedLat})) * cos(radians(d.lat)) *
            cos(radians(d.lng) - radians(${parsedLng})) +
            sin(radians(${parsedLat})) * sin(radians(d.lat))
          )) <= ${radiusKm}`,
      ];

      if (specialty) {
        conditions.push(`d.specialty = '${specialty.replace(/'/g, "''")}'`);
      }
      if (city) {
        conditions.push(`LOWER(d.city) LIKE LOWER('%${city.replace(/'/g, "''")}%')`);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      type DoctorRow = {
        id: string;
        name: string;
        specialty: string;
        city: string;
        lat: number | null;
        lng: number | null;
        profileImage: string | null;
        rating: number | null;
        reviewCount: number;
        consultationFee: number | null;
        experience: number | null;
        isOnline: boolean;
        distance: number;
      };

      const doctors = await prisma.$queryRawUnsafe<DoctorRow[]>(`
        SELECT
          d.id, d.name, d.specialty, d.city, d.lat, d.lng,
          d.imageUrl as profileImage, d.rating, d.reviewCount,
          d.fee as consultationFee, d.experience, d.isOnline,
          (6371 * acos(
            cos(radians(${parsedLat})) * cos(radians(d.lat)) *
            cos(radians(d.lng) - radians(${parsedLng})) +
            sin(radians(${parsedLat})) * sin(radians(d.lat))
          )) AS distance
        FROM "Doctor" d
        ${whereClause}
        ORDER BY distance ASC
        LIMIT ${limitNum} OFFSET ${offset}
      `);

      const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(`
        SELECT COUNT(*) AS total
        FROM "Doctor" d
        ${whereClause}
      `);

      const total = Number(countResult[0]?.total ?? 0);

      res.status(200).json({
        doctors,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    // Non-geo search (Prisma ORM)
    const where: Record<string, unknown> = { membershipStatus: 'ACTIVE' };
    if (specialty) where.specialty = specialty;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        where,
        select: {
          id: true,
          name: true,
          specialty: true,
          city: true,
          lat: true,
          lng: true,
          imageUrl: true,
          rating: true,
          reviewCount: true,
          fee: true,
          experience: true,
          isOnline: true,
        },
        skip: offset,
        take: limitNum,
        orderBy: { rating: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    res.status(200).json({
      doctors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Doctor search error:', error);
    res.status(500).json({ error: 'Could not search doctors.' });
  }
});

// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findFirst({
      where: { id, membershipStatus: 'ACTIVE' },
      include: {
        sessions: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found.' });
      return;
    }

    res.status(200).json({ doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Could not fetch doctor.' });
  }
});

// ─── GET /api/doctors/:id/sessions ─────────────────────────────────────────────
router.get('/:id/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
      return;
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23,59,59,999);
    
    const sessions = await prisma.doctorSession.findMany({
      where: {
        doctorId: id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
      },
      include: {
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: { sessionType: 'asc' },
    });

    // Format sessions for frontend
    const formattedSessions = sessions.map((session) => {
      const bookedTokens = session._count.appointments;
      return {
        id: session.id,
        sessionType: session.sessionType,
        startTime: session.startTime,
        endTime: session.endTime,
        maxTokens: session.maxTokens,
        bookedTokens,
        currentToken: session.currentToken,
        isAvailable: bookedTokens < session.maxTokens,
        date: session.date.toISOString(),
      };
    });

    res.status(200).json({ success: true, data: formattedSessions });
  } catch (error) {
    console.error('Get doctor sessions error:', error);
    res.status(500).json({ error: 'Could not fetch sessions.' });
  }
});

export default router;
