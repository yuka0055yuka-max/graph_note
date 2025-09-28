let myChart; // グローバルスコープにチャートインスタンスを保持

// ページの読み込みが完了したら初期チャートを描画
document.addEventListener('DOMContentLoaded', () => {
    renderChart();
});

// テーブルのデータからチャートを描画・更新する関数
function renderChart() {
    const table = document.getElementById('dataTable');
    const labels = [];
    const data = [];

    // テーブルの各行からラベルと値を取得
    for (let i = 1; i < table.rows.length; i++) {
        const labelInput = table.rows[i].cells[0].querySelector('input');
        const dataInput = table.rows[i].cells[1].querySelector('input');
        if (labelInput && dataInput) {
            labels.push(labelInput.value);
            data.push(parseFloat(dataInput.value) || 0);
        }
    }

    const ctx = document.getElementById('myChart').getContext('2d');
    const chartType = document.getElementById('chartTypeSelector').value;

    // 既存のチャートがあれば破棄してから再描画
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'データ',
                data: data,
                backgroundColor: [ // 色を自動で設定
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: 'rgba(255, 255, 255, 0)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                // 円グラフやレーダーチャートでは軸は不要なので、表示を制御
                y: {
                    beginAtZero: true,
                    display: chartType !== 'pie' && chartType !== 'radar'
                },
                x: {
                   display: chartType !== 'pie' && chartType !== 'radar'
                }
            }
        }
    });
}

// テーブルに行を追加する関数
function addRow() {
    const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const newRow = tableBody.insertRow();

    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    const cell3 = newRow.insertCell(2);

    cell1.innerHTML = '<input type="text" value="" oninput="renderChart()">';
    cell2.innerHTML = '<input type="number" value="0" oninput="renderChart()">';
    cell3.innerHTML = '<button class="delete-btn" onclick="deleteRow(this)">×</button>';
    
    // 新しい行が追加されたらすぐにグラフを更新
    renderChart();
}

// テーブルの行を削除する関数
function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
    renderChart();
}


// グラフの種類を変更する関数
function changeChartType() {
    renderChart(); // グラフを再描画するだけ
}

// Excelとしてエクスポートする関数
function exportToExcel() {
    const table = document.getElementById('dataTable');
    const wb = XLSX.utils.table_to_book(table, {sheet: "データ"});
    XLSX.writeFile(wb, "diary_graph_data.xlsx");
}

// PDFとしてエクスポートする関数
function exportToPDF() {
    // PDFに含めたいセクションを取得
    const diarySection = document.getElementById('diary-section');
    const graphSection = document.getElementById('graph-section');
    
    // jsPDFのインスタンスを生成
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    alert("PDFの生成を開始します。これには少し時間がかかる場合があります。");

    // html2canvasを使ってHTML要素を画像に変換
    html2canvas(diarySection).then(canvas1 => {
        const imgData1 = canvas1.toDataURL('image/png');
        doc.text('日記・メモ', 10, 10);
        doc.addImage(imgData1, 'PNG', 10, 20, 180, canvas1.height * 180 / canvas1.width);

        html2canvas(graphSection).then(canvas2 => {
            doc.addPage();
            const imgData2 = canvas2.toDataURL('image/png');
            doc.text('データとグラフ', 10, 10);
            doc.addImage(imgData2, 'PNG', 10, 20, 180, canvas2.height * 180 / canvas2.width);
            
            doc.save('diary-graph-export.pdf');
        });
    });
}