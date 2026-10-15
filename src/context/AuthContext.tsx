import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (identifier: string, password?: string) => { success: boolean; message?: string };
  loginAs: (user: User) => void;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, department: string) => { success: boolean; message?: string };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addUser: (userData: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    role: UserRole;
    department?: string;
  }) => { success: boolean; message?: string; user?: User };
  editUser: (
    userId: string,
    updates: Partial<{
      name: string;
      email: string;
      username?: string;
      password?: string;
      role: UserRole;
      department?: string;
    }>
  ) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  isAdmin: boolean;
  isStandardUser: boolean;
  isBidang: boolean;
  canAccessPublic: boolean;
  canAccessSurat: boolean;
  canModifyBidang: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());

  useEffect(() => {
    StorageService.saveUsers(users);
  }, [users]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  const login = (identifier: string, password?: string): { success: boolean; message?: string } => {
    const trimmed = identifier.trim().toLowerCase();
    const found = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === trimmed;
      const usernameMatch = u.username && u.username.toLowerCase() === trimmed;
      const adminAlias = trimmed === 'admin' && (u.role === 'admin' || u.id === 'user_admin');
      return emailMatch || usernameMatch || adminAlias;
    });

    if (!found) {
      return {
        success: false,
        message: 'Akun dengan username atau email tersebut tidak ditemukan. Silakan periksa kembali kredensial Anda.',
      };
    }

    if (found.password && password !== undefined) {
      if (found.password !== password) {
        return {
          success: false,
          message: 'Kata sandi tidak sesuai. Silakan gunakan password yang benar.',
        };
      }
    }

    setCurrentUser(found);
    return { success: true };
  };

  const loginAs = (user: User) => {
    // Refresh user state from users list in case role changed
    const freshUser = users.find((u) => u.id === user.id) || user;
    setCurrentUser(freshUser);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = (
    name: string,
    email: string,
    role: UserRole,
    department: string
  ): { success: boolean; message?: string } => {
    return addUser({ name, email, role, department });
  };

  const addUser = (userData: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    role: UserRole;
    department?: string;
  }): { success: boolean; message?: string; user?: User } => {
    const trimmedEmail = userData.email.trim().toLowerCase();
    const trimmedUsername = userData.username ? userData.username.trim().toLowerCase() : '';

    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, message: 'Email sudah terdaftar dalam sistem.' };
    }

    if (trimmedUsername && users.some((u) => u.username && u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name.trim(),
      email: trimmedEmail,
      username: trimmedUsername || undefined,
      password: userData.password?.trim() || '123456',
      role: userData.role,
      department: (userData.department || 'Umum').trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    setUsers(updated);
    return { success: true, message: 'Pengguna berhasil ditambahkan.', user: newUser };
  };

  const editUser = (
    userId: string,
    updates: Partial<{
      name: string;
      email: string;
      username?: string;
      password?: string;
      role: UserRole;
      department?: string;
    }>
  ): { success: boolean; message?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (updates.email) {
      const emailLower = updates.email.trim().toLowerCase();
      if (users.some((u) => u.id !== userId && u.email.toLowerCase() === emailLower)) {
        return { success: false, message: 'Email sudah digunakan oleh akun lain.' };
      }
    }

    if (updates.username) {
      const unameLower = updates.username.trim().toLowerCase();
      if (users.some((u) => u.id !== userId && u.username && u.username.toLowerCase() === unameLower)) {
        return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
      }
    }

    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          ...(updates.name !== undefined && { name: updates.name.trim() }),
          ...(updates.email !== undefined && { email: updates.email.trim().toLowerCase() }),
          ...(updates.username !== undefined && { username: updates.username.trim().toLowerCase() }),
          ...(updates.password !== undefined && { password: updates.password.trim() }),
          ...(updates.role !== undefined && { role: updates.role }),
          ...(updates.department !== undefined && { department: updates.department.trim() }),
        };
      }
      return u;
    });

    setUsers(updatedUsers);

    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = updatedUsers.find((u) => u.id === userId);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }

    return { success: true, message: 'Data pengguna berhasil diperbarui.' };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (currentUser && currentUser.id === userId) {
      return { success: false, message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    // Check if trying to delete the only admin
    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Sistem harus memiliki minimal satu akun Administrator.' };
      }
    }

    const filtered = users.filter((u) => u.id !== userId);
    setUsers(filtered);
    return { success: true, message: `Akun ${target.name} berhasil dihapus dari sistem.` };
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    editUser(userId, { role: newRole });
  };

  const role = currentUser?.role;
  const isAdmin = role === 'admin';
  const isStandardUser = role === 'user';
  const isBidang = role === 'bidang';

  // Rule constraints:
  // - "folder publik yang bisa di akeses oleh semua user kecuali user bidang"
  const canAccessPublic = isAdmin || isStandardUser;

  // - "menu manajemen surat hanya bisa di akses admin dan user tapi user bidang tidak bisa mengaksesnya"
  const canAccessSurat = isAdmin || isStandardUser;

  // - "user bidang hanya bisa melihat menu bidang dan hanya memiliki wewenang melihat dan download tidak bisa upload hapus ataupun edit yang bisa upload hapus edit hanya user dan admin"
  const canModifyBidang = isAdmin || isStandardUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        loginAs,
        logout,
        register,
        updateUserRole,
        addUser,
        editUser,
        deleteUser,
        isAdmin,
        isStandardUser,
        isBidang,
        canAccessPublic,
        canAccessSurat,
        canModifyBidang,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
