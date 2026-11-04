"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { updateProfileApi } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";

export default function ProfilePage() {
  const { user, accessToken, fetchMe } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setError("");
    setSuccessMsg("");
    setIsSaving(true);

    try {
      await updateProfileApi(accessToken, formData);
      await fetchMe(); // Refresh user context
      setSuccessMsg("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium">Profile</h2>
          {isAdmin && (
            <span className="text-[11px] font-mono uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
              {user.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 bg-foreground text-background hover:bg-foreground/85 font-medium transition-colors shadow-sm"
            >
              <span>Admin Dashboard</span>
              <span>→</span>
            </Link>
          )}
          {!isEditing && (
            <button
              onClick={() => { setIsEditing(true); setSuccessMsg(""); }}
              className="text-sm px-4 py-2 border border-border hover:bg-muted/50 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="p-4 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="text-sm font-medium">Administrator Privileges Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage storefront products, inventory, customer orders, and shipping logistics.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-foreground text-background hover:bg-foreground/85 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>Open Dashboard</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-700 border border-green-200 text-sm p-4">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 text-sm p-4">
          {error}
        </div>
      )}

      <div className="bg-surface p-6 shadow-sm">
        {!isEditing ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">First Name</p>
                <p className="text-sm font-medium">{user?.firstName || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last Name</p>
                <p className="text-sm font-medium">{user?.lastName || "—"}</p>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email Address</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">{user?.email}</p>
                {user?.isEmailVerified ? (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
              <p className="text-sm font-medium">{user?.phone || "—"}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full border border-border px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full border border-border px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full border border-border px-4 py-2.5 text-sm bg-muted/30 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>

            <div className="border-t border-border pt-5">
              <label htmlFor="phone" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Phone (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full border border-border px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-sm bg-foreground text-background hover:bg-foreground/80 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 text-sm border border-border hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
