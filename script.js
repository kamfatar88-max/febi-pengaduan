// script.js - DIPERBAHARUI
const API_URL = "https://script.google.com/macros/s/AKfycbziQPyXZQEa9uW-urpATz824Q0mOjO-lRLOjyhyiqGPOR-cX0QTqhV7yS9VR0wQM3ga/exec"; // GANTI DENGAN URL DEPLOY ANDA

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

    const text = await res.text(); // Debug: lihat respons mentah
    console.log("Raw response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON response from server");
    }

    if (data.status === "success") {
      document.getElementById("statusAduan").textContent = `✅ Aduan berhasil dikirim! ID: ${data.id}`;
      document.getElementById("formAduan").reset();
    } else {
      throw new Error(data.message || "Gagal kirim aduan");
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("statusAduan").textContent = `❌ Gagal: ${error.message}`;
  }
});

// Load Aduan untuk Respon
async function loadAduanForRespon() {
  const container = document.getElementById("listAduanRespon");
  container.innerHTML = "Memuat data...";

  try {
    const res = await fetch(API_URL + "?action=getAllAduan");
    const text = await res.text();
    console.log("Raw aduan:", text);

    let aduanList;
    try {
      aduanList = JSON.parse(text);
    } catch (err) {
      container.innerHTML = "❌ Gagal parsing data aduan.";
      return;
    }

    if (!Array.isArray(aduanList) || aduanList.length === 0) {
      container.innerHTML = "Belum ada aduan.";
      return;
    }

    container.innerHTML = "";
    aduanList.forEach(item => {
      const id = item.id || item["id"];
      const nama = item.nama || item["nama"];
      const jabatan = item.jabatan || item["jabatan"];
      const isi = item.isi_aduan || item["isi_aduan"] || item.isi;

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
    console.error("Error load aduan:", error);
    container.innerHTML = "❌ Gagal memuat data aduan.";
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

  if (!identifikasi || !sumber || !rencana || !waktu || !penanggungjawab) {
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
    console.error("Error:", error);
    alert("❌ Gagal kirim respon.");
  }
}

// Muat Data Aduan + Respon
async function loadDataAduan() {
  const container = document.getElementById("tabelData");
  container.innerHTML = "Memuat data gabungan...";

  try {
    const [aduanRes, responRes] = await Promise.all([
      fetch(API_URL + "?action=getAllAduan").then(r => r.text()),
      fetch(API_URL + "?action=getAllRespon").then(r => r.text())
    ]);

    let aduanList, responMap;
    try {
      aduanList = JSON.parse(aduanRes);
    } catch (e) {
      container.innerHTML = "❌ Gagal parsing data aduan.";
      return;
    }
    try {
      responMap = JSON.parse(responRes);
    } catch (e) {
      responMap = {};
    }

    if (!Array.isArray(aduanList)) aduanList = [];

    let html = `
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; font-size:14px;">
        <tr style="background:#2c3e50; color:white;">
          <th>ID</th>
          <th>Nama</th>
          <th>Jabatan</th>
          <th>Aduan</th>
          <th>Identifikasi</th>
          <th>Sumber</th>
          <th>Rencana</th>
          <th>Waktu</th>
          <th>Penanggung Jawab</th>
        </tr>
    `;

    aduanList.forEach(item => {
      const id = item.id || item["id"];
      const respon = responMap[id] || {};
      html += `
        <tr>
          <td>${id}</td>
          <td>${item.nama || "-"}</td>
          <td>${item.jabatan || "-"}</td>
          <td>${item.isi || item["isi_aduan"] || "-"}</td>
          <td>${respon.identifikasi || "-"}</td>
          <td>${respon.sumber || "-"}</td>
          <td>${respon.rencana || "-"}</td>
          <td>${respon.waktu || "-"}</td>
          <td>${respon.penanggungjawab || "-"}</td>
        </tr>
      `;
    });

    html += "</table>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML = "❌ Gagal memuat data gabungan.";
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
    const [aduanRes, responRes] = await Promise.all([
      fetch(API_URL + "?action=getAllAduan").then(r => r.text()),
      fetch(API_URL + "?action=getAllRespon").then(r => r.text())
    ]);

    let aduanList = [];
    let responMap = {};

    try {
      aduanList = JSON.parse(aduanRes);
    } catch (e) {
      console.error("Parse error aduan:", e);
    }

    try {
      responMap = JSON.parse(responRes);
    } catch (e) {
      console.error("Parse error respon:", e);
    }

    if (!Array.isArray(aduanList)) aduanList = [];

    // Hitung per jabatan
    const jabatanCount = { Mahasiswa: 0, Tendik: 0, Dosen: 0 };
    aduanList.forEach(a => {
      const j = a.jabatan || a["jabatan"];
      if (jabatanCount.hasOwnProperty(j)) jabatanCount[j]++;
    });

    // Hitung status
    const total = aduanList.length;
    const selesai = Object.keys(responMap).length;
    const proses = total - selesai;

    // Chart 1: Jabatan
    new Chart(document.getElementById("jabatanChart"), {
      type: "pie",
      data: {
        labels: Object.keys(jabatanCount),
        datasets: [{
          data: Object.values(jabatanCount),
          backgroundColor: ["#3498db", "#e74c3c", "#f39c12"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: "Distribusi Aduan per Jabatan" }
        }
      }
    });

    // Chart 2: Status
    new Chart(document.getElementById("statusChart"), {
      type: "bar",
      data: {
        labels: ["Selesai", "Dalam Proses"],
        datasets: [{
          label: "Jumlah Aduan",
          data: [selesai, proses],
          backgroundColor: ["#27ae60", "#f39c12"]
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: {
          title: { display: true, text: "Status Penyelesaian Aduan" }
        }
      }
    });
  } catch (error) {
    console.error("Statistik error:", error);
    document.getElementById("chartContainer").innerHTML = "<p>❌ Gagal memuat statistik.</p>";
  }
}
