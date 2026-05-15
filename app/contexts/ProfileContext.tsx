import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { Profile } from '../types';

interface ProfileContextType {
  activeProfile: Profile | null;
  profiles: Profile[];
  setActiveProfile: (profile: Profile) => void;
  loading: boolean;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem('activeProfile');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // migrate stale entries that have _id but no id
      if (parsed && !parsed.id && (parsed as any)._id) {
        parsed.id = (parsed as any)._id.toString();
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const refreshProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getProfiles();
      const profileList = (res.data || []).map((p: any) => ({
        ...p,
        id: p.id || p._id?.toString(),
      }));
      setProfiles(profileList);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveProfile = (profile: Profile) => {
    const normalized = { ...profile, id: profile.id || (profile as any)._id?.toString() };
    setActiveProfileState(normalized);
    localStorage.setItem('activeProfile', JSON.stringify(normalized));
  };

  const clearActiveProfile = () => {
    setActiveProfileState(null);
    localStorage.removeItem('activeProfile');
  };

  return (
    <ProfileContext.Provider
      value={{ activeProfile, profiles, setActiveProfile, loading, refreshProfiles }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
};
