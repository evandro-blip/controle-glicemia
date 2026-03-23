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
  document.getElementById("relatorioTela").innerHTML = `<p class="vazio">Nenhum relatório gerado ainda. Clique em "Atualizar Relatório na Tela".</p>`;
  cancelarEdicao(false);
  carregarLista();
}

function limparCadastroCompleto() {
  const confirmar = confirm("Deseja apagar cadastro e medições?");
  if (!confirmar) return;

  localStorage.removeItem("nome");
  localStorage.removeItem("nascimento");
  localStorage.removeItem("dados");
  location.reload();
}

function exportarHistoricoJson() {
  const dados = JSON.parse(localStorage.getItem("dados")) || [];

  if (!dados.length) {
    alert("Não há medições para exportar.");
    return;
  }

  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historico-glicemia-teste.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importarHistoricoJson(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    try {
      const conteudo = e.target.result;
      const dadosImportados = JSON.parse(conteudo);

      if (!Array.isArray(dadosImportados)) {
        throw new Error("Formato inválido.");
      }

      const dadosValidados = dadosImportados.map((item) => {
        if (
          !item.data ||
          !item.hora ||
          !item.tipo ||
          typeof item.valor === "undefined"
        ) {
          throw new Error("Há registros incompletos no arquivo.");
        }

        return {
          data: String(item.data),
          hora: String(item.hora),
          tipo: String(item.tipo),
          valor: Number(item.valor),
          observacao: item.observacao ? String(item.observacao) : ""
        };
      });

      localStorage.setItem("dados", JSON.stringify(dadosValidados));
      carregarLista();
      preencherPeriodoComBaseNosDados();
      document.getElementById("relatorioTela").innerHTML = `<p class="vazio">Histórico importado com sucesso. Clique em "Atualizar Relatório na Tela".</p>`;
      alert("Histórico importado com sucesso!");
    } catch (erro) {
      alert("Não foi possível importar o arquivo. Verifique se é um JSON válido.");
    } finally {
      event.target.value = "";
    }
  };

  leitor.readAsText(arquivo);
}

function preencherPeriodoComBaseNosDados() {
  const dados = JSON.parse(localStorage.getItem("dados")) || [];
  if (!dados.length) return;

  const datas = dados.map((d) => d.data).sort();
  document.getElementById("dataInicio").value = datas[0];
  document.getElementById("dataFim").value = datas[datas.length - 1];
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

  if (valor < 54) return { classe: "Hipoglicemia nível 2", grupo: "baixo" };
  if (valor < 70) return { classe: "Hipoglicemia nível 1", grupo: "baixo" };

  if (t.includes("jejum")) {
    if (valor >= 80 && valor <= 130) return { classe: "Dentro da meta", grupo: "meta" };
    if (valor >= 70 && valor < 80) return { classe: "Atenção para queda", grupo: "atencao" };
    if (valor > 130 && valor <= 180) return { classe: "Acima da meta", grupo: "atencao" };
    return { classe: "Muito elevado", grupo: "alto" };
  }

  if (t.includes("antes do almoço") || t.includes("antes do jantar")) {
    if (valor >= 80 && valor <= 130) return { classe: "Dentro da meta", grupo: "meta" };
    if (valor >= 70 && valor < 80) return { classe: "Atenção para queda", grupo: "atencao" };
    if (valor > 130 && valor <= 180) return { classe: "Acima da meta", grupo: "atencao" };
    return { classe: "Elevado", grupo: "alto" };
  }

  if (t.includes("após") || t.includes("pós") || t.includes("depois")) {
    if (valor < 180) return { classe: "Dentro da meta pós-prandial", grupo: "meta" };
    if (valor >= 180 && valor <= 250) return { classe: "Acima da meta pós-prandial", grupo: "atencao" };
    return { classe: "Muito elevado", grupo: "alto" };
  }

  if (valor >= 80 && valor <= 140) return { classe: "Faixa aceitável", grupo: "meta" };
  if (valor >= 70 && valor < 80) return { classe: "Atenção para queda", grupo: "atencao" };
  if (valor > 140 && valor <= 180) return { classe: "Atenção", grupo: "atencao" };
  return { classe: "Elevado", grupo: "alto" };
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

  if ((desvio > 30 || amplitude > 80) && subidas > 0 && descidas > 0) {
    return "Oscilante";
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
        temNoite: false
      };
    }

    dias[item.data].total++;

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

  eventos.push(`Pico máximo de ${maxItem.valor} mg/dL em ${formatarData(maxItem.data)} às ${maxItem.hora} (${maxItem.tipo}).`);
  eventos.push(`Menor valor de ${minItem.valor} mg/dL em ${formatarData(minItem.data)} às ${minItem.hora} (${minItem.tipo}).`);

  const hipos = lista.filter(i => i.valor < 70);
  hipos.forEach(item => {
    eventos.push(`Hipoglicemia registrada: ${item.valor} mg/dL em ${formatarData(item.data)} às ${item.hora} (${item.tipo}).`);
  });

  const altos = lista.filter(i => i.valor > 180);
  if (altos.length > 0) {
    const agrupadoPorTipo = {};
    altos.forEach(item => {
      if (!agrupadoPorTipo[item.tipo]) agrupadoPorTipo[item.tipo] = 0;
      agrupadoPorTipo[item.tipo]++;
    });

    Object.keys(agrupadoPorTipo).forEach(tipo => {
      eventos.push(`${agrupadoPorTipo[tipo]} medição(ões) acima de 180 mg/dL em "${tipo}".`);
    });
  }

  return eventos;
}

function calcularTempoNaFaixa(lista) {
  let dentro = 0;
  let acima = 0;
  let abaixo = 0;

  lista.forEach(i => {
    if (i.valor < 70) abaixo++;
    else if (i.valor > 180) acima++;
    else dentro++;
  });

  const total = lista.length || 1;

  return {
    dentro: ((dentro / total) * 100).toFixed(1),
    acima: ((acima / total) * 100).toFixed(1),
    abaixo: ((abaixo / total) * 100).toFixed(1)
  };
}

function montarDadosRelatorio() {
  const dados = JSON.parse(localStorage.getItem("dados")) || [];
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  if (!dataInicio || !dataFim) {
    alert("Selecione a data inicial e a data final.");
    return null;
  }

  if (dataFim < dataInicio) {
    alert("A data final não pode ser menor que a data inicial.");
    return null;
  }

  const filtrados = dados
    .filter((d) => d.data >= dataInicio && d.data <= dataFim)
    .sort((a, b) => new Date(`${a.data}T${a.hora}`) - new Date(`${b.data}T${b.hora}`));

  if (filtrados.length === 0) {
    alert("Nenhuma medição encontrada no período selecionado.");
    return null;
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
  const tir = calcularTempoNaFaixa(filtrados);

  return {
    nome,
    nascimento,
    dataInicio,
    dataFim,
    filtrados,
    media,
    maior,
    menor,
    desvio,
    tendencia,
    alertas,
    gruposPorTipo,
    classificacoes,
    qualidadeDados,
    eventosRelevantes,
    tir
  };
}

function atualizarRelatorioNaTela() {
  const dados = montarDadosRelatorio();
  if (!dados) return;

  const mediasPorTipo = Object.keys(dados.gruposPorTipo)
    .map((tipo) => `<li>${tipo}: média ${calcularMedia(dados.gruposPorTipo[tipo]).toFixed(1)} mg/dL (${dados.gruposPorTipo[tipo].length} medição(ões))</li>`)
    .join("");

  const diasIncompletos = dados.qualidadeDados.listaDiasIncompletos.length
    ? dados.qualidadeDados.listaDiasIncompletos
        .map((item) => `<li>${formatarData(item.data)}: ${item.total} medição(ões) (${item.periodos.join(", ") || "sem distribuição"})</li>`)
        .join("")
    : "<li>Não foram identificados dias incompletos no período.</li>";

  const linhasTabela = dados.filtrados
    .map((item) => {
      const classificacao = classificarMedicao(item.valor, item.tipo);
      return `
        <tr>
          <td>${formatarData(item.data)}</td>
          <td>${item.hora}</td>
          <td>${item.tipo}</td>
          <td>${item.valor} mg/dL</td>
          <td>${classificacao.classe}</td>
          <td>${item.observacao || "-"}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("relatorioTela").innerHTML = `
    <div class="relatorio-titulo">Relatório Clínico de Glicemia</div>
    <div class="relatorio-subtitulo">
      Paciente: <strong>${dados.nome}</strong><br>
      Nascimento: <strong>${formatarData(dados.nascimento)}</strong><br>
      Período: <strong>${formatarData(dados.dataInicio)} até ${formatarData(dados.dataFim)}</strong>
    </div>

    <div class="relatorio-grid">
      <div class="relatorio-card"><small>Medições</small><strong>${dados.filtrados.length}</strong></div>
      <div class="relatorio-card"><small>Média</small><strong>${dados.media.toFixed(1)} mg/dL</strong></div>
      <div class="relatorio-card"><small>Maior</small><strong>${dados.maior} mg/dL</strong></div>
      <div class="relatorio-card"><small>Menor</small><strong>${dados.menor} mg/dL</strong></div>
      <div class="relatorio-card"><small>Tendência</small><strong>${dados.tendencia}</strong></div>
      <div class="relatorio-card"><small>Variabilidade</small><strong>${dados.desvio.toFixed(1)}</strong></div>
    </div>

    <div class="relatorio-bloco">
      <h4>Tempo na faixa</h4>
      <ul>
        <li>Dentro da faixa (70–180): ${dados.tir.dentro}%</li>
        <li>Acima da faixa: ${dados.tir.acima}%</li>
        <li>Abaixo da faixa: ${dados.tir.abaixo}%</li>
      </ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Classificação consolidada</h4>
      <ul>
        <li>Dentro da meta/faixa: ${dados.classificacoes.dentroMeta}</li>
        <li>Atenção: ${dados.classificacoes.atencao}</li>
        <li>Baixo risco / alto risco: ${dados.classificacoes.baixo + dados.classificacoes.alto}</li>
      </ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Qualidade dos dados</h4>
      <ul>
        <li>Dias com registro: ${dados.qualidadeDados.diasComRegistro}</li>
        <li>Dias completos: ${dados.qualidadeDados.diasCompletos}</li>
        <li>Dias incompletos: ${dados.qualidadeDados.diasIncompletos}</li>
        <li>Média de medições por dia: ${dados.qualidadeDados.mediaMedicoesDia.toFixed(1)}</li>
      </ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Alertas automáticos</h4>
      <ul>
        ${dados.alertas.map((a) => `<li>${a}</li>`).join("")}
      </ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Eventos clínicos relevantes</h4>
      <ul>
        ${dados.eventosRelevantes.map((e) => `<li>${e}</li>`).join("")}
      </ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Média por tipo de medição</h4>
      <ul>${mediasPorTipo}</ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Dias com dados incompletos</h4>
      <ul>${diasIncompletos}</ul>
    </div>

    <div class="relatorio-bloco">
      <h4>Tabela detalhada</h4>
      <table class="tabela-relatorio">
        <thead>
          <tr>
            <th>Data</th>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Classificação</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela}
        </tbody>
      </table>
    </div>
  `;
}

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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const y70 = padding + h - ((70 - min) / (max - min)) * h;
  const y180 = padding + h - ((180 - min) / (max - min)) * h;

  ctx.fillStyle = "rgba(76,175,80,0.15)";
  ctx.fillRect(padding, y180, w, y70 - y180);

  ctx.strokeStyle = "#ddd";
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + h);
  ctx.lineTo(padding + w, padding + h);
  ctx.stroke();

  ctx.strokeStyle = "#1976d2";
  ctx.lineWidth = 2;
  ctx.beginPath();

  lista.forEach((item, i) => {
    const x = padding + (i / Math.max(lista.length - 1, 1)) * w;
    const y = padding + h - ((item.valor - min) / (max - min)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  lista.forEach((item, i) => {
    const x = padding + (i / Math.max(lista.length - 1, 1)) * w;
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

async function gerarRelatorio() {
  if (!window.jspdf) {
    alert("Biblioteca do PDF não carregou.");
    return;
  }

  const dados = montarDadosRelatorio();
  if (!dados) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const grafico = gerarGraficoBase64(dados.filtrados);

  doc.setFontSize(16);
  doc.text("Relatório Clínico de Glicemia", 10, 10);

  doc.setFontSize(10);
  doc.text(`Paciente: ${dados.nome}`, 10, 20);
  doc.text(`Nascimento: ${formatarData(dados.nascimento)}`, 10, 25);
  doc.text(`Período: ${formatarData(dados.dataInicio)} até ${formatarData(dados.dataFim)}`, 10, 30);

  doc.text(`Média: ${dados.media.toFixed(1)} mg/dL`, 10, 42);
  doc.text(`Maior: ${dados.maior} mg/dL`, 10, 47);
  doc.text(`Menor: ${dados.menor} mg/dL`, 10, 52);
  doc.text(`Tendência: ${dados.tendencia}`, 10, 57);
  doc.text(`Variabilidade: ${dados.desvio.toFixed(1)}`, 10, 62);

  doc.text(`Tempo na faixa (70-180): ${dados.tir.dentro}%`, 10, 72);
  doc.text(`Acima: ${dados.tir.acima}%`, 10, 77);
  doc.text(`Abaixo: ${dados.tir.abaixo}%`, 10, 82);

  doc.addPage();
  doc.text("Gráfico de Glicemia", 10, 10);
  doc.addImage(grafico, "PNG", 10, 20, 180, 80);

  doc.addPage();
  doc.text("Eventos Relevantes", 10, 10);
  let y = 20;

  dados.eventosRelevantes.forEach((evento) => {
    const linhas = doc.splitTextToSize(`• ${evento}`, 180);
    doc.text(linhas, 10, y);
    y += linhas.length * 6 + 2;
  });

  y += 4;
  doc.text("Qualidade dos dados", 10, y);
  y += 8;
  doc.text(`Dias com registro: ${dados.qualidadeDados.diasComRegistro}`, 10, y);
  y += 6;
  doc.text(`Dias completos: ${dados.qualidadeDados.diasCompletos}`, 10, y);
  y += 6;
  doc.text(`Dias incompletos: ${dados.qualidadeDados.diasIncompletos}`, 10, y);
  y += 6;
  doc.text(`Média de medições por dia: ${dados.qualidadeDados.mediaMedicoesDia.toFixed(1)}`, 10, y);

  doc.addPage();
  y = 10;
  doc.text("Tabela detalhada", 10, y);
  y += 10;

  dados.filtrados.forEach((item) => {
    const classificacao = classificarMedicao(item.valor, item.tipo);
    const texto = `${formatarData(item.data)} ${item.hora} - ${item.tipo} - ${item.valor} mg/dL - ${classificacao.classe} - ${item.observacao || "-"}`;
    const linhas = doc.splitTextToSize(texto, 180);
    doc.text(linhas, 10, y);
    y += linhas.length * 6 + 2;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`relatorio-clinico-glicemia-${dados.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

document.getElementById("arquivoHistorico").addEventListener("change", importarHistoricoJson);

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
