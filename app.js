let indiceEdicao = null;

function salvarCadastro() {
  const nome = document.getElementById("nome").value.trim();
  const nasc = document.getElementById("nascimento").value;

  if (!nome || !nasc) {
    alert("Preencha todos os campos.");
    return;
  }

  localStorage.setItem("nome", nome);
  localStorage.setItem("nascimento", nasc);

  alert("Cadastro realizado com sucesso!");
  iniciarApp();
}

function iniciarApp() {
  const nome = localStorage.getItem("nome");
  const nasc = localStorage.getItem("nascimento");

  if (nome && nasc) {
    document.getElementById("cadastro").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("boasVindas").innerText = `Olá, ${nome}`;
    preencherDataHoraAtual();
    preencherPeriodoAtual();
    carregarLista();
  } else {
    document.getElementById("cadastro").classList.remove("hidden");
    document.getElementById("app").classList.add("hidden");
  }
}

function preencherDataHoraAtual() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");

  document.getElementById("dataMedicao").value = `${ano}-${mes}-${dia}`;
  document.getElementById("horaMedicao").value = `${horas}:${minutos}`;
}

function preencherPeriodoAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  const dataHoje = `${ano}-${mes}-${dia}`;

  const dataInicio = document.getElementById("dataInicio");
  const dataFim = document.getElementById("dataFim");

  if (dataInicio && !dataInicio.value) dataInicio.value = dataHoje;
  if (dataFim && !dataFim.value) dataFim.value = dataHoje;
}

function salvarOuAtualizarMedicao() {
  const data = document.getElementById("dataMedicao").value;
  const hora = document.getElementById("horaMedicao").value;
  const tipo = document.getElementById("tipoMedicao").value;
  const valor = document.getElementById("valor").value.trim();
  const observacao = document.getElementById("observacao").value.trim();

  if (!data || !hora || !tipo || !valor) {
    alert("Preencha data, hora, tipo e valor da glicemia.");
    return;
  }

  const valorNumerico = Number(valor);

  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    alert("Informe um valor de glicemia válido.");
    return;
  }

  let dados = JSON.parse(localStorage.getItem("dados")) || [];

  const medicao = {
    data,
    hora,
    tipo,
    valor: valorNumerico,
    observacao
  };

  if (indiceEdicao === null) {
    dados.push(medicao);
    alert("Medição salva com sucesso!");
  } else {
    dados[indiceEdicao] = medicao;
    alert("Medição atualizada com sucesso!");
  }

  localStorage.setItem("dados", JSON.stringify(dados));

  cancelarEdicao(false);
  preencherPeriodoAtual();
  carregarLista();
}

function carregarLista() {
  const dados = JSON.parse(localStorage.getItem("dados")) || [];
  const lista = document.getElementById("lista");
  const ultima = document.getElementById("ultima");

  lista.innerHTML = "";

  if (dados.length === 0) {
    lista.innerHTML = `<li class="vazio">Nenhuma medição registrada ainda.</li>`;
    ultima.innerText = "Última medição: nenhuma";
    return;
  }

  const dadosOrdenados = dados
    .map((item, index) => ({ ...item, indexOriginal: index }))
    .sort((a, b) => {
      const dataA = new Date(`${a.data}T${a.hora}`);
      const dataB = new Date(`${b.data}T${b.hora}`);
      return dataB - dataA;
    });

  dadosOrdenados.forEach((item) => {
    const classificacao = classificarMedicao(item.valor, item.tipo);

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="item-header">
        <div>
          <div class="item-valor">${item.valor} mg/dL</div>
          <div class="item-data">${formatarData(item.data)} às ${item.hora}</div>
          <div class="item-tipo">${item.tipo}</div>
          <div class="item-observacao"><strong>Classificação:</strong> ${classificacao.classe}</div>
          ${item.observacao ? `<div class="item-observacao">${item.observacao}</div>` : ""}
        </div>
      </div>

      <div class="item-acoes">
        <button class="editar" onclick="editarMedicao(${item.indexOriginal})">Editar</button>
        <button class="excluir" onclick="excluirMedicao(${item.indexOriginal})">Excluir</button>
      </div>
    `;

    lista.appendChild(li);
  });

  const ultimaMedicao = dadosOrdenados[0];
  ultima.innerText = `Última medição: ${ultimaMedicao.valor} mg/dL em ${formatarData(ultimaMedicao.data)}, ${ultimaMedicao.hora}`;
}

function editarMedicao(index) {
  const dados = JSON.parse(localStorage.getItem("dados")) || [];
  const item = dados[index];

  if (!item) return;

  document.getElementById("dataMedicao").value = item.data;
  document.getElementById("horaMedicao").value = item.hora;
  document.getElementById("tipoMedicao").value = item.tipo;
  document.getElementById("valor").value = item.valor;
  document.getElementById("observacao").value = item.observacao || "";

  indiceEdicao = index;

  document.getElementById("botaoSalvar").innerText = "Atualizar Medição";
  document.getElementById("botaoCancelarEdicao").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirMedicao(index) {
  const confirmar = confirm("Deseja excluir esta medição?");
  if (!confirmar) return;

  let dados = JSON.parse(localStorage.getItem("dados")) || [];
  dados.splice(index, 1);
  localStorage.setItem("dados", JSON.stringify(dados));

  if (indiceEdicao === index) {
    cancelarEdicao(false);
  } else if (indiceEdicao !== null && index < indiceEdicao) {
    indiceEdicao--;
  }

  carregarLista();
}

function cancelarEdicao(mostrarMensagem = true) {
  indiceEdicao = null;

  document.getElementById("tipoMedicao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("observacao").value = "";
  preencherDataHoraAtual();

  document.getElementById("botaoSalvar").innerText = "Salvar Medição";
  document.getElementById("botaoCancelarEdicao").classList.add("hidden");

  if (mostrarMensagem) {
    alert("Edição cancelada.");
  }
}

function limparDados() {
  const confirmar = confirm("Deseja apagar todas as medições?");
  if (!confirmar) return;

  localStorage.removeItem("dados");
  cancelarEdicao(false);
  carregarLista();
}

function formatarData(dataIso) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarTipo(tipo) {
  return (tipo || "").toLowerCase().trim();
}

function classificarMedicao(valor, tipo) {
  const t = normalizarTipo(tipo);

  if (valor < 54) {
    return { classe: "Hipoglicemia nível 2", cor: [183, 28, 28], severidade: 5 };
  }

  if (valor < 70) {
    return { classe: "Hipoglicemia nível 1", cor: [198, 40, 40], severidade: 4 };
  }

  // Jejum
  if (t.includes("jejum")) {
    if (valor >= 80 && valor <= 130) {
      return { classe: "Dentro da meta", cor: [46, 125, 50], severidade: 1 };
    }
    if (valor >= 70 && valor < 80) {
      return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2 };
    }
    if (valor > 130 && valor <= 180) {
      return { classe: "Acima da meta", cor: [245, 124, 0], severidade: 2 };
    }
    return { classe: "Muito elevado", cor: [198, 40, 40], severidade: 3 };
  }

  // Pré-prandial
  if (t.includes("antes do almoço") || t.includes("antes do jantar")) {
    if (valor >= 80 && valor <= 130) {
      return { classe: "Dentro da meta", cor: [46, 125, 50], severidade: 1 };
    }
    if (valor >= 70 && valor < 80) {
      return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2 };
    }
    if (valor > 130 && valor <= 180) {
      return { classe: "Acima da meta", cor: [245, 124, 0], severidade: 2 };
    }
    return { classe: "Elevado", cor: [198, 40, 40], severidade: 3 };
  }

  // Pós-prandial
  if (t.includes("após") || t.includes("pós") || t.includes("depois")) {
    if (valor < 180) {
      return { classe: "Dentro da meta pós-prandial", cor: [46, 125, 50], severidade: 1 };
    }
    if (valor >= 180 && valor <= 250) {
      return { classe: "Acima da meta pós-prandial", cor: [245, 124, 0], severidade: 2 };
    }
    return { classe: "Muito elevado", cor: [198, 40, 40], severidade: 3 };
  }

  // Antes de dormir / outro / genérico
  if (valor >= 80 && valor <= 140) {
    return { classe: "Faixa aceitável", cor: [46, 125, 50], severidade: 1 };
  }
  if (valor >= 70 && valor < 80) {
    return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2 };
  }
  if (valor > 140 && valor <= 180) {
    return { classe: "Atenção", cor: [245, 124, 0], severidade: 2 };
  }
  return { classe: "Elevado", cor: [198, 40, 40], severidade: 3 };
}

function calcularMedia(lista) {
  if (!lista.length) return 0;
  return lista.reduce((acc, item) => acc + item.valor, 0) / lista.length;
}

function calcularDesvioPadrao(lista) {
  if (!lista.length) return 0;
  const media = calcularMedia(lista);
  const variancia =
    lista.reduce((acc, item) => acc + Math.pow(item.valor - media, 2), 0) / lista.length;
  return Math.sqrt(variancia);
}

function obterTendencia(listaOrdenada) {
  if (listaOrdenada.length < 2) return "Dados insuficientes";

  const primeiro = listaOrdenada[0].valor;
  const ultimo = listaOrdenada[listaOrdenada.length - 1].valor;
  const diferenca = ultimo - primeiro;

  if (Math.abs(diferenca) <= 10) return "Estável";
  if (diferenca > 10) return "Em elevação";
  return "Em queda";
}

function agruparPorTipo(lista) {
  const grupos = {};
  lista.forEach((item) => {
    if (!grupos[item.tipo]) grupos[item.tipo] = [];
    grupos[item.tipo].push(item);
  });
  return grupos;
}

function gerarAlertas(lista) {
  const hipo1 = lista.filter((i) => i.valor < 70).length;
  const hipo2 = lista.filter((i) => i.valor < 54).length;
  const acima180 = lista.filter((i) => i.valor > 180).length;
  const acima250 = lista.filter((i) => i.valor > 250).length;
  const desvio = calcularDesvioPadrao(lista);

  const alertas = [];

  if (hipo1 > 0) {
    alertas.push(`${hipo1} episódio(s) com glicemia abaixo de 70 mg/dL.`);
  }

  if (hipo2 > 0) {
    alertas.push(`${hipo2} episódio(s) com glicemia abaixo de 54 mg/dL.`);
  }

  if (acima180 >= 3) {
    alertas.push(`Frequência relevante de valores acima de 180 mg/dL no período.`);
  } else if (acima180 > 0) {
    alertas.push(`${acima180} episódio(s) com glicemia acima de 180 mg/dL.`);
  }

  if (acima250 > 0) {
    alertas.push(`${acima250} episódio(s) com glicemia acima de 250 mg/dL.`);
  }

  if (desvio > 50) {
    alertas.push("Variabilidade glicêmica muito elevada no período.");
  } else if (desvio > 30) {
    alertas.push("Variabilidade glicêmica aumentada no período.");
  }

  if (alertas.length === 0) {
    alertas.push("Sem alertas automáticos relevantes no período analisado.");
  }

  return alertas;
}

function contarClassificacoes(lista) {
  const contagem = {
    "Dentro da meta": 0,
    "Dentro da meta pós-prandial": 0,
    "Faixa aceitável": 0,
    "Atenção": 0,
    "Atenção para queda": 0,
    "Acima da meta": 0,
    "Acima da meta pós-prandial": 0,
    "Elevado": 0,
    "Muito elevado": 0,
    "Hipoglicemia nível 1": 0,
    "Hipoglicemia nível 2": 0
  };

  lista.forEach((item) => {
    const classe = classificarMedicao(item.valor, item.tipo).classe;
    if (contagem[classe] !== undefined) {
      contagem[classe]++;
    }
  });

  return contagem;
}

function adicionarCabecalhoRodape(doc, titulo = "Relatório Clínico de Glicemia") {
  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(titulo, 15, 8);

    doc.setDrawColor(210);
    doc.line(15, 10, 195, 10);

    doc.setDrawColor(220);
    doc.line(15, 287, 195, 287);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      15,
      292
    );

    doc.text(`Página ${i} de ${totalPaginas}`, 195, 292, { align: "right" });
  }
}

function desenharBlocoResumo(doc, x, y, w, h, titulo, valor, corRGB = [46, 125, 50]) {
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(titulo, x + 4, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(corRGB[0], corRGB[1], corRGB[2]);
  doc.text(String(valor), x + 4, y + 16);
}

async function gerarRelatorio() {
  if (!window.jspdf) {
    alert("Biblioteca do PDF não carregou.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const dados = JSON.parse(localStorage.getItem("dados")) || [];

  if (dados.length === 0) {
    alert("Nenhuma medição registrada.");
    return;
  }

  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  if (!dataInicio || !dataFim) {
    alert("Selecione a data inicial e a data final.");
    return;
  }

  if (dataFim < dataInicio) {
    alert("A data final não pode ser menor que a data inicial.");
    return;
  }

  const filtrados = dados
    .filter((d) => d.data >= dataInicio && d.data <= dataFim)
    .sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));

  if (filtrados.length === 0) {
    alert("Nenhuma medição encontrada no período selecionado.");
    return;
  }

  const nome = localStorage.getItem("nome") || "";
  const nascimento = localStorage.getItem("nascimento") || "";

  const media = calcularMedia(filtrados);
  const maior = Math.max(...filtrados.map((i) => i.valor));
  const menor = Math.min(...filtrados.map((i) => i.valor));
  const desvio = calcularDesvioPadrao(filtrados);
  const tendencia = obterTendencia(filtrados);
  const alertas = gerarAlertas(filtrados);
  const gruposPorTipo = agruparPorTipo(filtrados);
  const classificacoes = contarClassificacoes(filtrados);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text("Relatório Clínico de Glicemia", 15, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("Documento de apoio ao acompanhamento do paciente", 15, y);

  y += 12;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, y, 180, 24, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text("Paciente", 20, y + 7);
  doc.text("Data de nascimento", 110, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(nome || "-", 20, y + 15);
  doc.text(formatarData(nascimento) || "-", 110, y + 15);

  y += 30;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, y, 180, 18, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Período analisado", 20, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${formatarData(dataInicio)} até ${formatarData(dataFim)}`, 20, y + 13);

  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Resumo executivo", 15, y);

  y += 6;

  desenharBlocoResumo(doc, 15, y, 40, 22, "Medições", filtrados.length, [46, 125, 50]);
  desenharBlocoResumo(doc, 60, y, 40, 22, "Média", `${media.toFixed(1)} mg/dL`, [25, 118, 210]);
  desenharBlocoResumo(doc, 105, y, 40, 22, "Maior", `${maior} mg/dL`, [239, 108, 0]);
  desenharBlocoResumo(doc, 150, y, 45, 22, "Menor", `${menor} mg/dL`, [198, 40, 40]);

  y += 30;

  desenharBlocoResumo(doc, 15, y, 58, 22, "Tendência", tendencia, [123, 31, 162]);
  desenharBlocoResumo(doc, 76, y, 58, 22, "Variabilidade", `${desvio.toFixed(1)}`, [0, 121, 107]);
  desenharBlocoResumo(doc, 137, y, 58, 22, "Hipoglicemias", classificacoes["Hipoglicemia nível 1"] + classificacoes["Hipoglicemia nível 2"], [198, 40, 40]);

  y += 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Classificação das medições", 15, y);

  y += 6;

  const total = filtrados.length;
  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

  const dentroMeta =
    classificacoes["Dentro da meta"] +
    classificacoes["Dentro da meta pós-prandial"] +
    classificacoes["Faixa aceitável"];

  const atencao =
    classificacoes["Atenção"] +
    classificacoes["Atenção para queda"] +
    classificacoes["Acima da meta"] +
    classificacoes["Acima da meta pós-prandial"];

  const alto =
    classificacoes["Elevado"] +
    classificacoes["Muito elevado"] +
    classificacoes["Hipoglicemia nível 1"] +
    classificacoes["Hipoglicemia nível 2"];

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, 28, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.setTextColor(46, 125, 50);
  doc.text(`Dentro da meta/faixa: ${dentroMeta} (${pct(dentroMeta)})`, 20, y + 10);

  doc.setTextColor(245, 124, 0);
  doc.text(`Atenção: ${atencao} (${pct(atencao)})`, 20, y + 20);

  doc.setTextColor(198, 40, 40);
  doc.text(`Alto risco/fora da meta: ${alto} (${pct(alto)})`, 105, y + 10);

  y += 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Alertas automáticos", 15, y);

  y += 6;

  doc.setFillColor(255, 248, 225);
  doc.setDrawColor(255, 224, 130);
  const alturaAlertas = Math.max(20, alertas.length * 8 + 6);
  doc.roundedRect(15, y, 180, alturaAlertas, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 60, 0);

  let yAlertas = y + 8;
  alertas.forEach((alerta) => {
    doc.text(`• ${alerta}`, 20, yAlertas);
    yAlertas += 8;
  });

  y += alturaAlertas + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Média por tipo de medição", 15, y);

  y += 6;

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  const tipos = Object.keys(gruposPorTipo);
  const alturaTipos = Math.max(18, tipos.length * 8 + 6);
  doc.roundedRect(15, y, 180, alturaTipos, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  let yTipos = y + 8;
  tipos.forEach((tipo) => {
    const mediaTipo = calcularMedia(gruposPorTipo[tipo]);
    doc.text(`• ${tipo}: média ${mediaTipo.toFixed(1)} mg/dL (${gruposPorTipo[tipo].length} medição(ões))`, 20, yTipos);
    yTipos += 8;
  });

  doc.addPage();
  y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text("Detalhamento das medições", 15, y);

  y += 10;

  const colunas = {
    data: 15,
    hora: 35,
    tipo: 52,
    valor: 96,
    classe: 116,
    obs: 150
  };

  function desenharCabecalhoTabela() {
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 5, 180, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text("Data", colunas.data, y);
    doc.text("Hora", colunas.hora, y);
    doc.text("Tipo", colunas.tipo, y);
    doc.text("Valor", colunas.valor, y);
    doc.text("Classificação", colunas.classe, y);
    doc.text("Observação", colunas.obs, y);

    y += 7;
    doc.line(15, y - 3, 195, y - 3);
  }

  desenharCabecalhoTabela();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  filtrados.forEach((item) => {
    const classificacao = classificarMedicao(item.valor, item.tipo);
    const obsLinhas = doc.splitTextToSize(item.observacao || "-", 40);
    const tipoLinhas = doc.splitTextToSize(item.tipo, 40);
    const classeLinhas = doc.splitTextToSize(classificacao.classe, 30);

    const alturaLinha = Math.max(
      6,
      obsLinhas.length * 4,
      tipoLinhas.length * 4,
      classeLinhas.length * 4
    ) + 2;

    if (y + alturaLinha > 278) {
      doc.addPage();
      y = 18;
      desenharCabecalhoTabela();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
    }

    doc.setTextColor(40, 40, 40);
    doc.text(formatarData(item.data), colunas.data, y);
    doc.text(item.hora, colunas.hora, y);
    doc.text(tipoLinhas, colunas.tipo, y);
    doc.text(`${item.valor} mg/dL`, colunas.valor, y);

    doc.setTextColor(...classificacao.cor);
    doc.text(classeLinhas, colunas.classe, y);

    doc.setTextColor(40, 40, 40);
    doc.text(obsLinhas, colunas.obs, y);

    y += alturaLinha;
    doc.setDrawColor(230);
    doc.line(15, y - 2, 195, y - 2);
    y += 3;
  });

  doc.addPage();
  y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text("Leitura clínica automatizada", 15, y);

  y += 12;

  const observacoesInterpretativas = [];

  if (tendencia === "Em elevação") {
    observacoesInterpretativas.push("Os valores mostram tendência de elevação ao longo do período analisado.");
  } else if (tendencia === "Em queda") {
    observacoesInterpretativas.push("Os valores mostram tendência de redução ao longo do período analisado.");
  } else {
    observacoesInterpretativas.push("Os valores demonstram comportamento relativamente estável no período analisado.");
  }

  if ((classificacoes["Hipoglicemia nível 1"] + classificacoes["Hipoglicemia nível 2"]) > 0) {
    observacoesInterpretativas.push("Foram identificados episódios compatíveis com hipoglicemia, merecendo atenção na correlação com sintomas, alimentação e medicação.");
  }

  if ((classificacoes["Muito elevado"] + classificacoes["Elevado"] + classificacoes["Acima da meta pós-prandial"]) > 0) {
    observacoesInterpretativas.push("Há registros acima da meta em parte das medições, o que pode ser útil para revisão do padrão glicêmico pelo profissional responsável.");
  }

  if (desvio > 50) {
    observacoesInterpretativas.push("A variabilidade glicêmica está muito elevada, sugerindo oscilação importante entre as medições.");
  } else if (desvio > 30) {
    observacoesInterpretativas.push("A variabilidade glicêmica está aumentada no período.");
  } else {
    observacoesInterpretativas.push("A variabilidade glicêmica está relativamente controlada dentro do conjunto de medições registradas.");
  }

  observacoesInterpretativas.push("Este relatório é um material de apoio e não substitui avaliação médica individualizada.");

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, 240, 3, 3, "FD");

  let yTexto = y + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);

  observacoesInterpretativas.forEach((texto) => {
    const linhas = doc.splitTextToSize(`• ${texto}`, 165);
    doc.text(linhas, 20, yTexto);
    yTexto += linhas.length * 6 + 4;
  });

  adicionarCabecalhoRodape(doc);

  const nomeArquivo = `relatorio-clinico-glicemia-${nome
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")}.pdf`;

  doc.save(nomeArquivo);
}

iniciarApp();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => {
        console.log("Service Worker registrado com sucesso.");
      })
      .catch((erro) => {
        console.log("Erro ao registrar Service Worker:", erro);
      });
  });
}
