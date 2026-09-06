"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { updateProfileApi } from "@/lib/api/auth";

export default function AdminSettingsPage() {
  const { user, accessToken, fetchMe } = useAuth();
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    setIsSavingProfile(true);
    setProfileMsg({ type: "", text: "" });

    try {
      await updateProfileApi(accessToken, profileForm);
      await fetchMe();
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-white/40 mt-0.5">Manage your account and store preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Nav (Static for now) */}
        <div className="space-y-1">
          <button className="w-full text-left px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium">
            Account Profile
          </button>
          <button className="w-full text-left px-4 py-2 text-white/40 hover:bg-white/5 hover:text-white rounded-lg text-sm transition-colors opacity-50 cursor-not-allowed">
            Store Details
          </button>
          <button className="w-full text-left px-4 py-2 text-white/40 hover:bg-white/5 hover:text-white rounded-lg text-sm transition-colors opacity-50 cursor-not-allowed">
            Notifications
          </button>
        </div>

        {/* Right Content */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white/5 border border-white/8 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Profile</h2>
            
            {profileMsg.text && (
              <div className={`mb-6 p-4 rounded-lg text-sm border ${
                profileMsg.type === "success" 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">First Name</label>
                  <input
                    name="firstName" value={profileForm.firstName} onChange={handleProfileChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Last Name</label>
                  <input
                    name="lastName" value={profileForm.lastName} onChange={handleProfileChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Email Address</label>
                <div className="flex items-center gap-3">
                  <input
                    type="email" value={user?.email || ""} disabled
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/50 cursor-not-allowed"
                  />
                  <span className={`text-xs px-2 py-1 rounded-full border ${user?.isEmailVerified ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                    {user?.isEmailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-1">Email cannot be changed directly.</p>
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5">Phone Number (Optional)</label>
                <input
                  name="phone" value={profileForm.phone} onChange={handleProfileChange} type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={isSavingProfile}
                  className="px-6 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white/5 border border-white/8 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-1 text-red-400">Danger Zone</h2>
            <p className="text-sm text-white/40 mb-4">Irreversible actions for your account.</p>
            <button className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors">
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
