const API_URL = "https://script.google.com/macros/s/AKfycbzUgYqRb4SGSBPDUKOL-J2OFiDJqSZ2JVAq8k0RsGPeEpvG3N2hhj8x-CdHuq9HEOqy/exec"; // GANTI DENGAN DEPLOY URL ANDA

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
  const nama = document.getElementById("nama").value;
  const jabatan = document.getElementById("jabatan").value;
  const isi = document.getElementById("isi").value;

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
    document.getElementById("statusAduan").textContent = `Aduan berhasil dikirim! ID: ${data.id}`;
    document.getElementById("formAduan").reset();
  }
});

// Load Aduan for Respon
async function loadAduanForRespon() {
  const res = await fetch(API_URL + "?action=getAllAduan");
  const aduanList = await res.json();
  const responDiv = document.getElementById("listAduanRespon");
  responDiv.innerHTML = "";

  aduanList.forEach(item => {
    const div = document.createElement("div");
    div.className = "aduan-item";
    div.innerHTML = `
      <h4>ID: ${item.id} | ${item.nama} (${item.jabatan})</h4>
      <p><strong>Aduan:</strong> ${item.isi}</p>
      <button class="btn-respon" onclick="showResponForm(${item.id})">Beri Respon</button>
      <div id="responForm-${item.id}"></div>
    `;
    responDiv.appendChild(div);
  });
}

function showResponForm(id) {
  const formDiv = document.getElementById(`responForm-${id}`);
  formDiv.innerHTML = `
    <div class="respon-form">
      <label>Identifikasi Masalah: <textarea id="identifikasi-${id}" required></textarea></label>
      <label>Sumber Masalah: <input type="text" id="sumber-${id}" required /></label>
      <label>Rencana Aksi: <textarea id="rencana-${id}" required></textarea></label>
      <label>Waktu Penyelesaian: <input type="date" id="waktu-${id}" required /></label>
      <label>Penanggung Jawab: <input type="text" id="penanggungjawab-${id}" required /></label>
      <button onclick="submitRespon(${id})">Simpan Respon</button>
    </div>
  `;
}

async function submitRespon(id) {
  const identifikasi = document.getElementById(`identifikasi-${id}`).value;
  const sumber = document.getElementById(`sumber-${id}`).value;
  const rencana = document.getElementById(`rencana-${id}`).value;
  const waktu = document.getElementById(`waktu-${id}`).value;
  const penanggungjawab = document.getElementById(`penanggungjawab-${id}`).value;

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
    alert("Respon berhasil disimpan!");
    document.getElementById(`responForm-${id}`).innerHTML = "<p style='color:green'>Respon telah disimpan.</p>";
  }
}

// Load Data Aduan + Respon
async function loadDataAduan() {
  const [aduanRes, responRes] = await Promise.all([
    fetch(API_URL + "?action=getAllAduan").then(r => r.json()),
    fetch(API_URL + "?action=getAllRespon").then(r => r.json())
  ]);

  const container = document.getElementById("tabelData");
  let html = "<table border='1' cellpadding='8' cellspacing='0' style='width:100%; border-collapse: collapse;'>";
  html += `<tr style="background:#3498db; color:white;">
    <th>ID</th><th>Nama</th><th>Jabatan</th><th>Aduan</th><th>Identifikasi</th><th>Sumber</th><th>Rencana</th><th>Waktu</th><th>Penanggung Jawab</th>
  </tr>`;

  aduanList.forEach(aduan => {
    const respon = responRes[aduan.id] || {};
    html += `<tr>
      <td>${aduan.id}</td>
      <td>${aduan.nama}</td>
      <td>${aduan.jabatan}</td>
      <td>${aduan.isi}</td>
      <td>${respon.identifikasi || "-"}</td>
      <td>${respon.sumber || "-"}</td>
      <td>${respon.rencana || "-"}</td>
      <td>${respon.waktu || "-"}</td>
      <td>${respon.penanggungjawab || "-"}</td>
    </tr>`;
  });

  html += "</table>";
  container.innerHTML = html;
}

// Load Statistik
async function loadStatistik() {
  const [aduanList, responMap] = await Promise.all([
    fetch(API_URL + "?action=getAllAduan").then(r => r.json()),
    fetch(API_URL + "?action=getAllRespon").then(r => r.json())
  ]);

  // Statistik Jabatan
  const jabatanCount = { Mahasiswa: 0, Tendik: 0, Dosen: 0 };
  aduanList.forEach(a => jabatanCount[a.jabatan]++);

  // Statistik Status
  const total = aduanList.length;
  const selesai = Object.keys(responMap).length;
  const proses = aduanList.filter(a => !responMap[a.id]).length;
  const belum = total - selesai;

  // Chart Jabatan
  new Chart(document.getElementById("jabatanChart"), {
    type: "pie",
    data: {
      labels: Object.keys(jabatanCount),
      datasets: [{
        data: Object.values(jabatanCount),
        backgroundColor: ["#3498db", "#e74c3c", "#f39c12"]
      }]
    },
    options: { responsive: true, plugins: { title: { display: true, text: "Jumlah Aduan per Jabatan" } } }
  });

  // Chart Status
  new Chart(document.getElementById("statusChart"), {
    type: "bar",
    data: {
      labels: ["Selesai", "Dalam Proses", "Belum Ditanggapi"],
      datasets: [{
        label: "Jumlah",
        data: [selesai, proses, belum],
        backgroundColor: ["#27ae60", "#f39c12", "#e74c3c"]
      }]
    },
    options: { responsive: true, plugins: { title: { display: true, text: "Status Penyelesaian Aduan" } } }
  });
}
