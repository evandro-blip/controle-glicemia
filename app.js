// ===== GRÁFICO PROFISSIONAL =====
function gerarGraficoBase64(lista) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  const padding = 40;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;

  const valores = lista.map(i => i.valor);
  const max = Math.max(...valores, 250);
  const min = Math.min(...valores, 50);

  // Fundo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faixa saudável (70–180)
  const y70 = padding + h - ((70 - min) / (max - min)) * h;
  const y180 = padding + h - ((180 - min) / (max - min)) * h;

  ctx.fillStyle = "rgba(76,175,80,0.15)";
  ctx.fillRect(padding, y180, w, y70 - y180);

  // Linha base
  ctx.strokeStyle = "#ddd";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + h);
  ctx.lineTo(padding + w, padding + h);
  ctx.stroke();

  // Linha glicemia
  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 2;
  ctx.beginPath();

  lista.forEach((item, i) => {
    const x = padding + (i / (lista.length - 1)) * w;
    const y = padding + h - ((item.valor - min) / (max - min)) * h;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  // Pontos
  lista.forEach((item, i) => {
    const x = padding + (i / (lista.length - 1)) * w;
    const y = padding + h - ((item.valor - min) / (max - min)) * h;

    if (item.valor < 70) ctx.fillStyle = "#d32f2f";
    else if (item.valor > 180) ctx.fillStyle = "#f57c00";
    else ctx.fillStyle = "#2e7d32";

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL("image/png");
}

// ===== TEMPO NA FAIXA =====
function calcularTempoNaFaixa(lista) {
  let dentro = 0;
  let acima = 0;
  let abaixo = 0;

  lista.forEach(i => {
    if (i.valor < 70) abaixo++;
    else if (i.valor > 180) acima++;
    else dentro++;
  });

  const total = lista.length;

  return {
    dentro: ((dentro / total) * 100).toFixed(1),
    acima: ((acima / total) * 100).toFixed(1),
    abaixo: ((abaixo / total) * 100).toFixed(1)
  };
}

// ===== RELATÓRIO FINAL =====
async function gerarRelatorio() {
  const { jsPDF } = window.jspdf;
  const dados = JSON.parse(localStorage.getItem("dados")) || [];

  if (!dados.length) {
    alert("Sem dados");
    return;
  }

  const lista = dados.sort((a, b) => new Date(a.data) - new Date(b.data));

  const nome = localStorage.getItem("nome") || "";
  const nascimento = localStorage.getItem("nascimento") || "";

  const media = lista.reduce((a, b) => a + b.valor, 0) / lista.length;
  const maior = Math.max(...lista.map(i => i.valor));
  const menor = Math.min(...lista.map(i => i.valor));

  const tir = calcularTempoNaFaixa(lista);
  const grafico = gerarGraficoBase64(lista);

  const doc = new jsPDF();

  // ===== PÁGINA 1 =====
  doc.setFontSize(16);
  doc.text("Relatório Clínico de Glicemia", 10, 10);

  doc.setFontSize(10);
  doc.text(`Paciente: ${nome}`, 10, 20);
  doc.text(`Nascimento: ${nascimento}`, 10, 25);

  doc.text(`Média: ${media.toFixed(1)} mg/dL`, 10, 40);
  doc.text(`Maior: ${maior}`, 10, 45);
  doc.text(`Menor: ${menor}`, 10, 50);

  doc.text(`Tempo na faixa (70-180): ${tir.dentro}%`, 10, 60);
  doc.text(`Acima: ${tir.acima}%`, 10, 65);
  doc.text(`Abaixo: ${tir.abaixo}%`, 10, 70);

  // ===== PÁGINA 2 (GRÁFICO) =====
  doc.addPage();
  doc.text("Gráfico de Glicemia", 10, 10);
  doc.addImage(grafico, "PNG", 10, 20, 180, 80);

  // ===== PÁGINA 3 (EVENTOS) =====
  doc.addPage();
  doc.text("Eventos Relevantes", 10, 10);

  doc.text(`Pico: ${maior} mg/dL`, 10, 20);
  doc.text(`Mínimo: ${menor} mg/dL`, 10, 25);

  // ===== PÁGINA 4 (TABELA) =====
  doc.addPage();
  let y = 10;

  lista.forEach(item => {
    doc.text(`${item.data} ${item.hora} - ${item.valor} mg/dL (${item.tipo})`, 10, y);
    y += 6;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("relatorio-glicemia.pdf");
}
