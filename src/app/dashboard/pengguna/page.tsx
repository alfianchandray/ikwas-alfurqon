'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Checkbox from '@/components/atoms/Checkbox';
import FormField from '@/components/molecules/FormField';
import Toast from '@/components/molecules/Toast';
import ConfirmationModal from '@/components/organisms/ConfirmationModal';

interface Pengurus {
  id: string;
  name: string;
  role: string;
  permissions: {
    pemasukan_view: boolean;
    pemasukan_write: boolean;
    pengeluaran_view: boolean;
    pengeluaran_write: boolean;
    santri_view: boolean;
    santri_write: boolean;
    tabungan_view: boolean;
    tabungan_write: boolean;
    tagihan_view: boolean;
    tagihan_write: boolean;
    laporan_view: boolean;
    pengaturan_view: boolean;
    pengaturan_write: boolean;
  };
}

interface CustomRole {
  id: string;
  name: string;
  defaultPermissions: {
    pemasukan_view: boolean;
    pemasukan_write: boolean;
    pengeluaran_view: boolean;
    pengeluaran_write: boolean;
    santri_view: boolean;
    santri_write: boolean;
    tabungan_view: boolean;
    tabungan_write: boolean;
    tagihan_view: boolean;
    tagihan_write: boolean;
    laporan_view: boolean;
    pengaturan_view: boolean;
    pengaturan_write: boolean;
  };
}

const formatLogDetail = (action: string, detailStr: string) => {
  if (!detailStr) return '-';
  try {
    const detail = JSON.parse(detailStr);
    switch (action) {
      case 'CREATE_TRANSAKSI':
        return `Kategori: ${detail.kategori || ''} - Nominal: Rp ${new Intl.NumberFormat('id-ID').format(detail.nominal || 0)} - Ket: ${detail.keterangan || ''}`;
      case 'DELETE_TRANSAKSI':
        return `Hapus Transaksi ID ${detail.id || ''} - Nominal: Rp ${new Intl.NumberFormat('id-ID').format(detail.nominal || 0)}`;
      case 'CREATE_SANTRI':
        return `Nama Santri: ${detail.name || ''} - Wali: ${detail.wali || ''}`;
      case 'UPDATE_SANTRI':
        return `ID: ${detail.id || ''} - Perubahan: ${JSON.stringify(detail.changes || detail)}`;
      case 'DELETE_SANTRI':
        return `Hapus Santri ID ${detail.id || ''} - Nama: ${detail.name || ''}`;
      case 'SETOR_TABUNGAN':
        return `Setor Tabungan - Santri ID: ${detail.santri_id || ''} - Nominal: Rp ${new Intl.NumberFormat('id-ID').format(detail.nominal || 0)}`;
      case 'TARIK_TABUNGAN':
        return `Tarik Tabungan - Santri ID: ${detail.santri_id || ''} - Nominal: Rp ${new Intl.NumberFormat('id-ID').format(detail.nominal || 0)}`;
      case 'LOGIN':
        return 'Berhasil masuk ke dashboard';
      case 'LOGOUT':
        return 'Sesi berakhir / keluar';
      default:
        return typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
    }
  } catch {
    return detailStr;
  }
};

export default function PenggunaPage() {
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
  const [rolesList, setRolesList] = useState<CustomRole[]>([]);

  // Modals & Toast State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState({
    pemasukan_view: true,
    pemasukan_write: false,
    pengeluaran_view: true,
    pengeluaran_write: false,
    santri_view: true,
    santri_write: false,
    tabungan_view: true,
    tabungan_write: false,
    tagihan_view: true,
    tagihan_write: false,
    laporan_view: true,
    pengaturan_view: false,
    pengaturan_write: false,
  });

  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<CustomRole | null>(null);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(false);

  // Deletions Confirmations
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Pengurus | null>(null);

  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);

  // Activity Log & Tab States
  const [activeTab, setActiveTab] = useState<'rbac' | 'logs'>('rbac');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 50, totalPages: 1, total: 0 });


  const fetchUsers = () => {
    fetch('/api/pengurus')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setPengurusList(data);
        }
      })
      .catch(() => {
        // Fallback mock
        setPengurusList([
          {
            id: '1',
            name: 'Alfian Chandra',
            role: 'Super Admin',
            permissions: {
              pemasukan_view: true, pemasukan_write: true,
              pengeluaran_view: true, pengeluaran_write: true,
              santri_view: true, santri_write: true,
              tabungan_view: true, tabungan_write: true,
              tagihan_view: true, tagihan_write: true,
              laporan_view: true,
              pengaturan_view: true, pengaturan_write: true
            },
          },
          {
            id: '2',
            name: 'Ustadzah Fatimah',
            role: 'Bendahara Pemasukan',
            permissions: {
              pemasukan_view: true, pemasukan_write: true,
              pengeluaran_view: false, pengeluaran_write: false,
              santri_view: true, santri_write: false,
              tabungan_view: true, tabungan_write: false,
              tagihan_view: false, tagihan_write: false,
              laporan_view: true,
              pengaturan_view: false, pengaturan_write: false
            },
          },
        ]);
      });
  };

  const fetchRoles = () => {
    fetch('/api/roles')
      .then((res) => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setRolesList(data);
        }
      })
      .catch(() => {
        // Fallback mock
        setRolesList([
          {
            id: '1',
            name: 'Super Admin',
            defaultPermissions: {
              pemasukan_view: true, pemasukan_write: true,
              pengeluaran_view: true, pengeluaran_write: true,
              santri_view: true, santri_write: true,
              tabungan_view: true, tabungan_write: true,
              tagihan_view: true, tagihan_write: true,
              laporan_view: true,
              pengaturan_view: true, pengaturan_write: true
            },
          },
          {
            id: '2',
            name: 'Bendahara Pemasukan',
            defaultPermissions: {
              pemasukan_view: true, pemasukan_write: true,
              pengeluaran_view: false, pengeluaran_write: false,
              santri_view: true, santri_write: false,
              tabungan_view: true, tabungan_write: false,
              tagihan_view: false, tagihan_write: false,
              laporan_view: true,
              pengaturan_view: false, pengaturan_write: false
            },
          },
          {
            id: '3',
            name: 'Demo / Tamu (Read-Only)',
            defaultPermissions: {
              pemasukan_view: true, pemasukan_write: false,
              pengeluaran_view: true, pengeluaran_write: false,
              santri_view: true, santri_write: false,
              tabungan_view: true, tabungan_write: false,
              tagihan_view: true, tagihan_write: false,
              laporan_view: true,
              pengaturan_view: false, pengaturan_write: false
            },
          },
        ]);
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    
    // Check if Super Admin for logs
    const stored = sessionStorage.getItem('ikwas_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === 'Super Admin') {
          setIsSuperAdmin(true);
          fetchLogs(1);
        }
      } catch {}
    }
  }, []);

  const fetchLogs = (page = 1) => {
    fetch(`/api/activity-log?page=${page}&limit=50`)
      .then(res => res.json())
      .then((data: any) => {
        if (data.logs) {
          setActivityLogs(data.logs);
          setLogsPagination(data.pagination);
        }
      })
      .catch(() => {});
  };


  // Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserRole) {
      setToastMessage('Nama Pengguna dan Peran wajib dipilih!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    const matchedRole = rolesList.find((r) => r.name === newUserRole);
    const initialPerms = matchedRole
      ? matchedRole.defaultPermissions
      : {
          pemasukan_view: true, pemasukan_write: false,
          pengeluaran_view: true, pengeluaran_write: false,
          santri_view: true, santri_write: false,
          tabungan_view: true, tabungan_write: false,
          tagihan_view: true, tagihan_write: false,
          laporan_view: true,
          pengaturan_view: false, pengaturan_write: false
        };

    fetch('/api/pengurus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        role: newUserRole,
        permissions: initialPerms,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setNewUserName('');
        setShowAddUserModal(false);
        setToastMessage('Pengguna baru berhasil ditambahkan.');
        setToastType('success');
        setShowToast(true);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setIsLoading(false);
      setToastMessage(err.message || 'Gagal menambahkan pengguna.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // Add Role
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) {
      setToastMessage('Nama Peran wajib diisi!');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoleName,
        defaultPermissions: newRolePerms,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setNewRoleName('');
        setNewRolePerms({
          pemasukan_view: true, pemasukan_write: false,
          pengeluaran_view: true, pengeluaran_write: false,
          santri_view: true, santri_write: false,
          tabungan_view: true, tabungan_write: false,
          tagihan_view: true, tagihan_write: false,
          laporan_view: true,
          pengaturan_view: false, pengaturan_write: false
        });
        setShowAddRoleModal(false);
        setToastMessage('Peran (Role) baru berhasil dibuat.');
        setToastType('success');
        setShowToast(true);
        fetchRoles();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setIsLoading(false);
      setToastMessage(err.message || 'Gagal membuat peran.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // Edit Role
  const handleEditRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForEdit) return;

    setIsLoading(true);

    fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedRoleForEdit.id,
        name: selectedRoleForEdit.name,
        defaultPermissions: selectedRoleForEdit.defaultPermissions,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      setIsLoading(false);
      if (data.success) {
        setShowEditRoleModal(false);
        setSelectedRoleForEdit(null);
        setToastMessage('Peran (Role) berhasil diperbarui.');
        setToastType('success');
        setShowToast(true);
        fetchRoles();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setIsLoading(false);
      setToastMessage(err.message || 'Gagal mengubah peran.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // Delete User
  const triggerDeleteUser = (user: Pengurus) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;

    fetch(`/api/pengurus?id=${userToDelete.id}`, {
      method: 'DELETE',
    })
    .then((res) => res.json())
    .then((data: any) => {
      setShowDeleteUserModal(false);
      if (data.success) {
        setToastMessage(`Pengguna "${userToDelete.name}" telah dihapus.`);
        setToastType('warning');
        setShowToast(true);
        setUserToDelete(null);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setShowDeleteUserModal(false);
      setToastMessage(err.message || 'Gagal menghapus pengguna.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // Delete Role
  const triggerDeleteRole = (role: CustomRole) => {
    if (role.name === 'Super Admin') {
      setToastMessage('Peran Super Admin bawaan tidak boleh dihapus!');
      setToastType('error');
      setShowToast(true);
      return;
    }
    setRoleToDelete(role);
    setShowDeleteRoleModal(true);
  };

  const handleConfirmDeleteRole = () => {
    if (!roleToDelete) return;

    fetch(`/api/roles?id=${roleToDelete.id}`, {
      method: 'DELETE',
    })
    .then((res) => res.json())
    .then((data: any) => {
      setShowDeleteRoleModal(false);
      if (data.success) {
        setToastMessage(`Peran "${roleToDelete.name}" telah dihapus.`);
        setToastType('warning');
        setShowToast(true);
        setRoleToDelete(null);
        fetchRoles();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setShowDeleteRoleModal(false);
      setToastMessage(err.message || 'Gagal menghapus peran.');
      setToastType('error');
      setShowToast(true);
    });
  };

  // User Permission Matriks Live Update
  const handleUserPermissionToggle = (userId: string, module: keyof Pengurus['permissions']) => {
    const user = pengurusList.find((u) => u.id === userId);
    if (!user) return;

    const updatedPermissions = {
      ...user.permissions,
      [module]: !user.permissions[module],
    };

    fetch('/api/pengurus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        permissions: updatedPermissions,
      }),
    })
    .then((res) => res.json())
    .then((data: any) => {
      if (data.success) {
        setToastMessage('Hak akses pengguna berhasil diperbarui.');
        setToastType('success');
        setShowToast(true);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    })
    .catch((err) => {
      setToastMessage(err.message || 'Gagal memperbarui hak akses.');
      setToastType('error');
      setShowToast(true);
    });
  };

  const roleDropdownOptions = rolesList
    .filter((r) => r.name !== 'Super Admin')
    .map((r) => ({
      value: r.name,
      label: r.name,
    }));

  return (
    <div className="space-y-10 text-left">
      {/* Toast Alert */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteUserModal}
        title="Hapus Pengguna"
        message={`Apakah Anda benar-benar yakin ingin menghapus akses pengurus untuk "${userToDelete?.name}"?`}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setShowDeleteUserModal(false)}
        confirmText="Hapus Pengguna"
        cancelText="Batalkan"
        variant="error"
      />

      <ConfirmationModal
        isOpen={showDeleteRoleModal}
        title="Hapus Peran (Role)"
        message={`Apakah Anda benar-benar yakin ingin menghapus peran "${roleToDelete?.name}"?`}
        onConfirm={handleConfirmDeleteRole}
        onCancel={() => setShowDeleteRoleModal(false)}
        confirmText="Hapus Peran"
        cancelText="Batalkan"
        variant="error"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2 inline-block">Keamanan RBAC</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Manajemen Pengguna</h1>
          <p className="text-xs md:text-sm text-on-surface-variant font-semibold">
            Tambah user pengurus baru, definisikan peran (Role), serta atur hak akses modul secara granular.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowAddRoleModal(true)}
            variant="secondary"
            leftIcon="shield"
            className="px-4 py-3"
          >
            Buat Peran (Role)
          </Button>
          <Button
            onClick={() => {
              if (rolesList.length === 0) {
                setToastMessage('Silakan buat peran (Role) terlebih dahulu!');
                setToastType('error');
                setShowToast(true);
                return;
              }
              setNewUserRole(rolesList[0].name);
              setShowAddUserModal(true);
            }}
            variant="primary"
            leftIcon="person_add"
            className="px-4 py-3"
          >
            Tambah Pengguna
          </Button>
        </div>
      </div>


      {/* Tabs Navigation */}
      {isSuperAdmin && (
        <div className="flex border-b border-primary/20 mb-6">
          <button
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'rbac' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-primary/70'}`}
            onClick={() => setActiveTab('rbac')}
          >
            Manajemen Akses (RBAC)
          </button>
          <button
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-primary/70'}`}
            onClick={() => setActiveTab('logs')}
          >
            <Icon name="history" className="text-base" /> Log Aktivitas
          </button>
        </div>
      )}

      {activeTab === 'rbac' ? (
      <div className="flex flex-col gap-6 w-full">
        {/* Baris Atas: Tabel Pengguna & Matriks Hak Akses (Lebar Penuh) */}
        <div className="w-full space-y-6">
          <div className="glass-card rounded-3xl shadow-sm border border-white/20 overflow-visible">
            <div className="p-4 px-6 border-b border-white/20 bg-white/20">
              <h3 className="font-bold text-sm text-on-surface">Daftar Pengguna &amp; Matriks Hak Akses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 text-primary text-[11px] font-bold border-b border-primary/10 select-none">
                    <th className="px-6 py-4">Pengguna</th>
                    <th className="px-4 py-4 text-center">Pemasukan</th>
                    <th className="px-4 py-4 text-center">Pengeluaran</th>
                    <th className="px-4 py-4 text-center">Data Santri</th>
                    <th className="px-4 py-4 text-center">Tabungan</th>
                    <th className="px-4 py-4 text-center">Tagihan &amp; Iuran</th>
                    <th className="px-4 py-4 text-center">Laporan</th>
                    <th className="px-4 py-4 text-center">Pengaturan</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {pengurusList.map((user) => (
                    <tr key={user.id} className="hover:bg-primary/5 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-on-surface">{user.name}</p>
                        <p className="text-[9px] text-primary font-bold">{user.role}</p>
                      </td>
                      
                      {/* Pemasukan */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pemasukan_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'pemasukan_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pemasukan_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'pemasukan_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Catat</span>
                          </label>
                        </div>
                      </td>

                      {/* Pengeluaran */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pengeluaran_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'pengeluaran_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pengeluaran_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'pengeluaran_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Catat</span>
                          </label>
                        </div>
                      </td>

                      {/* Data Santri */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.santri_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'santri_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.santri_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'santri_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Kelola</span>
                          </label>
                        </div>
                      </td>

                      {/* Tabungan */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.tabungan_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'tabungan_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.tabungan_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'tabungan_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Setor/Tarik</span>
                          </label>
                        </div>
                      </td>

                      {/* Tagihan & Iuran */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.tagihan_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'tagihan_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.tagihan_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'tagihan_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Kelola</span>
                          </label>
                        </div>
                      </td>

                      {/* Laporan */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.laporan_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'laporan_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                        </div>
                      </td>

                      {/* Pengaturan */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-start justify-center mx-auto w-max text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pengaturan_view}
                              onChange={() => handleUserPermissionToggle(user.id, 'pengaturan_view')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Lihat</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-outline hover:text-primary">
                            <Checkbox
                              checked={user.role === 'Super Admin' || !!user.permissions.pengaturan_write}
                              onChange={() => handleUserPermissionToggle(user.id, 'pengaturan_write')}
                              disabled={user.role === 'Super Admin'}
                            />
                            <span>Kelola</span>
                          </label>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => triggerDeleteUser(user)}
                          disabled={user.name === 'Alfian Chandra'}
                          className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.name === 'Alfian Chandra' ? "Akun utama tidak boleh dihapus" : "Hapus Pengguna"}
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Baris Bawah: Daftar Peran (Role) Custom (Lebar Penuh) */}
        <div className="w-full">
          <div className="glass-card rounded-3xl shadow-sm border border-white/20 p-6 space-y-4">
            <h3 className="font-bold text-sm text-on-surface">Daftar Peran (Roles)</h3>
            <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed">
              Hak akses default dari Peran di bawah akan diterapkan secara otomatis saat Anda membuat pengguna baru.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto no-scrollbar">
              {rolesList.map((role) => (
                <div key={role.id} className="p-4 rounded-2xl bg-white border border-primary/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-on-surface">{role.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                      {Object.entries(role.defaultPermissions)
                        .filter(([_, allowed]) => allowed)
                        .map(([mod]) => (
                          <span key={mod} className="text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">
                            {mod}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedRoleForEdit(role);
                        setShowEditRoleModal(true);
                      }}
                      className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Edit Peran"
                    >
                      <Icon name="edit" className="text-sm font-bold" />
                    </button>
                    <button
                      onClick={() => triggerDeleteRole(role)}
                      disabled={role.name === 'Super Admin'}
                      className="text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Hapus Peran"
                    >
                      <Icon name="delete" className="text-sm font-bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="glass-card rounded-3xl shadow-sm border border-white/20 p-6 overflow-x-auto">
          <h3 className="font-bold text-sm text-on-surface mb-4">Log Aktivitas (Super Admin)</h3>
          <p className="text-xs text-on-surface-variant mb-6">Menampilkan riwayat aktivitas pengguna selama 90 hari terakhir.</p>
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-outline/20 text-on-surface-variant">
                <th className="py-3 px-4 font-bold">Waktu</th>
                <th className="py-3 px-4 font-bold">Pengguna</th>
                <th className="py-3 px-4 font-bold">Aksi</th>
                <th className="py-3 px-4 font-bold">Detail / Deskripsi Aktivitas</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                <tr key={log.id} className="border-b border-outline/10 hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4 text-on-surface">
                    {(() => {
                      const dateStr = log.created_at.includes('Z') || log.created_at.includes('+') ? log.created_at : log.created_at + ' UTC';
                      return new Date(dateStr).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                    })()}
                  </td>
                  <td className="py-3 px-4 text-primary font-bold">{log.username || 'Sistem / Anonim'}</td>
                  <td className="py-3 px-4 font-semibold text-on-surface">{log.action}</td>
                  <td className="py-3 px-4 text-on-surface-variant max-w-xs truncate" title={formatLogDetail(log.action, log.detail)}>
                    {formatLogDetail(log.action, log.detail)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${log.status === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-outline font-mono">{log.ip_address}</td>
                </tr>
              ))}
              {activityLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-outline">Tidak ada log aktivitas.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center text-xs text-on-surface-variant">
            <span>Halaman {logsPagination.page} dari {logsPagination.totalPages}</span>
            <span>Total: {logsPagination.total} catatan</span>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[448px] overflow-visible animate-fade-in-up border border-primary/10 text-left flex-shrink-0 min-w-[320px] md:min-w-[448px]">
            <div className="p-6 primary-gradient text-white flex justify-between items-center rounded-t-3xl">
              <h3 className="font-bold text-sm">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <FormField label="Nama Pengurus / Pengguna">
                <Input
                  type="text"
                  required
                  placeholder="Nama pengurus baru..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </FormField>
              <FormField label="Pilih Peran (Role)">
                <Select
                  options={roleDropdownOptions}
                  value={newUserRole}
                  onChange={setNewUserRole}
                />
              </FormField>
              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3"
                  rightIcon="save"
                >
                  Simpan Pengguna
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[448px] overflow-visible animate-fade-in-up border border-primary/10 text-left flex-shrink-0 min-w-[320px] md:min-w-[448px]">
            <div className="p-6 primary-gradient text-white flex justify-between items-center rounded-t-3xl">
              <h3 className="font-bold text-sm">Buat Peran (Role) Baru</h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleAddRole} className="p-6 space-y-4">
              <FormField label="Nama Peran / Jabatan">
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Audit Keuangan, Guru Kelas..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </FormField>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-primary ml-1 block select-none">
                  Hak Akses Default Modul
                </label>
                <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  {Object.keys(newRolePerms).map((mod) => (
                    <div key={mod} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface select-none capitalize">{mod}</span>
                      <Checkbox
                        checked={newRolePerms[mod as keyof typeof newRolePerms]}
                        onChange={() =>
                          setNewRolePerms({
                            ...newRolePerms,
                            [mod]: !newRolePerms[mod as keyof typeof newRolePerms],
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddRoleModal(false)}
                  className="flex-1 py-3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3"
                  rightIcon="save"
                >
                  Simpan Peran
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedRoleForEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl rounded-b-3xl shadow-2xl w-full max-w-[448px] overflow-visible animate-fade-in-up border border-primary/10 text-left flex-shrink-0 min-w-[320px] md:min-w-[448px]">
            <div className="p-6 primary-gradient text-white flex justify-between items-center rounded-t-3xl">
              <h3 className="font-bold text-sm">Edit Hak Akses Peran: {selectedRoleForEdit.name}</h3>
              <button
                onClick={() => {
                  setShowEditRoleModal(false);
                  setSelectedRoleForEdit(null);
                }}
                className="text-white/80 hover:text-white flex items-center justify-center p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>
            <form onSubmit={handleEditRole} className="p-6 space-y-4">
              <FormField label="Nama Peran / Jabatan">
                <Input
                  type="text"
                  required
                  disabled={selectedRoleForEdit.name === 'Super Admin'}
                  placeholder="Nama peran..."
                  value={selectedRoleForEdit.name}
                  onChange={(e) =>
                    setSelectedRoleForEdit({
                      ...selectedRoleForEdit,
                      name: e.target.value,
                    })
                  }
                />
              </FormField>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-primary ml-1 block select-none">
                  Hak Akses Default Modul
                </label>
                <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  {Object.keys(selectedRoleForEdit.defaultPermissions).map((mod) => (
                    <div key={mod} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface select-none capitalize">{mod}</span>
                      <Checkbox
                        checked={selectedRoleForEdit.defaultPermissions[mod as keyof typeof selectedRoleForEdit.defaultPermissions]}
                        disabled={selectedRoleForEdit.name === 'Super Admin'}
                        onChange={() =>
                          setSelectedRoleForEdit({
                            ...selectedRoleForEdit,
                            defaultPermissions: {
                              ...selectedRoleForEdit.defaultPermissions,
                              [mod]: !selectedRoleForEdit.defaultPermissions[mod as keyof typeof selectedRoleForEdit.defaultPermissions],
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditRoleModal(false);
                    setSelectedRoleForEdit(null);
                  }}
                  className="flex-1 py-3"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3"
                  rightIcon="save"
                  disabled={selectedRoleForEdit.name === 'Super Admin'}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
