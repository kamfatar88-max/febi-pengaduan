// script.js
const API_URL = "https://script.google.com/macros/s/AKfycbxwBLjbdKMq5-IEO7a-R1LqW7NaGlE0W5ECacG49t8mynEHAvvlvFP-jU9UZiXlUsB0/exec";

// Tab Switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "respon") loadAduanForRespon();
    if (btn.dataset.tab === "data") loadDataAduan();
    if (btn.dataset.tab === "statistik") loadStatistik();
  });
});

// Submit Aduan
document.getElementById("formAduan").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = document.getElementById("nama").value.trim();
  const jabatan = document.getElementById("jabatan").value;
  const isi = document.getElementById("isi").value.trim();

  if (!nama || !jabatan || !isi) {
    alert("Semua field harus diisi!");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "submitAduan",
        nama,
        jabatan,
        isi
      })
    });

    const data = await res.json();
    if (data.status === "success") {
      document.getElementById("statusAduan").textContent = `✅ Aduan berhasil dikirim! ID: ${data.id}`;
      document.getElementById("formAduan").reset();
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    document.getElementById("statusAduan").textContent = `❌ Gagal kirim: ${error.message || "Cek koneksi"}`;
  }
});

// Load Aduan untuk Respon
async function loadAduanForRespon() {
  const container = document.getElementById("listAduanRespon");
  container.innerHTML = "Memuat data...";

  try {
    const res = await fetch(API_URL + "?action=getAllAduan");
    const text = await res.text();

    // Cek apakah respons adalah HTML (artinya login diperlukan)
    if (text.trim().startsWith("<")) {
      container.innerHTML = `
        ❌ Gagal memuat data: Akses ditolak.<br>
        <strong>Solusi:</strong> Di Google Apps Script, saat deploy, pilih <strong>"Anyone"</strong>!<br>
        <small><a href="https://script.google.com/home" target="_blank">Buka Apps Script</a></small>
      `;
      console.error("HTML response detected. Likely login page.");
      return;
    }

    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      container.innerHTML = "❌ Data tidak valid. Harus array.";
      return;
    }

    if (data.length === 0) {
      container.innerHTML = "Belum ada aduan.";
      return;
    }

    container.innerHTML = "";
    data.forEach(item => {
      const id = item.id || item["id"];
      const nama = item.nama || "Anonim";
      const jabatan = item.jabatan || "Tidak diketahui";
      const isi = item.isi_aduan || item.isi || "-";

      const div = document.createElement("div");
      div.className = "aduan-item";
      div.innerHTML = `
        <h4>ID: ${id} | ${nama} (${jabatan})</h4>
        <p><strong>Aduan:</strong> ${isi}</p>
        <button class="btn-respon" onclick="showResponForm(${id})">Beri Respon</button>
        <div id="responForm-${id}"></div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = `❌ Gagal: ${error.message}`;
    console.error("Error loadAduanForRespon:", error);
  }
}

// Tampilkan Form Respon
function showResponForm(id) {
  const formDiv = document.getElementById(`responForm-${id}`);
  formDiv.innerHTML = `
    <div class="respon-form">
      <label>Identifikasi Masalah:<br><textarea id="identifikasi-${id}" required></textarea></label>
      <label>Sumber Masalah:<br><input type="text" id="sumber-${id}" required /></label>
      <label>Rencana Aksi:<br><textarea id="rencana-${id}" required></textarea></label>
      <label>Waktu Penyelesaian:<br><input type="date" id="waktu-${id}" required /></label>
      <label>Penanggung Jawab:<br><input type="text" id="penanggungjawab-${id}" required /></label>
      <button type="button" onclick="submitRespon(${id})">Simpan Respon</button>
    </div>
  `;
}

// Kirim Respon
async function submitRespon(id) {
  const identifikasi = document.getElementById(`identifikasi-${id}`).value.trim();
  const sumber = document.getElementById(`sumber-${id}`).value.trim();
  const rencana = document.getElementById(`rencana-${id}`).value.trim();
  const waktu = document.getElementById(`waktu-${id}`).value;
  const penanggungjawab = document.getElementById(`penanggungjawab-${id}`).value.trim();

  if (![identifikasi, sumber, rencana, waktu, penanggungjawab].every(Boolean)) {
    alert("Semua field respon harus diisi!");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "submitRespon",
        id,
        identifikasi,
        sumber,
        rencana,
        waktu,
        penanggungjawab
      })
    });

    const data = await res.json();
    if (data.status === "success") {
      alert("✅ Respon berhasil disimpan!");
      document.getElementById(`responForm-${id}`).innerHTML = "<p style='color:green'>Respon telah disimpan.</p>";
    } else {
      alert("❌ Gagal menyimpan respon.");
    }
  } catch (error) {
    alert("❌ Gagal kirim respon.");
    console.error(error);
  }
}

// Muat Data Aduan & Respon
async function loadDataAduan() {
  const container = document.getElementById("tabelData");
  container.innerHTML = "Memuat data gabungan...";

  try {
    const [aduanTxt, responTxt] = await Promise.all([
      fetch(API_URL + "?action=getAllAduan").then(r => r.text()),
      fetch(API_URL + "?action=getAllRespon").then(r => r.text())
    ]);

    // Cek apakah respons HTML (login page)
    if (aduanTxt.trim().startsWith("<")) {
      container.innerHTML = "❌ Akses ditolak. Pastikan deployment: <strong>Anyone</strong>.";
      return;
    }

    const aduanList = JSON.parse(aduanTxt);
    const responMap = responTxt.trim().startsWith("<") ? {} : JSON.parse(responTxt);

    if (!Array.isArray(aduanList)) {
      container.innerHTML = "❌ Data aduan tidak valid.";
      return;
    }

    let html = `
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; font-size:14px;">
        <tr style="background:#2c3e50; color:white;">
          <th>ID</th><th>Nama</th><th>Jabatan</th><th>Aduan</th>
          <th>Identifikasi</th><th>Sumber</th><th>Rencana</th><th>Waktu</th><th>Penanggung Jawab</th>
        </tr>
    `;

    aduanList.forEach(item => {
      const id = item.id;
      const respon = responMap[id] || {};
      html += `
        <tr>
          <td>${id}</td>
          <td>${item.nama || "-"}</td>
          <td>${item.jabatan || "-"}</td>
          <td>${item.isi || item.isi_aduan || "-"}</td>
          <td>${respon.identifikasi_masalah || "-"}</td>
          <td>${respon.sumber_masalah || "-"}</td>
          <td>${respon.rencana_aksi || "-"}</td>
          <td>${respon.waktu_penyelesaian || "-"}</td>
          <td>${respon.penanggung_jawab || "-"}</td>
        </tr>
      `;
    });

    html += "</table>";
    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = "❌ Gagal memuat data gabungan.";
    console.error(error);
  }
}

// Statistik
async function loadStatistik() {
  const container = document.getElementById("chartContainer");
  container.innerHTML = `
    <canvas id="jabatanChart" width="400" height="300"></canvas>
    <canvas id="statusChart" width="400" height="300"></canvas>
  `;

  try {
    const [aduanTxt, responTxt] = await Promise.all([
      fetch(API_URL + "?action=getAllAduan").then(r => r.text()),
      fetch(API_URL + "?action=getAllRespon").then(r => r.text())
    ]);

    if (aduanTxt.trim().startsWith("<")) {
      document.getElementById("chartContainer").innerHTML = "❌ Akses API ditolak. Pastikan deployment: Anyone.";
      return;
    }

    const aduanList = JSON.parse(aduanTxt);
    const responMap = responTxt.trim().startsWith("<") ? {} : JSON.parse(responTxt);

    const jabatanCount = { Mahasiswa: 0, Tendik: 0, Dosen: 0 };
    aduanList.forEach(a => {
      if (jabatanCount[a.jabatan]) jabatanCount[a.jabatan]++;
    });

    const total = aduanList.length;
    const selesai = Object.keys(responMap).length;
    const proses = total - selesai;

    // Chart 1: Jabatan
    new Chart(document.getElementById("jabatanChart"), {
      type: "pie",
      data: {
        labels: Object.keys(jabatanCount),
        datasets: [{ data: Object.values(jabatanCount), backgroundColor: ["#3498db", "#e74c3c", "#f39c12"] }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: "Jumlah Aduan per Jabatan" } } }
    });

    // Chart 2: Status
    new Chart(document.getElementById("statusChart"), {
      type: "bar",
      data: {
        labels: ["Selesai", "Dalam Proses"],
        datasets: [{ label: "Jumlah", data: [selesai, proses], backgroundColor: ["#27ae60", "#f39c12"] }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { title: { display: true, text: "Status Penyelesaian Aduan" } } }
    });
  } catch (error) {
    document.getElementById("chartContainer").innerHTML = "❌ Gagal muat statistik.";
    console.error(error);
  }
}
