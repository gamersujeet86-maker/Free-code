export interface UserProfile {
  id: string;
  email: string;
  isAdmin: boolean;
  coins: number;
  boosterUntil: number | null;
  isBoosterActive: boolean;
  boosterTimeRemaining: number;
}

export interface RedeemRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number; // in INR
  coinsRequired: number; // e.g. 2500
  paymentDetails: string;
  status: "pending" | "completed" | "rejected";
  redeemCode?: string;
  createdAt: string;
  processedAt?: string;
}

export interface RedeemPackage {
  amount: number; // INR
  coins: number; // Coins required
  label: string;
}

export const REDEEM_PACKAGES: RedeemPackage[] = [
  { amount: 10, coins: 2500, label: "10 INR Google Play / Paytm Redeem Code" },
  { amount: 20, coins: 4000, label: "20 INR Google Play / Paytm Redeem Code" },
  { amount: 50, coins: 10000, label: "50 INR Google Play / Paytm Redeem Code" },
  { amount: 100, coins: 19500, label: "100 INR Google Play / Paytm Redeem Code" },
];
