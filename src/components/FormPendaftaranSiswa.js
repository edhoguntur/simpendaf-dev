import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Box, Button, Drawer, IconButton, TextField, Typography, MenuItem,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const FormPendaftaranSiswa = ({ open, onClose, fetchData, editingData }) => {
  const { userData } = useContext(AuthContext);

  // Helper fungsi untuk mengubah format mata uang
  const parseCurrency = useCallback((value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/\./g, ''));
  }, []);

  // Helper fungsi untuk format nilai mata uang
  const formatCurrency = useCallback((value) => {
    if (!value) return '0';
    // Jika value sudah berformat (mengandung titik), parse dulu
    const numericValue = typeof value === 'string' && value.includes('.')
      ? parseCurrency(value)
      : parseInt(value);
    return numericValue.toLocaleString('id-ID');
  }, [parseCurrency]);

  const [form, setForm] = useState({
    tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
    jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '', presenter: [],
    caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '', totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: ''
  });
  const [biayaJurusanList, setBiayaJurusanList] = useState([]);
  const [jurusanMasterList, setJurusanMasterList] = useState([]);
  const [kantorList, setKantorList] = useState([]);
  const [presenterList, setPresenterList] = useState([]);
  const [gelombangList, setGelombangList] = useState([]);
  const [jenisPotonganList, setJenisPotonganList] = useState([]);
  const [sumberList, setSumberList] = useState([]);
  const [metodeList, setMetodeList] = useState([]);
  const [jalurList, setJalurList] = useState([]);
  const [biayaList, setBiayaList] = useState([]);

  useEffect(() => {
    // Ambil data biaya jurusan berdasarkan cabang office
    getDocs(collection(db, 'biaya_jurusan')).then(snapshot => {
      setBiayaJurusanList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil data master jurusan
    getDocs(collection(db, 'daftar_jurusan')).then(snapshot => {
      setJurusanMasterList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil data kantor untuk mendapatkan nama cabang office
    getDocs(collection(db, 'kantor')).then(snapshot => {
      setKantorList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    getDocs(collection(db, 'presenter')).then(snapshot => {
      setPresenterList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'gelombang')).then(snapshot => {
      setGelombangList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    getDocs(collection(db, 'potongan_biaya')).then(snapshot => {
      setJenisPotonganList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    getDocs(collection(db, 'sumber_informasi')).then(snapshot => {
      setSumberList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'metode_bayar')).then(snapshot => {
      setMetodeList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'jalur_pendaftaran')).then(snapshot => {
      setJalurList(snapshot.docs.map(doc => doc.data()));
    });
    getDocs(collection(db, 'biaya_pendaftaran')).then(snapshot => {
      setBiayaList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // Fungsi untuk mendapatkan list jurusan yang tersedia berdasarkan cabangOffice user
  const getAvailableJurusan = useCallback(() => {
    if (!biayaJurusanList.length || !jurusanMasterList.length || !kantorList.length) return [];

    // Filter biaya jurusan berdasarkan cabang office user
    let filteredBiayaJurusan = biayaJurusanList;

    // Jika user adalah presenter, hanya tampilkan jurusan untuk cabangOffice yang sama
    if (userData?.role === 'presenter' && userData?.cabangOffice) {
      // cabangOffice sekarang menyimpan nama kantor langsung (value), bukan ID
      filteredBiayaJurusan = biayaJurusanList.filter(bj => bj.cabangOffice === userData.cabangOffice);
    }

    // Gabungkan dengan data master jurusan dan kantor untuk mendapatkan kode, nama, dan cabang office
    return filteredBiayaJurusan.map(biayaJurusan => {
      const masterJurusan = jurusanMasterList.find(jm => jm.id === biayaJurusan.jurusanId);
      // cabangOffice sudah berisi nama kantor langsung
      const namaKantor = biayaJurusan.cabangOffice || 'Kantor tidak ditemukan';

      return {
        ...biayaJurusan,
        kode: masterJurusan?.kode || '',
        nama: masterJurusan?.nama || '',
        namaKantor: namaKantor,
        displayName: masterJurusan && namaKantor
          ? `${masterJurusan.kode} - ${masterJurusan.nama} - ${namaKantor}`
          : 'Data tidak lengkap'
      };
    });
  }, [biayaJurusanList, jurusanMasterList, kantorList, userData]);

  // Fungsi untuk mendapatkan biaya pendaftaran yang tersedia berdasarkan cabangOffice user
  const getAvailableBiayaPendaftaran = useCallback(() => {
    if (!biayaList.length) return [];

    // Jika user adalah presenter, hanya tampilkan biaya pendaftaran untuk cabangOffice yang sama
    if (userData?.role === 'presenter' && userData?.cabangOffice) {
      // cabangOffice sekarang menyimpan nama kantor langsung (value), bukan ID
      return biayaList.filter(b => b.cabangOffice === userData.cabangOffice);
    }

    // Jika user adalah pimpinan, tampilkan semua biaya pendaftaran
    return biayaList;
  }, [biayaList, userData]);

  // Fungsi untuk mendapatkan potongan biaya yang tersedia berdasarkan cabangOffice user
  const getAvailablePotonganBiaya = useCallback(() => {
    if (!jenisPotonganList.length) return [];

    // Jika user adalah presenter, hanya tampilkan potongan biaya untuk cabangOffice yang sama
    if (userData?.role === 'presenter' && userData?.cabangOffice) {
      // cabangOffice sekarang menyimpan nama kantor langsung (value), bukan ID
      return jenisPotonganList.filter(p => p.cabangOffice === userData.cabangOffice);
    }

    // Jika user adalah pimpinan, tampilkan semua potongan biaya
    return jenisPotonganList;
  }, [jenisPotonganList, userData]);

  useEffect(() => {
    if (editingData) {
      // Validasi permission untuk presenter saat edit
      if (userData?.role === 'presenter') {
        // Presenter dapat mengedit data dari cabangOffice yang sama
        if (editingData.cabangOffice !== userData.cabangOffice) {
          alert('Anda tidak memiliki permission untuk mengedit data ini. Data ini bukan dari cabang office Anda.');
          onClose();
          return;
        }
      }

      setForm({
        ...editingData,
        presenter: editingData.presenter || [],
        jenisPotongan: editingData.jenisPotongan || '',
        jumlahPotongan: editingData.jumlahPotongan || '',
        biayaJurusan: editingData.biayaJurusan ? formatCurrency(editingData.biayaJurusan) : '',
        totalBiayaPendaftaran: editingData.totalBiayaPendaftaran ? formatCurrency(editingData.totalBiayaPendaftaran) : (editingData.biayaPendaftaran ? formatCurrency(editingData.biayaPendaftaran) : ''),
        totalBiayaJurusan: editingData.totalBiayaJurusan ? formatCurrency(editingData.totalBiayaJurusan) : (editingData.biayaJurusan ? formatCurrency(editingData.biayaJurusan) : ''),
        jalurPendaftaran: editingData.jalurPendaftaran || '',
        sumberInformasi: editingData.sumberInformasi || ''
      });
    } else {
      // Inisialisasi form baru
      setForm({
        tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
        jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
        presenter: [], // Tidak ada default presenter, user harus pilih sendiri
        caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
        totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: ''
      });
    }
  }, [editingData, userData, onClose, formatCurrency, parseCurrency]);

  const generateNomorPendaftaran = async (tgl) => {
    const dateStr = tgl.replace(/-/g, '');
    const qGel = gelombangList.find(g => g.tanggalMulai <= tgl && g.tanggalAkhir >= tgl);
    if (!qGel) {
      alert('Tanggal daftar tidak masuk dalam rentang gelombang manapun!');
      return { nomorPendaftaran: '', idGelombang: '' };
    }

    const snapshot = await getDocs(query(collection(db, 'pendaftaran_siswa'), where('idGelombang', '==', qGel.id)));
    const urutan = snapshot.size + 1;
    const nomor = `${dateStr}-${urutan.toString().padStart(3, '0')}`;
    return { nomorPendaftaran: nomor, idGelombang: qGel.id };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tglDaftar || !form.namaPendaftar || !form.jurusan) return;

    try {
      // Validasi email format jika diisi
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        alert('Format email tidak valid.');
        return;
      }

      // Validasi presenter harus dipilih
      if (!form.presenter || form.presenter.length === 0) {
        alert('Silakan pilih minimal satu presenter.');
        return;
      }

    // Ambil informasi lengkap jurusan yang dipilih
    const selectedJurusanInfo = getAvailableJurusan().find(j => j.displayName === form.jurusan);

    // Validasi keamanan: pastikan data yang dipilih sesuai dengan cabangOffice user (khusus presenter)
    if (userData?.role === 'presenter' && userData?.cabangOffice) {
      // cabangOffice sekarang menyimpan nama kantor langsung (value), bukan ID
      const userCabangOffice = userData.cabangOffice;

      // Validasi jurusan
      if (selectedJurusanInfo?.cabangOffice !== userCabangOffice) {
        alert('Error: Jurusan yang dipilih tidak sesuai dengan cabang office Anda.');
        return;
      }

      // Validasi biaya pendaftaran jika ada
      if (form.biayaPendaftaran) {
        const selectedBiayaPendaftaran = getAvailableBiayaPendaftaran().find(b => b.jumlahBiayaPendaftaran === form.biayaPendaftaran);
        if (selectedBiayaPendaftaran?.cabangOffice !== userCabangOffice) {
          alert('Error: Biaya pendaftaran yang dipilih tidak sesuai dengan cabang office Anda.');
          return;
        }
      }

      // Validasi potongan biaya jika ada
      if (form.jenisPotongan) {
        const selectedPotongan = getAvailablePotonganBiaya().find(p => p.jenisPotongan === form.jenisPotongan);
        if (selectedPotongan?.cabangOffice !== userCabangOffice) {
          alert('Error: Potongan biaya yang dipilih tidak sesuai dengan cabang office Anda.');
          return;
        }
      }
    }

    // Tentukan cabangOffice yang akan disimpan (sekarang langsung gunakan value)
    let cabangOfficeToSave = userData?.cabangOffice || '';

    if (editingData?.id) {
      await updateDoc(doc(db, 'pendaftaran_siswa', editingData.id), {
        ...form,
        jurusanKode: selectedJurusanInfo?.kode || '',
        jurusanNama: selectedJurusanInfo?.nama || '',
        biayaJurusan: parseCurrency(form.biayaJurusan).toString(),
        totalBiayaPendaftaran: parseCurrency(form.totalBiayaPendaftaran).toString(),
        totalBiayaJurusan: parseCurrency(form.totalBiayaJurusan).toString(),
        sumberInformasi: form.sumberInformasi,
        cabangOffice: cabangOfficeToSave
      });
    } else {
      const { nomorPendaftaran, idGelombang } = await generateNomorPendaftaran(form.tglDaftar);

      // Validasi hasil generate nomor pendaftaran
      if (!nomorPendaftaran || !idGelombang) {
        alert('Gagal generate nomor pendaftaran. Pastikan tanggal daftar valid.');
        return;
      }
      await addDoc(collection(db, 'pendaftaran_siswa'), {
        nomorPendaftaran,
        tglDaftar: form.tglDaftar,
        idGelombang,
        namaPendaftar: form.namaPendaftar,
        nomorWA: form.nomorWA,
        email: form.email,
        asalSekolah: form.asalSekolah,
        jurusan: form.jurusan,
        jurusanKode: selectedJurusanInfo?.kode || '',
        jurusanNama: selectedJurusanInfo?.nama || '',
        biayaJurusan: parseCurrency(form.biayaJurusan).toString(),
        biayaPendaftaran: form.biayaPendaftaran,
        jalurPendaftaran: form.jalurPendaftaran,
        noKwitansi: form.noKwitansi,
        presenter: form.presenter,
        caraDaftar: form.caraDaftar,
        ket: form.ket,
        cabangOffice: cabangOfficeToSave,
        jenisPotongan: form.jenisPotongan,
        jumlahPotongan: form.jumlahPotongan,
        totalBiayaPendaftaran: parseCurrency(form.totalBiayaPendaftaran).toString(),
        totalBiayaJurusan: parseCurrency(form.totalBiayaJurusan).toString(),
        sumberInformasi: form.sumberInformasi
      });
    }
    fetchData();
    onClose();

    // Reset form
    setForm({
      tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
      jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
      presenter: [], // Reset presenter kosong
      caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
      totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: ''
    });
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'jurusan') {
      // Cari biaya jurusan berdasarkan jurusan yang dipilih dari biaya_jurusan collection
      const availableJurusan = getAvailableJurusan();
      const selectedJurusan = availableJurusan.find(j => j.displayName === value);
      const biayaJurusan = selectedJurusan ? selectedJurusan.biaya || '0' : '0';

      // Hitung ulang total biaya jurusan jika ada potongan
      const jumlahPotongan = parseCurrency(form.jumlahPotongan);
      const biayaJurusanNum = parseCurrency(biayaJurusan);
      const potonganValid = Math.min(jumlahPotongan, biayaJurusanNum);
      const totalBiayaJurusan = Math.max(biayaJurusanNum - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        jurusan: value,
        biayaJurusan: formatCurrency(biayaJurusan),
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan),
        // Reset potongan jika jurusan berubah dan biaya baru lebih kecil dari potongan
        jumlahPotongan: biayaJurusanNum === 0 ? '' : Math.min(jumlahPotongan, biayaJurusanNum).toString(),
        jenisPotongan: biayaJurusanNum === 0 ? '' : prev.jenisPotongan
      }));
    } else if (name === 'biayaPendaftaran') {
      // Total biaya pendaftaran = biaya pendaftaran saja (tanpa potongan)
      setForm(prev => ({
        ...prev,
        [name]: value,
        totalBiayaPendaftaran: formatCurrency(value)
      }));
    } else if (name === 'jenisPotongan') {
      // Jenis potongan mengurangi biaya jurusan
      const availablePotongan = getAvailablePotonganBiaya();
      const selected = availablePotongan.find(d => d.jenisPotongan === value);
      const jumlahPotongan = selected ? parseCurrency(selected.jumlahPotongan) : 0;
      const biayaJurusan = parseCurrency(form.biayaJurusan);
      const potonganValid = Math.min(jumlahPotongan, biayaJurusan);
      const totalBiayaJurusan = Math.max(biayaJurusan - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        jenisPotongan: value,
        jumlahPotongan: selected ? potonganValid.toString() : '',
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan)
      }));
    } else if (name === 'jumlahPotongan') {
      // Manual input potongan mengurangi biaya jurusan
      const biayaJurusan = parseCurrency(form.biayaJurusan);
      const jumlahPotongan = parseCurrency(value);
      const potonganValid = Math.min(jumlahPotongan, biayaJurusan);
      const totalBiayaJurusan = Math.max(biayaJurusan - potonganValid, 0);

      setForm(prev => ({
        ...prev,
        jumlahPotongan: value,
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan)
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // const handleChange = (e) => {
  //   setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  // };

  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: '75vw' } }}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editingData ? 'Edit Pendaftaran Siswa' : 'Tambah Pendaftaran Siswa'}</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Kolom kiri */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField type="date" label="Tanggal Daftar" name="tglDaftar" value={form.tglDaftar} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} required />
              <TextField label="Nama Pendaftar" name="namaPendaftar" value={form.namaPendaftar} onChange={handleChange} fullWidth />
              <TextField label="Nomor WA" name="nomorWA" value={form.nomorWA} onChange={handleChange} fullWidth />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              <TextField label="Asal Sekolah" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} fullWidth />
              <TextField select label="Jurusan" name="jurusan" value={form.jurusan} onChange={handleChange} fullWidth>
                {getAvailableJurusan().map((j, i) => (
                  <MenuItem key={i} value={j.displayName}>{j.displayName}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Biaya Jurusan"
                name="biayaJurusan"
                value={form.biayaJurusan ? `Rp ${form.biayaJurusan}` : ''}
                fullWidth
                disabled
              />
              <TextField
                select
                label="Biaya Pendaftaran"
                name="biayaPendaftaran"
                value={form.biayaPendaftaran}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">Pilih Biaya Pendaftaran</MenuItem>
                {getAvailableBiayaPendaftaran().map((b, i) => (
                  <MenuItem key={i} value={b.jumlahBiayaPendaftaran}>
                    {b.jenisBiayaPendaftaran} - Rp {b.jumlahBiayaPendaftaran}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Jenis Potongan"
                name="jenisPotongan"
                value={form.jenisPotongan || ''}
                onChange={handleChange}
                fullWidth
                disabled={parseCurrency(form.biayaJurusan) === 0}
              >
                <MenuItem value="">Tanpa Potongan Biaya</MenuItem>
                {getAvailablePotonganBiaya().map((d, i) => (
                  <MenuItem key={i} value={d.jenisPotongan}>{d.jenisPotongan}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Jumlah Potongan"
                name="jumlahPotongan"
                value={form.jumlahPotongan ? `Rp ${formatCurrency(form.jumlahPotongan)}` : ''}
                fullWidth
                disabled={parseCurrency(form.biayaJurusan) === 0}
              />
              <TextField
                label="Total Biaya Pendaftaran"
                name="totalBiayaPendaftaran"
                value={form.totalBiayaPendaftaran ? `Rp ${form.totalBiayaPendaftaran}` : ''}
                fullWidth
                disabled
              />
              {/* Total Biaya Jurusan tetap dihitung di background tapi tidak ditampilkan di UI */}
            </Box>

            {/* Kolom kanan */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="No Kwitansi" name="noKwitansi" value={form.noKwitansi} onChange={handleChange} fullWidth />

              <Box>
                <Typography sx={{ mb: 1 }}>Pilih Presenter</Typography>
                <ToggleButtonGroup
                  value={form.presenter}
                  onChange={(e, newVal) => {
                    // Semua user bisa memilih presenter manapun
                    setForm(prev => ({ ...prev, presenter: newVal }));
                  }}
                  multiple
                  color="primary"
                  size="small"
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  {presenterList.map((p, i) => (
                    <ToggleButton
                      key={i}
                      value={p.namaLengkap}
                      selected={form.presenter.includes(p.namaLengkap)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        borderColor: '#1976d2',
                        '&.Mui-selected': {
                          backgroundColor: '#1976d2',
                          color: '#fff',
                        },
                        '&:hover': {
                          backgroundColor: '#1565c0',
                          color: '#fff'
                        }
                      }}
                    >
                      {p.namaLengkap}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <TextField select label="Cara Daftar" name="caraDaftar" value={form.caraDaftar} onChange={handleChange} fullWidth>
                {/* <MenuItem value="CASH">CASH</MenuItem>
                <MenuItem value="TF">TF</MenuItem>
                <MenuItem value="CICIL">CICIL</MenuItem> */}
                <MenuItem value="">Pilih Metode Pembayaran</MenuItem>
                {metodeList.map((s, i) => (
                  <MenuItem key={i} value={s.idcode}>{s.idcode}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sumber Informasi"
                name="sumberInformasi"
                value={form.sumberInformasi}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">Pilih Sumber Informasi</MenuItem>
                {sumberList.map((s, i) => (
                  <MenuItem key={i} value={s.sumber}>{s.sumber}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Jalur Pendaftaran"
                name="jalurPendaftaran"
                value={form.jalurPendaftaran}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">Pilih Jalur Pendaftaran</MenuItem>
                {jalurList.map((j, i) => (
                  <MenuItem key={i} value={j.jalurPendaftaran}>{j.jalurPendaftaran}</MenuItem>
                ))}
              </TextField>
              <TextField label="Keterangan" name="ket" value={form.ket} onChange={handleChange} fullWidth multiline minRows={3} />
            </Box>
          </Box>

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            {editingData ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </form>

      </Box>
    </Drawer>
  );
};

export default FormPendaftaranSiswa;
