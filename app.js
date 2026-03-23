let indiceEdicao = null;

function formatarCampoNascimento(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

function normalizarDataNascimento(valor) {
  const texto = valor.trim();

  if (!texto) return null;

  const partes = texto.split("/");
  if (partes.length !== 3) return null;

  let [dia, mes, ano] = partes.map((p) => p.trim());

  if (!dia || !mes || !ano) return null;

  if (!/^\d+$/.test(dia) || !/^\d+$/.test(mes) || !/^\d+$/.test(ano)) return null;

  dia = parseInt(dia, 10);
  mes = parseInt(mes, 10);

  if (ano.length === 2) {
    const ano2 = parseInt(ano, 10);
    ano = ano2 <= 30 ? 2000 + ano2 : 1900 + ano2;
  } else if (ano.length === 4) {
    ano = parseInt(ano, 10);
  } else {
    return null;
  }

  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;
  if (ano < 1900 || ano > 2100) return null;

  const dataTeste = new Date(ano, mes - 1, dia);

  if (
    dataTeste.getFullYear() !== ano ||
    dataTeste.getMonth() !== mes - 1 ||
    dataTeste.getDate() !== dia
  ) {
    return null;
  }

  const diaStr = String(dia).padStart(2, "0");
  const mesStr = String(mes).padStart(2, "0");

  return `${ano}-${mesStr}-${diaStr}`;
}

function iniciarMascaraNascimento() {
  const campo = document.getElementById("nascimento");
  if (!campo) return;

  campo.addEventListener("input", (e) => {
    e.target.value = formatarCampoNascimento(e.target.value);
  });
}

function salvarCadastro() {
  const nome = document.getElementById("nome").value.trim();
  const nascimentoDigitado = document.getElementById("nascimento").value.trim();
  const nascimentoNormalizado = normalizarDataNascimento(nascimentoDigitado);

  if (!nome || !nascimentoDigitado) {
    alert("Preencha todos os campos.");
    return;
  }

  if (!nascimentoNormalizado) {
    alert("Informe uma data de nascimento válida. Exemplo: 28/05/1978");
    return;
  }

  localStorage.setItem("nome", nome);
  localStorage.setItem("nascimento", nascimentoNormalizado);

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
    return { classe: "Hipoglicemia nível 2", cor: [183, 28, 28], severidade: 5, grupo: "baixo" };
  }

  if (valor < 70) {
    return { classe: "Hipoglicemia nível 1", cor: [198, 40, 40], severidade: 4, grupo: "baixo" };
  }

  if (t.includes("jejum")) {
    if (valor >= 80 && valor <= 130) {
      return { classe: "Dentro da meta", cor: [46, 125, 50], severidade: 1, grupo: "meta" };
    }
    if (valor >= 70 && valor < 80) {
      return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
    }
    if (valor > 130 && valor <= 180) {
      return { classe: "Acima da meta", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
    }
    return { classe: "Muito elevado", cor: [198, 40, 40], severidade: 3, grupo: "alto" };
  }

  if (t.includes("antes do almoço") || t.includes("antes do jantar")) {
    if (valor >= 80 && valor <= 130) {
      return { classe: "Dentro da meta", cor: [46, 125, 50], severidade: 1, grupo: "meta" };
    }
    if (valor >= 70 && valor < 80) {
      return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
    }
    if (valor > 130 && valor <= 180) {
      return { classe: "Acima da meta", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
    }
    return { classe: "Elevado", cor: [198, 40, 40], severidade: 3, grupo: "alto" };
  }

  if (t.includes("após") || t.includes("pós") || t.includes("depois")) {
    if (valor < 180) {
      return { classe: "Dentro da meta pós-prandial", cor: [46, 125, 50], severidade: 1, grupo: "meta" };
    }
    if (valor >= 180 && valor <= 250) {
      return { classe: "Acima da meta pós-prandial", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
    }
    return { classe: "Muito elevado", cor: [198, 40, 40], severidade: 3, grupo: "alto" };
  }

  if (valor >= 80 && valor <= 140) {
    return { classe: "Faixa aceitável", cor: [46, 125, 50], severidade: 1, grupo: "meta" };
  }
  if (valor >= 70 && valor < 80) {
    return { classe: "Atenção para queda", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
  }
  if (valor > 140 && valor <= 180) {
    return { classe: "Atenção", cor: [245, 124, 0], severidade: 2, grupo: "atencao" };
  }
  return { classe: "Elevado", cor: [198, 40, 40], severidade: 3, grupo: "alto" };
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

function obterTendenciaClinica(listaOrdenada) {
  if (listaOrdenada.length < 3) return "Dados insuficientes";

  const valores = listaOrdenada.map(i => i.valor);
  const desvio = calcularDesvioPadrao(listaOrdenada);

  let subidas = 0;
  let descidas = 0;

  for (let i = 1; i < valores.length; i++) {
    const dif = valores[i] - valores[i - 1];
    if (dif > 15) subidas++;
    if (dif < -15) descidas++;
  }

  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);
  const amplitude = maximo - minimo;

  if (desvio > 30 || amplitude > 80) {
    if (subidas > 0 && descidas > 0) {
      return "Oscilante";
    }
  }

  const primeiroTerco = valores.slice(0, Math.ceil(valores.length / 3));
  const ultimoTerco = valores.slice(-Math.ceil(valores.length / 3));

  const mediaInicio = primeiroTerco.reduce((a, b) => a + b, 0) / primeiroTerco.length;
  const mediaFim = ultimoTerco.reduce((a, b) => a + b, 0) / ultimoTerco.length;
  const diferenca = mediaFim - mediaInicio;

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

function contarClassificacoes(lista) {
  const resultado = {
    dentroMeta: 0,
    atencao: 0,
    alto: 0,
    baixo: 0
  };

  lista.forEach((item) => {
    const grupo = classificarMedicao(item.valor, item.tipo).grupo;
    if (grupo === "meta") resultado.dentroMeta++;
    if (grupo === "atencao") resultado.atencao++;
    if (grupo === "alto") resultado.alto++;
    if (grupo === "baixo") resultado.baixo++;
  });

  return resultado;
}

function gerarAlertas(lista) {
  const hipo1 = lista.filter((i) => i.valor < 70).length;
  const hipo2 = lista.filter((i) => i.valor < 54).length;
  const acima180 = lista.filter((i) => i.valor > 180).length;
  const acima250 = lista.filter((i) => i.valor > 250).length;
  const desvio = calcularDesvioPadrao(lista);

  const alertas = [];

  if (hipo1 > 0) alertas.push(`${hipo1} episódio(s) com glicemia abaixo de 70 mg/dL.`);
  if (hipo2 > 0) alertas.push(`${hipo2} episódio(s) com glicemia abaixo de 54 mg/dL.`);

  if (acima180 >= 3) {
    alertas.push(`Frequência relevante de valores acima de 180 mg/dL no período.`);
  } else if (acima180 > 0) {
    alertas.push(`${acima180} episódio(s) com glicemia acima de 180 mg/dL.`);
  }

  if (acima250 > 0) alertas.push(`${acima250} episódio(s) com glicemia acima de 250 mg/dL.`);

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

function analisarQualidadeDados(lista, dataInicio, dataFim) {
  const dias = {};
  const inicio = new Date(`${dataInicio}T00:00:00`);
  const fim = new Date(`${dataFim}T00:00:00`);

  lista.forEach((item) => {
    if (!dias[item.data]) {
      dias[item.data] = {
        total: 0,
        temManha: false,
        temTarde: false,
        temNoite: false,
        itens: []
      };
    }

    dias[item.data].total++;
    dias[item.data].itens.push(item);

    const hora = parseInt(item.hora.split(":")[0], 10);

    if (hora >= 4 && hora < 12) dias[item.data].temManha = true;
    if (hora >= 12 && hora < 18) dias[item.data].temTarde = true;
    if (hora >= 18) dias[item.data].temNoite = true;
  });

  const todosDiasPeriodo = [];
  const cursor = new Date(inicio);

  while (cursor <= fim) {
    const ano = cursor.getFullYear();
    const mes = String(cursor.getMonth() + 1).padStart(2, "0");
    const dia = String(cursor.getDate()).padStart(2, "0");
    todosDiasPeriodo.push(`${ano}-${mes}-${dia}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  let diasComRegistro = 0;
  let diasCompletos = 0;
  let diasIncompletos = 0;
  let diasSemRegistro = 0;
  const listaDiasIncompletos = [];

  todosDiasPeriodo.forEach((data) => {
    const info = dias[data];

    if (!info) {
      diasSemRegistro++;
      return;
    }

    diasComRegistro++;

    const completo = info.temManha && info.temTarde && info.temNoite;

    if (completo) {
      diasCompletos++;
    } else {
      diasIncompletos++;
      listaDiasIncompletos.push({
        data,
        total: info.total,
        periodos: [
          info.temManha ? "manhã" : null,
          info.temTarde ? "tarde" : null,
          info.temNoite ? "noite" : null
        ].filter(Boolean)
      });
    }
  });

  const mediaMedicoesDia = diasComRegistro > 0 ? lista.length / diasComRegistro : 0;

  return {
    diasComRegistro,
    diasCompletos,
    diasIncompletos,
    diasSemRegistro,
    mediaMedicoesDia,
    listaDiasIncompletos
  };
}

function extrairEventosRelevantes(lista) {
  const eventos = [];
  if (!lista.length) return eventos;

  const maxItem = lista.reduce((a, b) => (a.valor > b.valor ? a : b));
  const minItem = lista.reduce((a, b) => (a.valor < b.valor ? a : b));

  eventos.push({
    tipo: "maximo",
    texto: `Pico máximo de ${maxItem.valor} mg/dL em ${formatarData(maxItem.data)} às ${maxItem.hora} (${maxItem.tipo}).`
  });

  eventos.push({
    tipo: "minimo",
    texto: `Menor valor de ${minItem.valor} mg/dL em ${formatarData(minItem.data)} às ${minItem.hora} (${minItem.tipo}).`
  });

  const hipos = lista.filter(i => i.valor < 70);
  hipos.forEach(item => {
    eventos.push({
      tipo: "hipo",
      texto: `Hipoglicemia registrada: ${item.valor} mg/dL em ${formatarData(item.data)} às ${item.hora} (${item.tipo}).`
    });
  });

  const altos = lista.filter(i => i.valor > 180);
  if (altos.length > 0) {
    const agrupadoPorTipo = {};
    altos.forEach(item => {
      if (!agrupadoPorTipo[item.tipo]) agrupadoPorTipo[item.tipo] = 0;
      agrupadoPorTipo[item.tipo]++;
    });

    Object.keys(agrupadoPorTipo).forEach(tipo => {
      eventos.push({
        tipo: "alto",
        texto: `${agrupadoPorTipo[tipo]} medição(ões) acima de 180 mg/dL em "${tipo}".`
      });
    });
  }

  return eventos;
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
  const tendencia = obterTendenciaClinica(filtrados);
  const alertas = gerarAlertas(filtrados);
  const gruposPorTipo = agruparPorTipo(filtrados);
  const classificacoes = contarClassificacoes(filtrados);
  const qualidadeDados = analisarQualidadeDados(filtrados, dataInicio, dataFim);
  const eventosRelevantes = extrairEventosRelevantes(filtrados);

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
  desenharBlocoResumo(doc, 137, y, 58, 22, "Hipoglicemias", classificacoes.baixo, [198, 40, 40]);

  y += 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Classificação consolidada", 15, y);

  y += 6;

  const total = filtrados.length;
  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, 28, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.setTextColor(46, 125, 50);
  doc.text(`Dentro da meta/faixa: ${classificacoes.dentroMeta} (${pct(classificacoes.dentroMeta)})`, 20, y + 10);

  doc.setTextColor(245, 124, 0);
  doc.text(`Atenção: ${classificacoes.atencao} (${pct(classificacoes.atencao)})`, 20, y + 20);

  doc.setTextColor(198, 40, 40);
  doc.text(`Baixo risco / alto risco: ${classificacoes.baixo + classificacoes.alto} (${pct(classificacoes.baixo + classificacoes.alto)})`, 105, y + 10);

  y += 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Qualidade dos dados", 15, y);

  y += 6;

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, 30, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Dias com registro: ${qualidadeDados.diasComRegistro}`, 20, y + 9);
  doc.text(`Dias completos: ${qualidadeDados.diasCompletos}`, 20, y + 17);
  doc.text(`Dias incompletos: ${qualidadeDados.diasIncompletos}`, 105, y + 9);
  doc.text(`Média de medições por dia: ${qualidadeDados.mediaMedicoesDia.toFixed(1)}`, 105, y + 17);

  y += 38;

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

  doc.addPage();
  y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text("Eventos clínicos relevantes", 15, y);

  y += 10;

  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, 70, 3, 3, "FD");

  let yEventos = y + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  eventosRelevantes.forEach((evento) => {
    const linhas = doc.splitTextToSize(`• ${evento.texto}`, 165);
    doc.text(linhas, 20, yEventos);
    yEventos += linhas.length * 6 + 3;
  });

  y += 80;

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

  y += alturaTipos + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.text("Dias com dados incompletos", 15, y);

  y += 6;

  const incompletos = qualidadeDados.listaDiasIncompletos;
  const alturaIncompletos = Math.max(20, incompletos.length * 8 + 8);

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, y, 180, alturaIncompletos, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  let yInc = y + 8;
  if (incompletos.length === 0) {
    doc.text("• Não foram identificados dias incompletos no período.", 20, yInc);
  } else {
    incompletos.forEach((item) => {
      const periodos = item.periodos.length ? item.periodos.join(", ") : "sem distribuição identificada";
      doc.text(`• ${formatarData(item.data)}: ${item.total} medição(ões) registradas (${periodos}).`, 20, yInc);
      yInc += 8;
    });
  }

  doc.addPage();
  y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text("Detalhamento das medições", 15, y);

  y += 10;

  const colunas = {
    data: 15,
    hora: 34,
    tipo: 50,
    valor: 95,
    classe: 115,
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

  if (tendencia === "Oscilante") {
    observacoesInterpretativas.push("Os valores apresentam comportamento oscilante no período analisado, com variações relevantes entre as medições.");
  } else if (tendencia === "Em elevação") {
    observacoesInterpretativas.push("Os valores mostram tendência de elevação ao longo do período analisado.");
  } else if (tendencia === "Em queda") {
    observacoesInterpretativas.push("Os valores mostram tendência de redução ao longo do período analisado.");
  } else {
    observacoesInterpretativas.push("Os valores demonstram comportamento relativamente estável no período analisado.");
  }

  eventosRelevantes.forEach((evento) => {
    observacoesInterpretativas.push(evento.texto);
  });

  if (desvio > 50) {
    observacoesInterpretativas.push("A variabilidade glicêmica está muito elevada, sugerindo oscilação importante entre as medições.");
  } else if (desvio > 30) {
    observacoesInterpretativas.push("A variabilidade glicêmica está aumentada no período.");
  } else {
    observacoesInterpretativas.push("A variabilidade glicêmica está relativamente controlada dentro do conjunto de medições registradas.");
  }

  if (qualidadeDados.diasIncompletos > 0) {
    observacoesInterpretativas.push("A interpretação deve considerar a presença de dias com registro incompleto, o que pode influenciar comparações entre os dias.");
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

iniciarMascaraNascimento();
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
