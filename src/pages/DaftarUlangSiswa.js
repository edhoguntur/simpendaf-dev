import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Box, Paper, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, MenuItem, InputAdornment, Tooltip, TablePagination, Typography
} from '@mui/material';
import {
  Edit, Delete, Search, Visibility
} from '@mui/icons-material';
import { db } from '../firebase';
import {
  collection, getDocs, query, where, deleteDoc, doc
} from 'firebase/firestore';
import HeaderPimpinan from '../components/HeaderPimpinan';
import HeaderPresenter from '../components/HeaderPresenter';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import FormDaftarUlang from '../components/FormDaftarUlang';
import DetailDataDialog from '../components/DetailDataDialog';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DaftarUlangSiswa = () => {
  const { userData } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [gelombangList, setGelombangList] = useState([]);
  const [filterGelombang, setFilterGelombang] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const fetchData = useCallback(async () => {
    if (!userData) return;

    try {
      let result = [];

      if (userData?.role === 'pimpinan') {
        // Pimpinan dapat melihat semua data daftar ulang
        const snapshot = await getDocs(collection(db, 'daftar_ulang'));
        result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (userData?.role === 'presenter') {
        if (userData?.cabangOffice) {
          // Presenter hanya bisa melihat data daftar ulang sesuai cabangOffice mereka
          const query1 = query(
            collection(db, 'daftar_ulang'),
            where('cabangOffice', '==', userData.cabangOffice)
          );

          const snapshot = await getDocs(query1);
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          // Jika presenter tidak memiliki cabangOffice, tidak tampilkan data apapun
          console.warn('Presenter tidak memiliki cabangOffice:', userData);
          result = [];
        }
      } else {
        // Fallback: jika role tidak dikenali atau data user tidak lengkap
        console.warn('User role tidak dikenali atau data tidak lengkap:', userData);
        setData([]);
        return;
      }

      console.log('Fetched data:', result);
      setData(result);
    } catch (error) {
      console.error('Error fetching daftar ulang data:', error);
      alert('Gagal memuat data daftar ulang. Silakan coba lagi.');
    }
  }, [userData]);

  useEffect(() => {
    fetchData();
    fetchGelombang();
  }, [fetchData]);

  const fetchGelombang = async () => {
    const snapshot = await getDocs(collection(db, 'gelombang'));
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGelombangList(result);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Yakin ingin menghapus data ini?');
    if (!confirm) return;
    await deleteDoc(doc(db, 'daftar_ulang', id));
    fetchData();
  };

  const handleExport = async () => {
    let exportSource = [];

    if (filterGelombang) {
      const q = query(collection(db, 'daftar_ulang'), where('idGelombang', '==', filterGelombang));
      const snapshot = await getDocs(q);
      exportSource = snapshot.docs.map(doc => doc.data());
    } else {
      const snapshot = await getDocs(collection(db, 'daftar_ulang'));
      exportSource = snapshot.docs.map(doc => doc.data());
    }

    const exportData = exportSource.map(item => ({
      'Nomor Pendaftaran': item.nomorPendaftaran || '',
      'Nama Pendaftar': item.namaPendaftar || '',
      'Nomor WA': item.nomorWA || '',
      'Email': item.email || '',
      'Jenis Kelamin': item.gender || item.jenisKelamin || '',
      'Asal Sekolah': item.asalSekolah || '',
      'Jurusan': item.jurusan || '',
      'Ukuran Kaos': item.ukuranKaos || '',
      'Presenter': Array.isArray(item.presenter) ? item.presenter.join(', ') : (item.presenter || ''),
      'DU Tahap 1': item.duTahap1 || '',
      'Tanggal DU 1': item.tglDU1 || '',
      'DU Tahap 2': item.duTahap2 || '',
      'Tanggal DU 2': item.tglDU2 || '',
      'Cara Daftar': item.caraDaftar || '',
      'Cabang Office': item.inputBy || item.cabangOffice || '',
      'Waktu Input': item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('id-ID') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Ulang');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'daftar_ulang.xlsx');
  };


  const filteredData = data.filter(item => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      item.namaPendaftar?.toLowerCase().includes(keyword) ||
      item.nomorPendaftaran?.toLowerCase().includes(keyword);
    const matchesGelombang = !filterGelombang || item.idGelombang === filterGelombang;

    // Filter dengan bulan dan tahun
    let matchesMonthYear = true;
    if (item.tglDU1) {
      const [itemYear, itemMonth] = item.tglDU1.split('-');
      matchesMonthYear =
        (!month || parseInt(itemMonth) === parseInt(month)) &&
        (!year || parseInt(itemYear) === parseInt(year));
    }
    return matchesSearch && matchesGelombang && matchesMonthYear;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {userData?.role === 'pimpinan' ? <HeaderPimpinan /> : <HeaderPresenter />}
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleExport}>
            📤 EXPORT EXCEL
          </Button>
          <TextField
            label="Cari nama atau nomor pendaftaran"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <TextField
            select
            label="Filter Gelombang"
            value={filterGelombang}
            onChange={(e) => setFilterGelombang(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Semua Gelombang</MenuItem>
            {gelombangList.map(g => (
              <MenuItem key={g.id} value={g.id}>{g.namaGelombang}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Bulan"
            value={month}
            onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">Semua Bulan</MenuItem>
            {monthNames.map((name, idx) => (
              <MenuItem key={idx + 1} value={idx + 1}>{name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Tahun"
            value={year}
            onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="">Semua Tahun</MenuItem>
            {Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Paper>

        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                Data Daftar Ulang Siswa
              </Typography>
              {userData?.role === 'presenter' && userData?.cabangOffice && (
                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                  Filter: {userData.cabangOffice}
                </Typography>
              )}
              {userData?.role === 'presenter' && !userData?.cabangOffice && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  Peringatan: Anda belum memiliki cabang office yang terdaftar
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Menampilkan {paginatedData.length} dari {filteredData.length} data
            </Typography>
          </Box>

          <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nomor Pendaftaran</TableCell>
                <TableCell>Nama</TableCell>
                <TableCell>WA</TableCell>
                <TableCell>Asal Sekolah</TableCell>
                <TableCell>DU Tahap 1</TableCell>
                <TableCell>Tgl DU 1</TableCell>
                <TableCell>DU Tahap 2</TableCell>
                <TableCell>Tgl DU 2</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{item.nomorPendaftaran}</TableCell>
                  <TableCell>{item.namaPendaftar}</TableCell>
                  <TableCell>{item.nomorWA}</TableCell>
                  <TableCell>{item.asalSekolah}</TableCell>
                  <TableCell>{item.duTahap1}</TableCell>
                  <TableCell>{item.tglDU1}</TableCell>
                  <TableCell>{item.duTahap2}</TableCell>
                  <TableCell>{item.tglDU2}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Data">
                      <IconButton onClick={() => { setEditingData(item); setOpenDrawer(true); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Lihat Detail">
                      <IconButton onClick={() => { setSelectedDetail(item); setOpenDetail(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton onClick={() => handleDelete(item.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 50, 100]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
          }
        />
        </Paper>
      </Box>

      {/* Drawer & Dialog */}
      {openDrawer && (
        <FormDaftarUlang
          open={openDrawer}
          onClose={() => { setOpenDrawer(false); setEditingData(null); }}
          fetchDaftarUlang={fetchData}
          isEditData={true}
          dataPendaftar={editingData}
        />
      )}

      {openDetail && (
        <DetailDataDialog
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          data={selectedDetail}
        />
      )}
    </Box>
  );
};

export default DaftarUlangSiswa;
