import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Paper, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, MenuItem, InputAdornment, Tooltip,
  TablePagination, Typography
} from '@mui/material';
import {
  Edit, Delete, Search, ArrowUpward, ArrowDownward,
  FileDownload, Visibility, HowToReg
} from '@mui/icons-material';
import HeaderPimpinan from '../components/HeaderPimpinan';
import HeaderPresenter from '../components/HeaderPresenter';
import FormPendaftaranSiswa from '../components/FormPendaftaranSiswa';
import DetailPendaftaranDialog from '../components/DetailPendaftaranDialog';
import FormDaftarUlang from '../components/FormDaftarUlang';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection, getDocs, query, where, deleteDoc, doc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const currentDate = new Date();
const currentYear = currentDate.getFullYear();

const PendaftaranSiswa = () => {
  const { userData } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterGelombang, setFilterGelombang] = useState('');
  const [gelombangList, setGelombangList] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'tglDaftar', direction: 'desc' });
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [selectedPendaftar, setSelectedPendaftar] = useState(null);
  const [openDrawerDaftarUlang, setOpenDrawerDaftarUlang] = useState(false);
  const [daftarUlangIds, setDaftarUlangIds] = useState([]);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleDaftarUlangClick = async (item) => {
    const snapshot = await getDocs(
      query(collection(db, 'daftar_ulang'), where('idPendaftar', '==', item.id))
    );

    if (!snapshot.empty) {
      alert('Siswa sudah melakukan daftar ulang. Hapus data daftar ulang terlebih dahulu untuk mengisi ulang.');
      return;
    }

    setSelectedPendaftar(item);
    setOpenDrawerDaftarUlang(true);
  };

  useEffect(() => {
    fetchGelombang();
    fetchData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [search, filterGelombang, month, year]);

  const fetchGelombang = async () => {
    const snapshot = await getDocs(collection(db, 'gelombang'));
    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGelombangList(result);
  };

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'pendaftaran_siswa'));
    const daftarUlangSnap = await getDocs(collection(db, 'daftar_ulang'));

    const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const daftarUlangList = daftarUlangSnap.docs.map(doc => doc.data().nomorPendaftaran);

    setData(result);
    setDaftarUlangIds(daftarUlangList);
  };

  const handleEdit = (row) => {
    setEditingData(row);
    setOpenDrawer(true);
  };

  const handleDelete = async (id, nomorPendaftaran) => {
    if (daftarUlangIds.includes(nomorPendaftaran)) {
      alert('Tidak bisa menghapus. Siswa ini sudah melakukan daftar ulang. Hapus data daftar ulang terlebih dahulu.');
      return;
    }

    const confirm = window.confirm('Yakin ingin menghapus data ini?');
    if (!confirm) return;

    await deleteDoc(doc(db, 'pendaftaran_siswa', id));
    fetchData();
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    // Special handling for date sorting
    if (sortConfig.key === 'tglDaftar') {
      const aDate = new Date(a.tglDaftar);
      const bDate = new Date(b.tglDaftar);
      if (sortConfig.direction === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    }

    // Default string sorting for other fields
    const aVal = a[sortConfig.key]?.toString().toLowerCase();
    const bVal = b[sortConfig.key]?.toString().toLowerCase();
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter((item) => {
    const keyword = search.toLowerCase();
    const matchesSearch = (
      item.namaPendaftar?.toLowerCase().includes(keyword) ||
      item.nomorPendaftaran?.toLowerCase().includes(keyword) ||
      item.asalSekolah?.toLowerCase().includes(keyword)
    );
    const matchesGelombang = !filterGelombang || item.idGelombang === filterGelombang;

    // Filter by month and year if selected
    let matchesMonthYear = true;
    if (item.tglDaftar) {
      const [itemYear, itemMonth] = item.tglDaftar.split('-');
      matchesMonthYear =
        (!month || parseInt(itemMonth) === parseInt(month)) &&
        (!year || parseInt(itemYear) === parseInt(year));
    }
    return matchesSearch && matchesGelombang && matchesMonthYear;
  });

  // Get paginated data for display
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Generate year options start from 2020 to current year desc
  const yearOptions = [];
  for (let y = currentYear; y >= 2020; y--) {
    yearOptions.push(y);
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    // Export uses filteredData (all filtered data, not paginated)
    const exportData = filteredData.map(item => {
      const gel = gelombangList.find(g => g.id === item.idGelombang);
      return {
        'Nomor Pendaftaran': item.nomorPendaftaran,
        'Tanggal Daftar': item.tglDaftar,
        'Nama Pendaftar': item.namaPendaftar,
        'Nomor WA': item.nomorWA,
        'Email': item.email,
        'Asal Sekolah': item.asalSekolah,
        'Jurusan': item.jurusan,
        'Biaya Pendaftaran': item.biayaPendaftaran,
        'Jenis Potongan': item.jenisPotongan || 'Tanpa Potongan',
        'Jumlah Potongan': item.jumlahPotongan || 0,
        'Total Biaya Pendaftaran': item.totalBiayaPendaftaran || item.biayaPendaftaran,
        'No Kwitansi': item.noKwitansi,
        'Presenter': Array.isArray(item.presenter) ? item.presenter.join(', ') : item.presenter || '',
        'Cara Daftar': item.caraDaftar,
        'Sumber Informasi': item.sumberInformasi || '',
        'Keterangan': item.ket,
        'Cabang Office': item.cabangOffice || '',
        'Nama Gelombang': gel?.namaGelombang || '(tidak ditemukan)'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendaftar');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create filename with current filters for clarity
    let filename = 'pendaftaran_siswa';
    if (filterGelombang) {
      const gelombang = gelombangList.find(g => g.id === filterGelombang);
      filename += `_${gelombang?.namaGelombang || 'gelombang'}`;
    }
    if (month) {
      filename += `_${monthNames[month - 1]}`;
    }
    if (year) {
      filename += `_${year}`;
    }
    filename += '.xlsx';

    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), filename);
  };

  return (
    <Box>
      {userData?.role === 'pimpinan' ? <HeaderPimpinan /> : <HeaderPresenter />}
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => { setOpenDrawer(true); setEditingData(null); }}>
            Tambah Data
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export Excel ({filteredData.length} data)
          </Button>
          <TextField
            label="Cari..."
            variant="outlined"
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
            {yearOptions.map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Paper>

        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Data Pendaftaran Siswa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Menampilkan {paginatedData.length} dari {filteredData.length} data
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell
                    onClick={() => handleSort('nomorPendaftaran')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Nomor Pendaftaran {getSortIcon('nomorPendaftaran')}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('namaPendaftar')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Nama {getSortIcon('namaPendaftar')}
                  </TableCell>
                  <TableCell>WA</TableCell>
                  <TableCell
                    onClick={() => handleSort('asalSekolah')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Sekolah {getSortIcon('asalSekolah')}
                  </TableCell>
                  <TableCell>Jurusan</TableCell>
                  <TableCell>Tgl Daftar</TableCell>
                  <TableCell>Jenis Potongan</TableCell>
                  <TableCell>Total Biaya Pendaftaran</TableCell>
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
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.jurusan}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.tglDaftar}</TableCell>
                    <TableCell>{item.jenisPotongan || 'Tanpa Potongan'}</TableCell>
                    <TableCell align='center'>{item.totalBiayaPendaftaran}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit Data Pendaftaran">
                        <IconButton onClick={() => handleEdit(item)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hapus Data">
                        <IconButton onClick={() => handleDelete(item.id, item.nomorPendaftaran)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Lihat Detail">
                        <IconButton onClick={() => { setSelectedDetail(item); setOpenDetail(true); }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Isi Form Daftar Ulang">
                        <IconButton
                          onClick={() => handleDaftarUlangClick(item)}
                          color={daftarUlangIds.includes(item.nomorPendaftaran) ? 'primary' : 'default'}
                        >
                          <HowToReg fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Tidak ada data yang ditemukan
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
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
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
            }
          />
        </Paper>
      </Box>

      <FormPendaftaranSiswa
        open={openDrawer}
        onClose={() => { setOpenDrawer(false); setEditingData(null); }}
        fetchData={fetchData}
        editingData={editingData}
      />

      <DetailPendaftaranDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        data={selectedDetail}
      />

      <FormDaftarUlang
        open={openDrawerDaftarUlang}
        onClose={() => {
          setOpenDrawerDaftarUlang(false);
          setSelectedPendaftar(null);
        }}
        dataPendaftar={selectedPendaftar}
        isEditData={false}
        fetchDaftarUlang={fetchData}
      />
    </Box>
  );
};

export default PendaftaranSiswa;
