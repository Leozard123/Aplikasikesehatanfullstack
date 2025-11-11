import { useState, useEffect } from 'react';
import { getPatients, savePatient, type Patient, getCurrentUser } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { UserPlus, Edit, Stethoscope } from 'lucide-react';
import { Badge } from './ui/badge';

interface DokterDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function DokterDashboard({ accessToken, onLogout }: DokterDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    nama: '',
    umur: 0,
    keluhan: '',
    catatan_dokter: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [user, patientsData] = await Promise.all([
        getCurrentUser(accessToken),
        getPatients(accessToken)
      ]);
      setCurrentUser(user);
      setPatients(patientsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      userId: patient.userId,
      nama: patient.nama,
      umur: patient.umur,
      keluhan: patient.keluhan,
      catatan_dokter: patient.catatan_dokter
    });
    setShowDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePatient(accessToken, formData);
      await loadData();
      setShowDialog(false);
      setEditingPatient(null);
      setFormData({
        userId: '',
        nama: '',
        umur: 0,
        keluhan: '',
        catatan_dokter: ''
      });
    } catch (err: any) {
      console.error('Error saving patient:', err);
      alert('Gagal menyimpan data pasien: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl">Dashboard Dokter</h1>
                <p className="text-sm text-gray-600">Selamat datang, {currentUser?.name}</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Pasien</CardTitle>
                <CardDescription>Kelola catatan kesehatan pasien</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingPatient(null);
                setFormData({
                  userId: `user_${Date.now()}`,
                  nama: '',
                  umur: 0,
                  keluhan: '',
                  catatan_dokter: ''
                });
                setShowDialog(true);
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Pasien
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data pasien</p>
                <p className="text-sm">Klik "Tambah Pasien" untuk memulai</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Umur</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Catatan Dokter</TableHead>
                    <TableHead>Terakhir Diperbarui</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient, index) => (
                    <TableRow key={patient.userId || index}>
                      <TableCell>{patient.nama}</TableCell>
                      <TableCell>{patient.umur} tahun</TableCell>
                      <TableCell className="max-w-xs truncate">{patient.keluhan || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{patient.catatan_dokter || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {patient.updated_at ? new Date(patient.updated_at).toLocaleDateString('id-ID') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(patient)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Edit Catatan Pasien' : 'Tambah Pasien Baru'}
            </DialogTitle>
            <DialogDescription>
              Masukkan informasi kesehatan pasien
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="umur">Umur *</Label>
                <Input
                  id="umur"
                  type="number"
                  value={formData.umur}
                  onChange={(e) => setFormData({ ...formData, umur: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  max="150"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keluhan">Keluhan</Label>
              <Textarea
                id="keluhan"
                value={formData.keluhan}
                onChange={(e) => setFormData({ ...formData, keluhan: e.target.value })}
                rows={3}
                placeholder="Keluhan yang dirasakan pasien..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Dokter</Label>
              <Textarea
                id="catatan"
                value={formData.catatan_dokter}
                onChange={(e) => setFormData({ ...formData, catatan_dokter: e.target.value })}
                rows={4}
                placeholder="Diagnosis, resep, atau catatan medis lainnya..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button type="submit">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
