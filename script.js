document.addEventListener("DOMContentLoaded", () => {
  setupCanvas();
  setupSpeech();
  document.getElementById("saveEntry").addEventListener("click", saveEntry);
  document.getElementById("viewHistory").addEventListener("click", viewHistory);
  document.getElementById("searchBtn").addEventListener("click", searchDiary);
  document.getElementById("clearCanvas").addEventListener("click", clearCanvas);
  renderChart();
});

let chart;
function renderChart() {
  const labels = [];
  const data = [];
  const rows = document.querySelectorAll("#dataTable tbody tr");
  rows.forEach(row => {
    const label = row.cells[0].querySelector("input").value;
    const value = parseFloat(row.cells[1].querySelector("input").value);
    if (label && !isNaN(value)) {
      labels.push(label);
      data.push(value);
    }
  });

  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) chart.destroy();
  const type = document.getElementById("chartTypeSelector").value;
  chart = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label: "データ",
        data,
        backgroundColor: "rgba(52, 152, 219, 0.5)",
        borderColor: "#3498db",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const avg = data.reduce((a, b) => a + b, 0) / data.length || 0;
  const max = Math.max(...data);
  const min = Math.min(...data);
  document.getElementById("avg").textContent = avg.toFixed(2);
  document.getElementById("max").textContent = max;
  document.getElementById("min").textContent = min;
}

function addRow() {
  const tbody = document.querySelector("#dataTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" oninput="renderChart()"></td>
    <td><input type="number" oninput="renderChart()"></td>
    <td><button class="delete-btn" onclick="deleteRow(this)">×</button></td>
  `;
  tbody.appendChild(row);
}

function deleteRow(btn) {
  btn.closest("tr").remove();
  renderChart();
}

function changeChartType() {
  renderChart();
}

function setupCanvas() {
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.addEventListener("mousedown", () => drawing = true);
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mouseout", () => drawing = false);
  canvas.addEventListener("mousemove", e => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2c3e50";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });
}

function clearCanvas() {
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setupSpeech() {
  const btn = document.getElementById("startSpeech");
  const result = document.getElementById("speechResult");
  const diary = document.getElementById("diary-text");

  if (!("webkitSpeechRecognition" in window)) {
    result.textContent = "音声認識はこのブラウザでサポートされていません。";
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.continuous = false;
  recognition.interimResults = false;

  btn.addEventListener("click", () => {
    recognition.start();
    result.textContent = "音声認識中...";
  });

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    diary.value += "\n" + transcript;
    result.textContent = "認識結果: " + transcript;
  };

  recognition.onerror = () => {
    result.textContent = "音声認識エラーが発生しました。";
  };
}

function generateShareLink() {
  const pin = document.getElementById("pinCode").value.trim();
  if (!pin) return alert("PINコードを入力してください");

  const baseURL = location.href.split("?")[0];
  const link = `${baseURL}?pin=${encodeURIComponent(pin)}&expires=${Date.now() + 180000}`;

  const result = document.getElementById("linkResult");
  result.textContent = `共有リンク: ${link}`;

  setTimeout(() => {
    result.textContent = "リンク期限切れ";
  }, 180000);
}

function exportToExcel() {
  const table = document.getElementById("dataTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, "graph_note.xlsx");
}

function exportToPDF() {
  html2canvas(document.querySelector(".chart-container")).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF();
    pdf.text("Graph Note グラフ", 10, 10);
    pdf.addImage(imgData, "PNG", 10, 20, 180, 100);
    pdf.save("graph_note.pdf");
  });
}

function saveEntry() {
  const diary = document.getElementById("diary-text").value;
  const canvas = document.getElementById("drawCanvas");
  const image = canvas.toDataURL();
  const rows = document.querySelectorAll("#dataTable tbody tr");
  const data = Array.from(rows).map(row => ({
    label: row.cells[0].querySelector("input").value,
    value: row.cells[1].querySelector("input").value
  }));
  const entry = {
    diary,
    image,
    data,
    chartType: document.getElementById("chartTypeSelector").value,
    timestamp: new Date().toISOString()
  };
  const entries = JSON.parse(localStorage.getItem("graphNoteEntries") || "[]");
  entries.push(entry);
  localStorage.setItem("graphNoteEntries", JSON.stringify(entries));
  alert("保存しました！");
}

function viewHistory() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";
  const entries = JSON.parse(localStorage.getItem("graphNoteEntries") || "[]");
  if (entries.length === 0) {
    container.innerHTML = "<p>履歴はありません。</p>";
  } else {
    entries.forEach((entry, index) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <p><strong>${entry.timestamp}</strong></p>
        <p>${entry.diary}</p>
        <img src="${entry.image}" width="200" />
        <button onclick="deleteEntry(${index})">削除</button>
      `;
      container.appendChild(div);
    });
  }
  document.getElementById("historyView").style.display = "block";
}

function deleteEntry(index) {
  const entries = JSON.parse(localStorage.getItem("graphNoteEntries") || "[]");
  entries.splice(index, 1);
  localStorage.setItem("graphNoteEntries", JSON.stringify(entries));
  viewHistory();
}

function searchDiary() {
  const word = document.getElementById("searchWord").value.trim();
  const diary = document.getElementById("diary-text");
  if (!word) return;
  const pos = diary.value.indexOf(word);
  if (pos >= 0) {
    diary.focus();
    diary.setSelectionRange(pos, pos + word.length);
  } else {
    alert("見つかりませんでした");
  }
}
