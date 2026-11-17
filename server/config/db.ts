import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.ts';
import { ItemModel } from '../models/Item.ts';
import { ClaimModel } from '../models/Claim.ts';
import { NotificationModel } from '../models/Notification.ts';
import type {
  ClaimStatus,
  ItemCategory,
  ItemStatus,
  ItemType,
  LostFoundItem,
  OwnershipClaim,
  PortalNotification,
  PortalStats,
  PortalUser,
  UserRole,
} from '../../src/types/portal.ts';

export interface StoredUser extends PortalUser {
  passwordHash: string;
}

interface LocalDatabaseSchema {
  users: StoredUser[];
  items: LostFoundItem[];
  claims: OwnershipClaim[];
  notifications: PortalNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'campus_store.json');

let useMongo = false;
let activeDbName = 'local-store';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSeedData(): LocalDatabaseSchema {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 86400 * 1000).toISOString().slice(0, 10);

  const studentPass = bcrypt.hashSync('Student@123', 10);
  const facultyPass = bcrypt.hashSync('Faculty@123', 10);
  const staffPass = bcrypt.hashSync('Staff@123', 10);

  const users: StoredUser[] = [
    {
      id: 'usr-student-1',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@saiuniversity.edu.in',
      studentId: 'SU2024CS042',
      passwordHash: studentPass,
      role: 'Student',
      department: 'School of Computing & Data Science',
      createdAt: hoursAgo(240),
    },
    {
      id: 'usr-faculty-1',
      fullName: 'Dr. Meera Krishnan',
      email: 'meera.krishnan@saiuniversity.edu.in',
      studentId: 'SUFAC019',
      passwordHash: facultyPass,
      role: 'Faculty',
      department: 'School of Arts & Sciences',
      createdAt: hoursAgo(480),
    },
    {
      id: 'usr-staff-1',
      fullName: 'Rajesh Nair',
      email: 'rajesh.nair@saiuniversity.edu.in',
      studentId: 'SUSTF004',
      passwordHash: staffPass,
      role: 'Staff',
      department: 'Campus Security & Student Affairs',
      createdAt: hoursAgo(720),
    },
    {
      id: 'usr-student-2',
      fullName: 'Priya Menon',
      email: 'priya.menon@saiuniversity.edu.in',
      studentId: 'SU2025BA118',
      passwordHash: studentPass,
      role: 'Student',
      department: 'School of Law & Policy',
      createdAt: hoursAgo(180),
    },
  ];

  const items: LostFoundItem[] = [
    {
      id: 'itm-101',
      trackingCode: 'SU-2026-1041',
      type: 'found',
      title: 'Silver MacBook Air 13" with Blue Spiral Notebook',
      category: 'Electronics',
      description:
        'Found unattended on the second-floor quiet reading table near the east arched windows. Device is in sleep mode inside a matte clear shell; a dark blue spiral notebook was beside it.',
      location: 'Central Library — 2nd Floor Quiet Zone',
      dateOccurred: daysAgo(0),
      imageUrl: '/src/assets/images/item_silver_laptop_1794891976602.jpg',
      status: 'Claim Pending',
      contactPreference: 'Campus Security Desk (Room 104)',
      identifyingNote: 'Lock screen wallpaper and sticker inside notebook cover required for verification.',
      reportedBy: {
        userId: 'usr-staff-1',
        fullName: 'Rajesh Nair',
        email: 'rajesh.nair@saiuniversity.edu.in',
        studentId: 'SUSTF004',
        role: 'Staff',
      },
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'itm-102',
      trackingCode: 'SU-2026-1040',
      type: 'lost',
      title: 'Matte Charcoal Wireless Over-Ear Headphones',
      category: 'Electronics',
      description:
        'Left behind after an afternoon study group session at the Student Commons lounge table. Faint scuff mark on the left earcup hinge; USB-C cable was not attached.',
      location: 'Student Commons & Cafe Lounge',
      dateOccurred: daysAgo(1),
      imageUrl: '/src/assets/images/item_wireless_headphones_1794891976526.jpg',
      status: 'Active',
      contactPreference: 'University Email',
      identifyingNote: 'Bluetooth pairing name begins with "Aarav-WH".',
      reportedBy: {
        userId: 'usr-student-1',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@saiuniversity.edu.in',
        studentId: 'SU2024CS042',
        role: 'Student',
      },
      createdAt: hoursAgo(9),
      updatedAt: hoursAgo(9),
    },
    {
      id: 'itm-103',
      trackingCode: 'SU-2026-1039',
      type: 'found',
      title: 'Navy Canvas Backpack with Tan Leather Trim',
      category: 'Bags & Wallets',
      description:
        'Turned in to the Main Academic Block reception after being left on the stone courtyard bench outside Hall B. Contains two textbooks and a pencil pouch.',
      location: 'Academic Block B Courtyard Bench',
      dateOccurred: daysAgo(1),
      imageUrl: '/src/assets/images/item_canvas_backpack_1794891977345.jpg',
      status: 'Active',
      contactPreference: 'Campus Security Desk (Room 104)',
      identifyingNote: 'Owner must name the two textbooks inside the main compartment.',
      reportedBy: {
        userId: 'usr-faculty-1',
        fullName: 'Dr. Meera Krishnan',
        email: 'meera.krishnan@saiuniversity.edu.in',
        studentId: 'SUFAC019',
        role: 'Faculty',
      },
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(18),
    },
    {
      id: 'itm-104',
      trackingCode: 'SU-2026-1038',
      type: 'found',
      title: 'Brass & Silver Keyring on Navy Woven Lanyard',
      category: 'ID Cards & Keys',
      description:
        'Set of four brass and silver keys attached to a dark navy fabric lanyard with a white RFID building access card. Picked up along the walkway near the Auditorium steps.',
      location: 'Main Auditorium Walkway',
      dateOccurred: daysAgo(2),
      imageUrl: '/src/assets/images/item_keys_lanyard_1794891977687.jpg',
      status: 'Active',
      contactPreference: 'Campus Security Desk (Room 104)',
      identifyingNote: 'Key code stamp and RFID card serial checked at handover.',
      reportedBy: {
        userId: 'usr-staff-1',
        fullName: 'Rajesh Nair',
        email: 'rajesh.nair@saiuniversity.edu.in',
        studentId: 'SUSTF004',
        role: 'Staff',
      },
      createdAt: hoursAgo(32),
      updatedAt: hoursAgo(32),
    },
    {
      id: 'itm-105',
      trackingCode: 'SU-2026-1037',
      type: 'lost',
      title: 'Navy Insulated Stainless Steel Water Bottle (32 oz)',
      category: 'Accessories',
      description:
        'Left on the third row wooden desk in Lecture Hall 204 right after the 11:00 AM Economics seminar. Matte navy body with brushed stainless steel cap.',
      location: 'Lecture Hall 204 — Academic Block A',
      dateOccurred: daysAgo(2),
      imageUrl: '/src/assets/images/item_insulated_bottle_1794891976573.jpg',
      status: 'Recovered',
      contactPreference: 'University Email',
      identifyingNote: 'Small engraved initials "PM" on the bottom base.',
      reportedBy: {
        userId: 'usr-student-2',
        fullName: 'Priya Menon',
        email: 'priya.menon@saiuniversity.edu.in',
        studentId: 'SU2025BA118',
        role: 'Student',
      },
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(12),
    },
    {
      id: 'itm-106',
      trackingCode: 'SU-2026-1036',
      type: 'found',
      title: 'Linear Algebra Hardcover Textbook with Handwritten Notes',
      category: 'Books & Stationery',
      description:
        'Found on the bench outside Computer Lab 3. Contains neatly tabbed sticky notes across chapters 4 and 5.',
      location: 'Computer Lab 3 — Tech Wing',
      dateOccurred: daysAgo(3),
      status: 'Recovered',
      contactPreference: 'Campus Security Desk (Room 104)',
      identifyingNote: 'Name written on inside back flyleaf.',
      reportedBy: {
        userId: 'usr-faculty-1',
        fullName: 'Dr. Meera Krishnan',
        email: 'meera.krishnan@saiuniversity.edu.in',
        studentId: 'SUFAC019',
        role: 'Faculty',
      },
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(24),
    },
  ];

  const claims: OwnershipClaim[] = [
    {
      id: 'clm-201',
      claimCode: 'CLM-408',
      itemId: 'itm-101',
      itemTitle: 'Silver MacBook Air 13" with Blue Spiral Notebook',
      itemTrackingCode: 'SU-2026-1041',
      itemType: 'found',
      claimantId: 'usr-student-1',
      claimantName: 'Aarav Sharma',
      claimantEmail: 'aarav.sharma@saiuniversity.edu.in',
      claimantStudentId: 'SU2024CS042',
      claimantRole: 'Student',
      proofDescription:
        'I was studying near the east windows until 2:30 PM before rushing to my Algorithms lab. I can unlock the MacBook in person and provide the serial number from my Apple account.',
      distinctiveMarks:
        'Wallpaper is a night skyline photo and inside the blue notebook cover there is a Sai University Hackathon 2026 sticker.',
      lostDateApprox: daysAgo(0),
      status: 'Pending Review',
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'clm-202',
      claimCode: 'CLM-401',
      itemId: 'itm-105',
      itemTitle: 'Navy Insulated Stainless Steel Water Bottle (32 oz)',
      itemTrackingCode: 'SU-2026-1037',
      itemType: 'lost',
      claimantId: 'usr-student-2',
      claimantName: 'Priya Menon',
      claimantEmail: 'priya.menon@saiuniversity.edu.in',
      claimantStudentId: 'SU2025BA118',
      claimantRole: 'Student',
      proofDescription: 'Verified initials PM engraved on base at Security Desk Room 104.',
      distinctiveMarks: 'Small dent near base and initials PM.',
      lostDateApprox: daysAgo(2),
      status: 'Handed Over',
      staffReviewerName: 'Rajesh Nair',
      staffNotes: 'Identity verified via Student ID SU2025BA118. Bottle returned to owner.',
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(12),
    },
  ];

  const notifications: PortalNotification[] = [
    {
      id: 'ntf-1',
      userId: 'usr-student-1',
      title: 'Ownership Claim Submitted',
      message: 'Your claim CLM-408 for Silver MacBook Air 13" (SU-2026-1041) is queued for Campus Security review.',
      type: 'claim',
      relatedItemId: 'itm-101',
      read: false,
      createdAt: hoursAgo(1),
    },
    {
      id: 'ntf-2',
      userId: 'usr-staff-1',
      title: 'New Claim Awaiting Verification',
      message: 'Aarav Sharma (SU2024CS042) submitted claim CLM-408 on Silver MacBook Air 13".',
      type: 'claim',
      relatedItemId: 'itm-101',
      read: false,
      createdAt: hoursAgo(1),
    },
  ];

  return { users, items, claims, notifications };
}

async function seedMongoAtlasIfEmpty(): Promise<void> {
  const existingUsers = await UserModel.countDocuments();
  if (existingUsers > 0) {
    return;
  }

  const seed = buildSeedData();
  const userIdMap = new Map<string, string>();
  const itemIdMap = new Map<string, string>();

  for (const u of seed.users) {
    const createdUser = await UserModel.create({
      fullName: u.fullName,
      email: u.email,
      studentId: u.studentId,
      passwordHash: u.passwordHash,
      role: u.role,
      department: u.department,
    });
    userIdMap.set(u.id, String(createdUser._id));
  }

  const existingItems = await ItemModel.countDocuments();
  if (existingItems === 0) {
    for (const item of seed.items) {
      const mappedUserId = userIdMap.get(item.reportedBy.userId) || item.reportedBy.userId;
      const createdItem = await ItemModel.create({
        trackingCode: item.trackingCode,
        type: item.type,
        title: item.title,
        category: item.category,
        description: item.description,
        location: item.location,
        dateOccurred: item.dateOccurred,
        imageUrl: item.imageUrl,
        status: item.status,
        contactPreference: item.contactPreference,
        identifyingNote: item.identifyingNote,
        reportedBy: {
          ...item.reportedBy,
          userId: mappedUserId,
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      });
      itemIdMap.set(item.id, String(createdItem._id));
    }
  }

  const existingClaims = await ClaimModel.countDocuments();
  if (existingClaims === 0) {
    for (const claim of seed.claims) {
      const mappedItemId = itemIdMap.get(claim.itemId) || claim.itemId;
      const mappedClaimantId = userIdMap.get(claim.claimantId) || claim.claimantId;
      await ClaimModel.create({
        claimCode: claim.claimCode,
        itemId: mappedItemId,
        itemTitle: claim.itemTitle,
        itemTrackingCode: claim.itemTrackingCode,
        itemType: claim.itemType,
        claimantId: mappedClaimantId,
        claimantName: claim.claimantName,
        claimantEmail: claim.claimantEmail,
        claimantStudentId: claim.claimantStudentId,
        claimantRole: claim.claimantRole,
        proofDescription: claim.proofDescription,
        distinctiveMarks: claim.distinctiveMarks,
        lostDateApprox: claim.lostDateApprox,
        status: claim.status,
        staffReviewerName: claim.staffReviewerName,
        staffNotes: claim.staffNotes,
        createdAt: new Date(claim.createdAt),
        updatedAt: new Date(claim.updatedAt),
      });
    }
  }

  const existingNotifications = await NotificationModel.countDocuments();
  if (existingNotifications === 0) {
    for (const note of seed.notifications) {
      const mappedUserId = userIdMap.get(note.userId) || note.userId;
      const mappedItemId = note.relatedItemId ? itemIdMap.get(note.relatedItemId) || note.relatedItemId : undefined;
      await NotificationModel.create({
        userId: mappedUserId,
        title: note.title,
        message: note.message,
        type: note.type,
        relatedItemId: mappedItemId,
        read: note.read,
        createdAt: new Date(note.createdAt),
      });
    }
  }

  console.log('Seeded initial Sai University collections in MongoDB Atlas.');
}

function readLocalStore(): LocalDatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const seeded = buildSeedData();
    fs.writeFileSync(STORE_PATH, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf-8');
  return JSON.parse(raw) as LocalDatabaseSchema;
}

function writeLocalStore(data: LocalDatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function initDatabase(): Promise<{ mode: 'mongodb-atlas' | 'local-store'; dbName: string }> {
  const mongoUri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
  const dbName = (process.env.MONGODB_DB || 'sai_campus_lost_found').trim();

  if (mongoUri) {
    try {
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB Atlas runtime error:', err.message);
      });
      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB Atlas disconnected.');
      });

      await mongoose.connect(mongoUri, {
        dbName,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      useMongo = true;
      activeDbName = mongoose.connection.name || dbName;
      await seedMongoAtlasIfEmpty();
      console.log(`Connected to MongoDB Atlas database "${activeDbName}" via Mongoose ODM.`);
      return { mode: 'mongodb-atlas', dbName: activeDbName };
    } catch (err) {
      console.error(
        'MongoDB Atlas connection failed. Check MONGODB_URI credentials and Atlas Network Access allowlist:',
        (err as Error).message
      );
      useMongo = false;
    }
  }

  readLocalStore();
  activeDbName = 'local-store';
  console.log('MONGODB_URI is not configured; using persistent local campus store.');
  return { mode: 'local-store', dbName: activeDbName };
}

export async function closeDatabase(): Promise<void> {
  if (useMongo && mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

function mapMongoUser(doc: any): StoredUser {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    studentId: doc.studentId,
    passwordHash: doc.passwordHash,
    role: doc.role,
    department: doc.department,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

function mapMongoItem(doc: any): LostFoundItem {
  return {
    id: String(doc._id),
    trackingCode: doc.trackingCode,
    type: doc.type,
    title: doc.title,
    category: doc.category,
    description: doc.description,
    location: doc.location,
    dateOccurred: doc.dateOccurred,
    imageUrl: doc.imageUrl,
    status: doc.status,
    contactPreference: doc.contactPreference,
    identifyingNote: doc.identifyingNote,
    reportedBy: doc.reportedBy,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function mapMongoClaim(doc: any): OwnershipClaim {
  return {
    id: String(doc._id),
    claimCode: doc.claimCode,
    itemId: doc.itemId,
    itemTitle: doc.itemTitle,
    itemTrackingCode: doc.itemTrackingCode,
    itemType: doc.itemType,
    claimantId: doc.claimantId,
    claimantName: doc.claimantName,
    claimantEmail: doc.claimantEmail,
    claimantStudentId: doc.claimantStudentId,
    claimantRole: doc.claimantRole,
    proofDescription: doc.proofDescription,
    distinctiveMarks: doc.distinctiveMarks,
    lostDateApprox: doc.lostDateApprox,
    status: doc.status,
    staffReviewerName: doc.staffReviewerName,
    staffNotes: doc.staffNotes,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function mapMongoNotification(doc: any): PortalNotification {
  return {
    id: String(doc._id),
    userId: doc.userId,
    title: doc.title,
    message: doc.message,
    type: doc.type,
    relatedItemId: doc.relatedItemId,
    read: doc.read,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function sanitizeUser(user: StoredUser): PortalUser {
  const { passwordHash: _ignored, ...safeUser } = user;
  return safeUser;
}

export const dbRepo = {
  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.trim().toLowerCase();
    if (useMongo) {
      const doc = await UserModel.findOne({ email: normalized }).lean();
      return doc ? mapMongoUser(doc) : null;
    }
    const store = readLocalStore();
    return store.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id: string): Promise<StoredUser | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await UserModel.findById(id).lean();
      return doc ? mapMongoUser(doc) : null;
    }
    const store = readLocalStore();
    return store.users.find((u) => u.id === id) || null;
  },

  async listStaffUsers(): Promise<StoredUser[]> {
    if (useMongo) {
      const docs = await UserModel.find({ role: 'Staff' }).lean();
      return docs.map(mapMongoUser);
    }
    const store = readLocalStore();
    return store.users.filter((u) => u.role === 'Staff');
  },

  async createUser(input: {
    fullName: string;
    email: string;
    studentId: string;
    passwordHash: string;
    role: UserRole;
    department?: string;
  }): Promise<StoredUser> {
    if (useMongo) {
      const doc = await UserModel.create({
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        studentId: input.studentId.trim().toUpperCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        department: input.department?.trim() || undefined,
      });
      return mapMongoUser(doc);
    }
    const store = readLocalStore();
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      studentId: input.studentId.trim().toUpperCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      department: input.department?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    writeLocalStore(store);
    return newUser;
  },

  async listItems(filters?: {
    type?: ItemType | 'all';
    category?: ItemCategory | 'All';
    status?: ItemStatus | 'All';
    search?: string;
    reportedByUserId?: string;
    sort?: 'newest' | 'oldest';
  }): Promise<LostFoundItem[]> {
    if (useMongo) {
      const query: Record<string, unknown> = {};
      if (filters?.type && filters.type !== 'all') {
        query.type = filters.type;
      }
      if (filters?.category && filters.category !== 'All') {
        query.category = filters.category;
      }
      if (filters?.status && filters.status !== 'All') {
        query.status = filters.status;
      }
      if (filters?.reportedByUserId) {
        query['reportedBy.userId'] = filters.reportedByUserId;
      }
      if (filters?.search?.trim()) {
        const rx = new RegExp(escapeRegex(filters.search.trim()), 'i');
        query.$or = [
          { title: rx },
          { description: rx },
          { location: rx },
          { category: rx },
          { trackingCode: rx },
        ];
      }
      const sortOrder = filters?.sort === 'oldest' ? 1 : -1;
      const docs = await ItemModel.find(query).sort({ createdAt: sortOrder }).lean();
      return docs.map(mapMongoItem);
    }

    let items = [...readLocalStore().items];

    if (filters?.type && filters.type !== 'all') {
      items = items.filter((i) => i.type === filters.type);
    }
    if (filters?.category && filters.category !== 'All') {
      items = items.filter((i) => i.category === filters.category);
    }
    if (filters?.status && filters.status !== 'All') {
      items = items.filter((i) => i.status === filters.status);
    }
    if (filters?.reportedByUserId) {
      items = items.filter((i) => i.reportedBy.userId === filters.reportedByUserId);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.trackingCode.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return filters?.sort === 'oldest' ? -diff : diff;
    });

    return items;
  },

  async getStats(): Promise<PortalStats> {
    if (useMongo) {
      const [totalReported, itemsRecovered, activeLost, activeFound] = await Promise.all([
        ItemModel.countDocuments(),
        ItemModel.countDocuments({ status: 'Recovered' }),
        ItemModel.countDocuments({ type: 'lost', status: { $in: ['Active', 'Claim Pending'] } }),
        ItemModel.countDocuments({ type: 'found', status: { $in: ['Active', 'Claim Pending'] } }),
      ]);
      return { totalReported, itemsRecovered, activeLost, activeFound };
    }

    const items = await this.listItems();
    return {
      totalReported: items.length,
      itemsRecovered: items.filter((i) => i.status === 'Recovered').length,
      activeLost: items.filter((i) => i.type === 'lost' && (i.status === 'Active' || i.status === 'Claim Pending')).length,
      activeFound: items.filter((i) => i.type === 'found' && (i.status === 'Active' || i.status === 'Claim Pending')).length,
    };
  },

  async findItemById(id: string): Promise<LostFoundItem | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await ItemModel.findById(id).lean();
      return doc ? mapMongoItem(doc) : null;
    }
    const store = readLocalStore();
    return store.items.find((i) => i.id === id) || null;
  },

  async createItem(
    input: Omit<LostFoundItem, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<LostFoundItem> {
    const randomNum = Math.floor(1050 + Math.random() * 8900);
    const trackingCode = `SU-2026-${randomNum}`;
    if (useMongo) {
      const doc = await ItemModel.create({
        ...input,
        trackingCode,
        status: 'Active',
      });
      return mapMongoItem(doc);
    }
    const store = readLocalStore();
    const nowIso = new Date().toISOString();
    const item: LostFoundItem = {
      id: `itm-${crypto.randomUUID().slice(0, 8)}`,
      trackingCode,
      ...input,
      status: 'Active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.items.unshift(item);
    writeLocalStore(store);
    return item;
  },

  async updateItem(id: string, patch: Partial<LostFoundItem>): Promise<LostFoundItem | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await ItemModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
      return doc ? mapMongoItem(doc) : null;
    }
    const store = readLocalStore();
    const idx = store.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    store.items[idx] = {
      ...store.items[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(store);
    return store.items[idx];
  },

  async deleteItem(id: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await ItemModel.findByIdAndDelete(id);
      if (res) {
        await ClaimModel.deleteMany({ itemId: id });
        return true;
      }
      return false;
    }
    const store = readLocalStore();
    const prevLen = store.items.length;
    store.items = store.items.filter((i) => i.id !== id);
    store.claims = store.claims.filter((c) => c.itemId !== id);
    if (store.items.length !== prevLen) {
      writeLocalStore(store);
      return true;
    }
    return false;
  },

  async listClaims(filter?: { itemId?: string; userId?: string; includeAll?: boolean }): Promise<OwnershipClaim[]> {
    if (useMongo) {
      const query: Record<string, unknown> = {};
      if (filter?.itemId) {
        query.itemId = filter.itemId;
      }
      if (!filter?.includeAll && filter?.userId) {
        const userItems = await ItemModel.find({ 'reportedBy.userId': filter.userId }, { _id: 1 }).lean();
        const ownedIds = userItems.map((doc) => String(doc._id));
        query.$or = [{ claimantId: filter.userId }, { itemId: { $in: ownedIds } }];
      }
      const docs = await ClaimModel.find(query).sort({ createdAt: -1 }).lean();
      return docs.map(mapMongoClaim);
    }

    let claims = [...readLocalStore().claims];

    if (filter?.itemId) {
      claims = claims.filter((c) => c.itemId === filter.itemId);
    }

    if (!filter?.includeAll && filter?.userId) {
      const items = await this.listItems();
      const userOwnedItemIds = new Set(items.filter((i) => i.reportedBy.userId === filter.userId).map((i) => i.id));
      claims = claims.filter((c) => c.claimantId === filter.userId || userOwnedItemIds.has(c.itemId));
    }

    claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return claims;
  },

  async findClaimById(id: string): Promise<OwnershipClaim | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await ClaimModel.findById(id).lean();
      return doc ? mapMongoClaim(doc) : null;
    }
    const store = readLocalStore();
    return store.claims.find((c) => c.id === id) || null;
  },

  async createClaim(
    input: Omit<OwnershipClaim, 'id' | 'claimCode' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<OwnershipClaim> {
    const claimCode = `CLM-${Math.floor(410 + Math.random() * 580)}`;
    if (useMongo) {
      const doc = await ClaimModel.create({
        ...input,
        claimCode,
        status: 'Pending Review',
      });
      return mapMongoClaim(doc);
    }
    const store = readLocalStore();
    const nowIso = new Date().toISOString();
    const claim: OwnershipClaim = {
      id: `clm-${crypto.randomUUID().slice(0, 8)}`,
      claimCode,
      ...input,
      status: 'Pending Review',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.claims.unshift(claim);
    writeLocalStore(store);
    return claim;
  },

  async updateClaim(
    id: string,
    patch: Partial<Pick<OwnershipClaim, 'status' | 'staffReviewerName' | 'staffNotes'>>
  ): Promise<OwnershipClaim | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await ClaimModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
      return doc ? mapMongoClaim(doc) : null;
    }
    const store = readLocalStore();
    const idx = store.claims.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.claims[idx] = {
      ...store.claims[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeLocalStore(store);
    return store.claims[idx];
  },

  async listNotifications(userId: string): Promise<PortalNotification[]> {
    if (useMongo) {
      const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(30).lean();
      return docs.map(mapMongoNotification);
    }
    const store = readLocalStore();
    return store.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);
  },

  async createNotification(
    input: Omit<PortalNotification, 'id' | 'read' | 'createdAt'>
  ): Promise<PortalNotification> {
    if (useMongo) {
      const doc = await NotificationModel.create({ ...input, read: false });
      return mapMongoNotification(doc);
    }
    const store = readLocalStore();
    const note: PortalNotification = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      ...input,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications.unshift(note);
    writeLocalStore(store);
    return note;
  },

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } });
      return Boolean(res);
    }
    const store = readLocalStore();
    const note = store.notifications.find((n) => n.id === id && n.userId === userId);
    if (!note) return false;
    note.read = true;
    writeLocalStore(store);
    return true;
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (useMongo) {
      await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
      return;
    }
    const store = readLocalStore();
    for (const n of store.notifications) {
      if (n.userId === userId) n.read = true;
    }
    writeLocalStore(store);
  },
};
