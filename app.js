import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// IMPORTANTE: o banco de dados deste projeto se chama "default" (sem parênteses),
// não o "(default)" reservado. Por isso é preciso passar o segundo argumento aqui.
const db = getFirestore(app, "default");

const telaLogin = document.getElementById("tela-login");
const telaApp = document.getElementById("tela-app");
const btnEntrar = document.getElementById("btn-entrar");
const btnSair = document.getElementById("btn-sair");
const infoUsuario = document.getElementById("info-usuario");
const mensagemErro = document.getElementById("mensagem-erro");
const campoBusca = document.getElementById("busca-militar");
const corpoTabela = document.getElementById("corpo-tabela-militares");
const statusMilitares = document.getElementById("status-militares");

const selPosto = document.getElementById("filtro-posto");
const selMunicipio = document.getElementById("filtro-municipio");
const selUnidade = document.getElementById("filtro-unidade");
const selSituacao = document.getElementById("filtro-situacao");
const selSexo = document.getElementById("filtro-sexo");
const selRaca = document.getElementById("filtro-raca");
const selEstadoCivil = document.getElementById("filtro-estadocivil");
const selInstrucao = document.getElementById("filtro-instrucao");
const selQuadro = document.getElementById("filtro-quadro");
const selAtividade = document.getElementById("filtro-atividade");
const selAtivoInativo = document.getElementById("filtro-ativoinativo");
const containerCategoriaCred = document.getElementById("filtro-categoria-cred");
const btnLimparFiltros = document.getElementById("btn-limpar-filtros");
const kpisEl = document.getElementById("kpis");

btnEntrar.addEventListener("click", () => {
  mensagemErro.textContent = "";
  signInWithPopup(auth, provider).catch((erro) => {
    mensagemErro.textContent = "Não foi possível entrar: " + erro.message;
  });
});

btnSair.addEventListener("click", () => {
  signOut(auth);
});

let militaresCache = [];
const graficos = {};

function renderizarMilitares(lista) {
  corpoTabela.innerHTML = "";
  lista.forEach((m) => {
    const linha = document.createElement("tr");
    linha.innerHTML =
      "<td>" + (m.matricula || "") + "</td>" +
      "<td>" + (m.nomeServidor || "") + "</td>" +
      "<td>" + (m.postoGraduacao || "") + "</td>" +
      "<td>" + (m.nomeUnidade || "") + "</td>" +
      "<td>" + (m.sitFuncional || "") + "</td>";
    corpoTabela.appendChild(linha);
  });
  statusMilitares.textContent = lista.length + " militar(es) encontrado(s).";
}

// ---------- Filtros combinados ----------

function distintos_(lista, campo) {
  return Array.from(new Set(lista.map((m) => m[campo]).filter(Boolean))).sort();
}

function preencherSelect_(elemento, valores) {
  valores.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    elemento.appendChild(opt);
  });
}

function preencherFiltros_(lista) {
  preencherSelect_(selPosto, distintos_(lista, "postoGraduacao"));
  preencherSelect_(selMunicipio, distintos_(lista, "nomeMunicipio"));
  preencherSelect_(selUnidade, distintos_(lista, "nomeUnidade"));
  preencherSelect_(selSituacao, distintos_(lista, "sitFuncional"));
  preencherSelect_(selSexo, distintos_(lista, "sexo"));
  preencherSelect_(selRaca, distintos_(lista, "raca"));
  preencherSelect_(selEstadoCivil, distintos_(lista, "estadoCivil"));
  preencherSelect_(selInstrucao, distintos_(lista, "grauInstrucao"));
  preencherSelect_(selQuadro, distintos_(lista, "quadro"));
  preencherSelect_(selAtividade, distintos_(lista, "tipoAtividade"));
  preencherSelect_(selAtivoInativo, distintos_(lista, "ativoInativo"));

  containerCategoriaCred.innerHTML = "";
  distintos_(lista, "codCategoriaCredenciamento").forEach((categoria) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = categoria;
    checkbox.addEventListener("change", aplicarFiltros);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(categoria));
    containerCategoriaCred.appendChild(label);
  });
}

function aplicarFiltros() {
  const termo = campoBusca.value.trim().toLowerCase();
  const categoriasMarcadas = Array.from(
    containerCategoriaCred.querySelectorAll("input:checked")
  ).map((cb) => cb.value);

  const filtrados = militaresCache.filter((m) => {
    if (
      termo &&
      !(
        (m.nomeServidor || "").toLowerCase().includes(termo) ||
        (m.matricula || "").toLowerCase().includes(termo)
      )
    )
      return false;
    if (selPosto.value && m.postoGraduacao !== selPosto.value) return false;
    if (selMunicipio.value && m.nomeMunicipio !== selMunicipio.value) return false;
    if (selUnidade.value && m.nomeUnidade !== selUnidade.value) return false;
    if (selSituacao.value && m.sitFuncional !== selSituacao.value) return false;
    if (selSexo.value && m.sexo !== selSexo.value) return false;
    if (selRaca.value && m.raca !== selRaca.value) return false;
    if (selEstadoCivil.value && m.estadoCivil !== selEstadoCivil.value) return false;
    if (selInstrucao.value && m.grauInstrucao !== selInstrucao.value) return false;
    if (selQuadro.value && m.quadro !== selQuadro.value) return false;
    if (selAtividade.value && m.tipoAtividade !== selAtividade.value) return false;
    if (selAtivoInativo.value && m.ativoInativo !== selAtivoInativo.value) return false;
    if (
      categoriasMarcadas.length &&
      !categoriasMarcadas.includes(m.codCategoriaCredenciamento)
    )
      return false;
    return true;
  });

  renderizarMilitares(filtrados);
}

[
  campoBusca,
  selPosto,
  selMunicipio,
  selUnidade,
  selSituacao,
  selSexo,
  selRaca,
  selEstadoCivil,
  selInstrucao,
  selQuadro,
  selAtividade,
  selAtivoInativo
].forEach((el) => el.addEventListener("input", aplicarFiltros));

btnLimparFiltros.addEventListener("click", () => {
  campoBusca.value = "";
  [
    selPosto, selMunicipio, selUnidade, selSituacao, selSexo,
    selRaca, selEstadoCivil, selInstrucao, selQuadro, selAtividade, selAtivoInativo
  ].forEach((sel) => (sel.value = ""));
  containerCategoriaCred.querySelectorAll("input:checked").forEach((cb) => (cb.checked = false));
  aplicarFiltros();
});

// ---------- Dashboard ----------

const CORES = [
  "#1F4E78", "#2E86AB", "#F6AE2D", "#F26419", "#33658A",
  "#86BBD8", "#758E4F", "#B85042", "#8E7DBE", "#4F6D7A",
  "#C08497", "#8AAA79", "#D4A276", "#5C8001"
];

function contarPor_(lista, campo) {
  const contagem = {};
  lista.forEach((m) => {
    const valor = m[campo] || "Não informado";
    contagem[valor] = (contagem[valor] || 0) + 1;
  });
  return contagem;
}

function calcularIdade_(dataStr) {
  if (!dataStr) return null;
  const nascimento = new Date(dataStr);
  if (isNaN(nascimento)) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const diffMes = hoje.getMonth() - nascimento.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function faixaEtaria_(idade) {
  if (idade === null) return "Não informado";
  if (idade < 26) return "18-25";
  if (idade < 31) return "26-30";
  if (idade < 36) return "31-35";
  if (idade < 41) return "36-40";
  if (idade < 46) return "41-45";
  if (idade < 51) return "46-50";
  if (idade < 56) return "51-55";
  if (idade < 61) return "56-60";
  return "61+";
}

function extrairCompanhia_(nomeUnidade) {
  if (!nomeUnidade) return "Não identificada";
  const match = nomeUnidade.match(/(\d+)\s*(CIA[\wÀ-ÿ\s]*)/i);
  if (match) return (match[1] + " " + match[2]).trim().replace(/\s+/g, " ");
  return nomeUnidade;
}

function anoDe_(dataStr) {
  if (!dataStr) return null;
  const d = new Date(dataStr);
  if (isNaN(d)) return null;
  return d.getFullYear();
}

function faixaTempoServico_(anos) {
  if (anos === null) return "Não informado";
  if (anos <= 5) return "0-5";
  if (anos <= 10) return "6-10";
  if (anos <= 15) return "11-15";
  if (anos <= 20) return "16-20";
  if (anos <= 25) return "21-25";
  if (anos <= 30) return "26-30";
  return "31+";
}

function graficoDestruir_(id) {
  if (graficos[id]) {
    graficos[id].destroy();
    delete graficos[id];
  }
}

function graficoPizza_(id, contagemObj) {
  graficoDestruir_(id);
  const labels = Object.keys(contagemObj);
  const dados = Object.values(contagemObj);
  graficos[id] = new Chart(document.getElementById(id), {
    type: "pie",
    data: { labels, datasets: [{ data: dados, backgroundColor: CORES }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } }
    }
  });
}

function graficoBarras_(id, contagemObj, horizontal, ordemFixa) {
  graficoDestruir_(id);
  let entradas;
  if (ordemFixa) {
    entradas = ordemFixa.map((chave) => [chave, contagemObj[chave] || 0]);
  } else {
    entradas = Object.entries(contagemObj).sort((a, b) => b[1] - a[1]);
  }
  const labels = entradas.map((e) => e[0]);
  const dados = entradas.map((e) => e[1]);
  graficos[id] = new Chart(document.getElementById(id), {
    type: "bar",
    data: { labels, datasets: [{ label: "Efetivo", data: dados, backgroundColor: "#1F4E78" }] },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true }, y: { beginAtZero: true } }
    }
  });
}

function graficoLinha_(id, mapaOrdenado, titulo) {
  graficoDestruir_(id);
  const chaves = Object.keys(mapaOrdenado)
    .filter((c) => c !== "Não informado")
    .sort();
  const dados = chaves.map((c) => mapaOrdenado[c]);
  graficos[id] = new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels: chaves,
      datasets: [{
        label: titulo,
        data: dados,
        borderColor: "#1F4E78",
        backgroundColor: "rgba(31,78,120,0.15)",
        fill: true,
        tension: 0.25
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

function renderizarKpis_(lista) {
  const total = lista.length;
  const idades = lista.map((m) => calcularIdade_(m.dataNascimento)).filter((i) => i !== null);
  const idadeMedia = idades.length ? (idades.reduce((a, b) => a + b, 0) / idades.length).toFixed(1) : "-";
  const municipios = distintos_(lista, "nomeMunicipio").length;
  const companhias = new Set(lista.map((m) => extrairCompanhia_(m.nomeUnidade))).size;
  const femininos = lista.filter((m) => m.sexo === "F").length;
  const percFeminino = total ? ((femininos / total) * 100).toFixed(1) : "0";

  const cartoes = [
    { valor: total, rotulo: "Efetivo sincronizado" },
    { valor: idadeMedia, rotulo: "Idade média" },
    { valor: municipios, rotulo: "Municípios distintos" },
    { valor: companhias, rotulo: "Companhias/unidades distintas" },
    { valor: percFeminino + "%", rotulo: "Efetivo feminino" }
  ];

  kpisEl.innerHTML = cartoes
    .map(
      (c) =>
        '<div class="kpi-card"><div class="valor">' + c.valor + '</div><div class="rotulo">' + c.rotulo + "</div></div>"
    )
    .join("");
}

function renderizarDashboard(lista) {
  renderizarKpis_(lista);

  graficoBarras_("grafico-posto", contarPor_(lista, "postoGraduacao"), true);
  graficoBarras_("grafico-municipio", contarPor_(lista, "nomeMunicipio"), true);

  const companhias = {};
  lista.forEach((m) => {
    const c = extrairCompanhia_(m.nomeUnidade);
    companhias[c] = (companhias[c] || 0) + 1;
  });
  graficoBarras_("grafico-unidade", companhias, true);

  const faixasEtarias = {};
  lista.forEach((m) => {
    const f = faixaEtaria_(calcularIdade_(m.dataNascimento));
    faixasEtarias[f] = (faixasEtarias[f] || 0) + 1;
  });
  graficoBarras_(
    "grafico-idade",
    faixasEtarias,
    false,
    ["18-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "61+", "Não informado"]
  );

  graficoPizza_("grafico-sexo", contarPor_(lista, "sexo"));
  graficoPizza_("grafico-raca", contarPor_(lista, "raca"));
  graficoPizza_("grafico-estadocivil", contarPor_(lista, "estadoCivil"));
  graficoPizza_("grafico-situacao", contarPor_(lista, "sitFuncional"));
  graficoPizza_("grafico-instrucao", contarPor_(lista, "grauInstrucao"));
  graficoPizza_("grafico-quadro", contarPor_(lista, "quadro"));

  const ingressosPorAno = {};
  lista.forEach((m) => {
    const ano = anoDe_(m.dataInclusao);
    if (ano) ingressosPorAno[ano] = (ingressosPorAno[ano] || 0) + 1;
  });
  graficoLinha_("grafico-ingressos", ingressosPorAno, "Ingressos");

  const tempoServico = {};
  const hoje = new Date();
  lista.forEach((m) => {
    const ano = anoDe_(m.dataInclusao);
    const anos = ano ? hoje.getFullYear() - ano : null;
    const faixa = faixaTempoServico_(anos);
    tempoServico[faixa] = (tempoServico[faixa] || 0) + 1;
  });
  graficoBarras_(
    "grafico-tempoServico",
    tempoServico,
    false,
    ["0-5", "6-10", "11-15", "16-20", "21-25", "26-30", "31+", "Não informado"]
  );
}

async function carregarMilitares() {
  statusMilitares.textContent = "Carregando militares...";
  try {
    const q = query(collection(db, "militares"), orderBy("nomeServidor"));
    const snap = await getDocs(q);
    militaresCache = snap.docs.map((doc) => ({ matricula: doc.id, ...doc.data() }));
    preencherFiltros_(militaresCache);
    renderizarMilitares(militaresCache);
    renderizarDashboard(militaresCache);
  } catch (erro) {
    statusMilitares.textContent = "Erro ao carregar militares: " + erro.message;
  }
}

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    telaLogin.classList.add("escondido");
    telaApp.classList.remove("escondido");
    infoUsuario.textContent = usuario.displayName + " (" + usuario.email + ")";
    carregarMilitares();
  } else {
    telaLogin.classList.remove("escondido");
    telaApp.classList.add("escondido");
  }
});
