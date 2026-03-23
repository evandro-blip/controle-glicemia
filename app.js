async function gerarRelatorioPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const medico = "Relatório Clínico de Glicemia";
  const paciente = localStorage.getItem("nomePaciente") || "Paciente";
  const dados = JSON.parse(localStorage.getItem("registros") || "[]");

  if (dados.length === 0) {
    alert("Sem dados para gerar relatório");
    return;
  }

  // ======================
  // PREPARAÇÃO DOS DADOS
  // ======================
  const valores = dados.map(d => d.valor);
  const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);
  const max = Math.max(...valores);
  const min = Math.min(...valores);

  const dentroFaixa = valores.filter(v => v >= 70 && v <= 180).length;
  const acima = valores.filter(v => v > 180).length;
  const abaixo = valores.filter(v => v < 70).length;

  const tir = ((dentroFaixa / valores.length) * 100).toFixed(1);

  const desvio = Math.sqrt(valores.map(x => Math.pow(x - media, 2)).reduce((a, b) => a + b) / valores.length).toFixed(1);

  // ======================
  // ANÁLISE POR PERÍODO
  // ======================
  const porTipo = {};
  dados.forEach(d => {
    if (!porTipo[d.tipo]) porTipo[d.tipo] = [];
    porTipo[d.tipo].push(d.valor);
  });

  function mediaTipo(tipo) {
    if (!porTipo[tipo]) return "-";
    const m = porTipo[tipo].reduce((a,b)=>a+b,0)/porTipo[tipo].length;
    return m.toFixed(0);
  }

  // ======================
  // IMPRESSÃO CLÍNICA
  // ======================
  let impressao = "";

  if (tir >= 70) {
    impressao += "Controle glicêmico global adequado. ";
  } else {
    impressao += "Controle glicêmico abaixo do ideal. ";
  }

  if (acima > abaixo) {
    impressao += "Predomínio de hiperglicemia, principalmente em períodos pós-prandiais. ";
  }

  if (abaixo > 0) {
    impressao += "Presença de episódios de hipoglicemia. ";
  }

  if (desvio > 40) {
    impressao += "Alta variabilidade glicêmica.";
  } else {
    impressao += "Variabilidade dentro de limites aceitáveis.";
  }

  // ======================
  // PÁGINA 1 – RESUMO
  // ======================
  doc.setFontSize(16);
  doc.text(medico, 10, 15);

  doc.setFontSize(11);
  doc.text(`Paciente: ${paciente}`, 10, 25);
  doc.text(`Período: ${dados[0].data} até ${dados[dados.length - 1].data}`, 10, 32);

  doc.text(`Média: ${media} mg/dL`, 10, 45);
  doc.text(`Máximo: ${max} mg/dL`, 10, 52);
  doc.text(`Mínimo: ${min} mg/dL`, 10, 59);

  doc.text(`Tempo na faixa (70-180): ${tir}%`, 10, 70);
  doc.text(`Acima: ${((acima/valores.length)*100).toFixed(1)}%`, 10, 77);
  doc.text(`Abaixo: ${((abaixo/valores.length)*100).toFixed(1)}%`, 10, 84);

  doc.text(`Variabilidade (DP): ${desvio}`, 10, 95);

  // ======================
  // PÁGINA 2 – IMPRESSÃO CLÍNICA
  // ======================
  doc.addPage();

  doc.setFontSize(14);
  doc.text("Impressão Clínica Automatizada", 10, 15);

  doc.setFontSize(11);
  doc.text(impressao, 10, 25, { maxWidth: 180 });

  // ======================
  // ANÁLISE POR PERÍODO
  // ======================
  doc.setFontSize(14);
  doc.text("Análise por Período", 10, 45);

  doc.setFontSize(11);
  doc.text(`Jejum: ${mediaTipo("Jejum")} mg/dL`, 10, 55);
  doc.text(`Antes do almoço: ${mediaTipo("Antes do almoço")} mg/dL`, 10, 62);
  doc.text(`Após almoço: ${mediaTipo("Após almoço")} mg/dL`, 10, 69);
  doc.text(`Antes do jantar: ${mediaTipo("Antes do jantar")} mg/dL`, 10, 76);
  doc.text(`Após jantar: ${mediaTipo("Após jantar")} mg/dL`, 10, 83);

  // ======================
  // PÁGINA 3 – EVENTOS
  // ======================
  doc.addPage();

  doc.setFontSize(14);
  doc.text("Eventos Relevantes", 10, 15);

  doc.setFontSize(11);

  let y = 25;

  dados.forEach(d => {
    if (d.valor > 180 || d.valor < 70) {
      doc.text(`${d.data} ${d.hora} - ${d.tipo}: ${d.valor} mg/dL`, 10, y);
      y += 6;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    }
  });

  // ======================
  // PÁGINA FINAL – TABELA
  // ======================
  doc.addPage();

  doc.setFontSize(14);
  doc.text("Tabela de Registros", 10, 15);

  doc.setFontSize(9);

  let linha = 25;

  dados.forEach(d => {
    doc.text(`${d.data} ${d.hora} | ${d.tipo} | ${d.valor} mg/dL`, 10, linha);
    linha += 5;

    if (linha > 280) {
      doc.addPage();
      linha = 20;
    }
  });

  doc.save("relatorio_glicemia.pdf");
}
