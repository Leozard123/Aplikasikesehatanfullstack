import { useState, useEffect } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getPatients, getCurrentUser, type Transaction, type Patient } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pill, Plus, Edit, Trash2, Printer, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface AdminDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function AdminDashboard({ accessToken, onLogout }: AdminDashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState({
    pasien_id: '',
    pasien_nama: '',
    obat: '',
    harga: 0,
    status_pembayaran: 'Belum Bayar'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [user, transactionsData, patientsData] = await Promise.all([
        getCurrentUser(accessToken),
        getTransactions(accessToken),
        getPatients(accessToken)
      ]);
      setCurrentUser(user);
      setTransactions(transactionsData);
      setPatients(patientsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setFormData({
      pasien_id: '',
      pasien_nama: '',
      obat: '',
      harga: 0,
      status_pembayaran: 'Belum Bayar'
    });
    setShowDialog(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      pasien_id: transaction.pasien_id,
      pasien_nama: transaction.pasien_nama,
      obat: transaction.obat,
      harga: transaction.harga,
      status_pembayaran: transaction.status_pembayaran
    });
    setShowDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await updateTransaction(accessToken, editingTransaction.id, {
          obat: formData.obat,
          harga: formData.harga,
          status_pembayaran: formData.status_pembayaran
        });
      } else {
        await createTransaction(accessToken, formData);
      }
      await loadData();
      setShowDialog(false);
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      alert('Gagal menyimpan transaksi: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    try {
      await deleteTransaction(accessToken, id);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      alert('Gagal menghapus transaksi: ' + err.message);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalPendapatan = transactions
      .filter(t => t.status_pembayaran === 'Lunas')
      .reduce((sum, t) => sum + t.harga, 0);
    
    const totalBelumBayar = transactions
      .filter(t => t.status_pembayaran === 'Belum Bayar')
      .reduce((sum, t) => sum + t.harga, 0);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Transaksi - Aplikasi Kesehatan</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
            .info { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #6366f1; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-top: 30px; padding: 20px; background: #f0f9ff; border-left: 4px solid #6366f1; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🏥 Laporan Transaksi - Aplikasi Kesehatan</h1>
          <div class="info">
            <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleString('id-ID')}</p>
            <p><strong>Dicetak oleh:</strong> ${currentUser?.name}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Pasien</th>
                <th>Obat</th>
                <th>Harga</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                  <td>${t.pasien_nama}</td>
                  <td>${t.obat}</td>
                  <td>Rp ${t.harga.toLocaleString('id-ID')}</td>
                  <td>${t.status_pembayaran}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Ringkasan</h3>
            <p><strong>Total Transaksi:</strong> ${transactions.length}</p>
            <p><strong>Total Pendapatan (Lunas):</strong> Rp ${totalPendapatan.toLocaleString('id-ID')}</p>
            <p><strong>Total Belum Bayar:</strong> Rp ${totalBelumBayar.toLocaleString('id-ID')}</p>
          </div>
          
          <div class="footer">
            <p>Dokumen ini dicetak secara otomatis oleh sistem Aplikasi Kesehatan</p>
          </div>
          
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const totalPendapatan = transactions
    .filter(t => t.status_pembayaran === 'Lunas')
    .reduce((sum, t) => sum + t.harga, 0);
  
  const totalBelumBayar = transactions
    .filter(t => t.status_pembayaran === 'Belum Bayar')
    .reduce((sum, t) => sum + t.harga, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
              <Pill className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl">Dashboard Admin / Petugas Obat</h1>
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Transaksi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Pendapatan (Lunas)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">Rp {totalPendapatan.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Belum Bayar</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-yellow-600">Rp {totalBelumBayar.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daftar Transaksi</CardTitle>
                <CardDescription>Kelola pembayaran dan data obat</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak Laporan
                </Button>
                <Button onClick={handleAddTransaction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada transaksi</p>
                <p className="text-sm">Klik "Tambah Transaksi" untuk memulai</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama Pasien</TableHead>
                    <TableHead>Obat</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{transaction.pasien_nama}</TableCell>
                      <TableCell>{transaction.obat}</TableCell>
                      <TableCell>Rp {transaction.harga.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status_pembayaran === 'Lunas' ? 'default' : 'secondary'}
                          className={
                            transaction.status_pembayaran === 'Lunas'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {transaction.status_pembayaran}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </DialogTitle>
            <DialogDescription>
              Masukkan data pembayaran dan obat
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {!editingTransaction && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pasien">Pilih Pasien *</Label>
                  <Select
                    value={formData.pasien_id}
                    onValueChange={(value) => {
                      const patient = patients.find(p => p.userId === value);
                      setFormData({
                        ...formData,
                        pasien_id: value,
                        pasien_nama: patient?.nama || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pasien..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.userId} value={patient.userId}>
                          {patient.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="obat">Nama Obat *</Label>
              <Input
                id="obat"
                value={formData.obat}
                onChange={(e) => setFormData({ ...formData, obat: e.target.value })}
                placeholder="Paracetamol 500mg, Amoxicillin..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga">Harga (Rp) *</Label>
              <Input
                id="harga"
                type="number"
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })}
                placeholder="50000"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Pembayaran *</Label>
              <Select
                value={formData.status_pembayaran}
                onValueChange={(value) => setFormData({ ...formData, status_pembayaran: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
                  <SelectItem value="Lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
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
