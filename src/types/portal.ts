export type UserRole = 'Student' | 'Faculty' | 'Staff';

export type ItemType = 'lost' | 'found';

export type ItemCategory =
  | 'Electronics'
  | 'ID Cards & Keys'
  | 'Bags & Wallets'
  | 'Books & Stationery'
  | 'Accessories'
  | 'Clothing'
  | 'Other';

export type ItemStatus = 'Active' | 'Claim Pending' | 'Recovered' | 'Archived';

export type ClaimStatus = 'Pending Review' | 'Approved' | 'Rejected' | 'Handed Over';

export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export interface ItemReporter {
  userId: string;
  fullName: string;
  email: string;
  studentId: string;
  role: UserRole;
}

export interface LostFoundItem {
  id: string;
  trackingCode: string;
  type: ItemType;
  title: string;
  category: ItemCategory;
  description: string;
  location: string;
  dateOccurred: string;
  imageUrl?: string;
  status: ItemStatus;
  contactPreference: string;
  identifyingNote?: string;
  reportedBy: ItemReporter;
  createdAt: string;
  updatedAt: string;
}

export interface OwnershipClaim {
  id: string;
  claimCode: string;
  itemId: string;
  itemTitle: string;
  itemTrackingCode: string;
  itemType: ItemType;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantStudentId: string;
  claimantRole: UserRole;
  proofDescription: string;
  distinctiveMarks: string;
  lostDateApprox: string;
  status: ClaimStatus;
  staffReviewerName?: string;
  staffNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'claim' | 'status' | 'match';
  relatedItemId?: string;
  read: boolean;
  createdAt: string;
}

export interface PortalStats {
  totalReported: number;
  itemsRecovered: number;
  activeLost: number;
  activeFound: number;
}
