import React, { useState, useEffect } from "react";
import { 
  Users, 
  CreditCard, 
  Coins, 
  TrendingUp, 
  Shield, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  UserMinus, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { UserProfile, RedeemRequest } from "../types";

interface AdminPanelProps {
  token: string;
  adminProfile: UserProfile;
  onLogout: () => void;
}

export default function AdminPanel({ token, adminProfile, onLogout }: AdminPanelProps) {
  const [requests, setRequests] = useState<RedeemRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchRequestQuery, setSearchRequestQuery] = useState("");

  // Payout action state
  const [activeRequestForPayout, setActiveRequestForPayout] = useState<RedeemRequest | null>(null);
  const [manualRedeemCode, setManualRedeemCode] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // Coin adjustment state
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [processingAdjustment, setProcessingAdjustment] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoadingRequests(true);
    setLoadingUsers(true);
    try {
      // Fetch Requests
      const reqRes = await fetch("/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      if (reqRes.ok) {
        setRequests(reqData.requests);
      }

      // Fetch Users
      const userRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userRes.ok) {
        setUsers(userData.users);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoadingRequests(false);
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleProcessPayout = async (status: "completed" | "rejected") => {
    if (!activeRequestForPayout) return;
    setPayoutError(null);

    if (status === "completed" && !manualRedeemCode.trim()) {
      setPayoutError("Please enter a valid redeem code to payout.");
      return;
    }

    setProcessingPayout(true);

    try {
      const res = await fetch("/api/admin/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: activeRequestForPayout.id,
          status,
          redeemCode: manualRedeemCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process payout.");
      }

      // Success, clean up states and refresh
      setActiveRequestForPayout(null);
      setManualRedeemCode("");
      fetchAdminData();
    } catch (err: any) {
      setPayoutError(err.message || "An error occurred during payout.");
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser || !adjustmentAmount) return;
    setAdjustmentError(null);
    setProcessingAdjustment(true);

    try {
      const res = await fetch("/api/admin/adjust-coins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userEmail: adjustingUser.email,
          adjustmentAmount: Number(adjustmentAmount)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust user coins.");
      }

      // Success
      setAdjustingUser(null);
      setAdjustmentAmount("");
      fetchAdminData();
    } catch (err: any) {
      setAdjustmentError(err.message || "An error occurred.");
    } finally {
      setProcessingAdjustment(false);
    }
  };

  // Compute stats
  const totalUsersCount = users.length;
  const totalCoinsCirculating = users.reduce((sum, u) => sum + (u.coins || 0), 0);
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const completedRequests = requests.filter((r) => r.status === "completed");
  const totalPaidINR = completedRequests.reduce((sum, r) => sum + r.amount, 0);

  // Filter lists
  const filteredRequests = requests.filter((r) => 
    r.userEmail.toLowerCase().includes(searchRequestQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchRequestQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u) => 
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center border border-indigo-900">
            <Shield className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-950 font-display tracking-tight flex items-center gap-2">
              <span>Admin Management Panel</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">SYSTEM</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Authorized session: <span className="text-indigo-600 font-semibold">{adminProfile.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 text-xs bg-slate-50 text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl font-semibold transition"
          >
            <RefreshCw size={13} className={loadingRequests || loadingUsers ? "animate-spin" : ""} />
            <span>Sync DB</span>
          </button>
          
          <button
            onClick={onLogout}
            className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2.5 rounded-xl font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Stats Summary Bento Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Stat 1 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Users Registered
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-display mt-1">
              {totalUsersCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Active user base in server</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Users size={18} />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Circulating Coins
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-display mt-1">
              {totalCoinsCirculating.toLocaleString()}
            </div>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">Coin liabilities outstanding</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Coins size={18} />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Pending Payout Request
            </span>
            <div className={`text-2xl font-extrabold font-display mt-1 ${pendingRequests.length > 0 ? "text-amber-500 animate-pulse" : "text-slate-900"}`}>
              {pendingRequests.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Manual fulfillments queue</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <CreditCard size={18} />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Disbursed Cash
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 font-display mt-1">
              {totalPaidINR} INR
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sum of processed payouts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
        </div>

      </section>

      {/* Main Admin Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Redemption Queue Manager) - Col Span 8 */}
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                  <span>Redemption Request Queue</span>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-mono">{filteredRequests.length}</span>
                </h3>
                <p className="text-xs text-slate-400">Approve pending payouts manually and enter redeem codes.</p>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchRequestQuery}
                  onChange={(e) => setSearchRequestQuery(e.target.value)}
                  placeholder="Filter by email or request ID..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-2 text-xs outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Request Modal Dialogue if any active */}
            {activeRequestForPayout && (
              <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 mb-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">
                      PROCESSING PAYOUT FOR:
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {activeRequestForPayout.userEmail}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {activeRequestForPayout.amount} INR
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cost: {activeRequestForPayout.coinsRequired} Coins
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <p className="text-slate-500">
                    <strong className="text-slate-700">Payment Details:</strong> {activeRequestForPayout.paymentDetails}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong className="text-slate-500">Submitted:</strong> {new Date(activeRequestForPayout.createdAt).toLocaleString()}
                  </p>
                </div>

                {payoutError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                    {payoutError}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">
                    Redeem Code or Paytm Tx ID:
                  </label>
                  <input
                    type="text"
                    value={manualRedeemCode}
                    onChange={(e) => setManualRedeemCode(e.target.value)}
                    placeholder="e.g. Google Play Code: GP-9081-3921-X90B or PTM-823901"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleProcessPayout("rejected")}
                    disabled={processingPayout}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    Reject & Refund Coins
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveRequestForPayout(null);
                        setManualRedeemCode("");
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleProcessPayout("completed")}
                      disabled={processingPayout}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition"
                    >
                      {processingPayout ? "Processing..." : "Approve & Submit Code"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List */}
            {filteredRequests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xs text-slate-400">No requests match filters or database is empty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-l-xl">User</th>
                      <th className="px-4 py-3 font-semibold">Value</th>
                      <th className="px-4 py-3 font-semibold">Payment Info</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{req.userEmail}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {req.id}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{req.amount} INR</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{req.coinsRequired} Coins</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[11px] font-medium text-slate-600 max-w-[180px] break-all">
                            {req.paymentDetails}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {req.status === "pending" && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">
                              Pending
                            </span>
                          )}
                          {req.status === "completed" && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                              Paid out
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full font-semibold">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          {req.status === "pending" ? (
                            <button
                              onClick={() => {
                                setActiveRequestForPayout(req);
                                setManualRedeemCode("");
                                setPayoutError(null);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                            >
                              Process
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">
                              {req.redeemCode || "Processed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>

        {/* Right Column (User Accounts Direct Adjuster) - Col Span 4 */}
        <div className="lg:col-span-4 space-y-8">
          
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col gap-2.5 mb-6">
              <h3 className="text-base font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <span>User Account Registry</span>
              </h3>
              
              {/* Search users */}
              <div className="relative w-full">
                <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Filter users..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-2 text-xs outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Adjust coins inline overlay form */}
            {adjustingUser && (
              <form onSubmit={handleAdjustCoins} className="bg-slate-50 border border-amber-100 rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                    Adjust Balance For:
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setAdjustingUser(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
                <p className="text-[11px] font-bold text-slate-800 break-all">{adjustingUser.email}</p>
                <p className="text-[10px] text-slate-400">Current Balance: {adjustingUser.coins} Coins</p>

                {adjustmentError && (
                  <p className="text-[10px] text-rose-600">{adjustmentError}</p>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Value (e.g. 500 or -200)"
                    className="bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs outline-none w-full text-slate-900"
                    required
                  />
                  <button
                    type="submit"
                    disabled={processingAdjustment}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    {processingAdjustment ? "Saving..." : "Apply"}
                  </button>
                </div>
              </form>
            )}

            {/* User List scroll container */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredUsers.map((userItem) => (
                <div key={userItem.id} className="border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="space-y-1.5 max-w-[180px]">
                    <div className="font-semibold text-slate-800 break-all leading-tight">
                      {userItem.email}
                      {userItem.isAdmin && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-md ml-1 font-bold">ADMIN</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border text-slate-500">
                        {userItem.coins} coins
                      </span>
                      <span>Joined {new Date(userItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {!userItem.isAdmin && (
                    <button
                      onClick={() => {
                        setAdjustingUser(userItem);
                        setAdjustmentAmount("");
                        setAdjustmentError(null);
                      }}
                      className="text-xs bg-slate-50 text-slate-600 hover:bg-amber-500 hover:text-white px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0"
                      title="Adjust User Coins Directly"
                    >
                      <Coins size={12} />
                      <span>Adjust</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
