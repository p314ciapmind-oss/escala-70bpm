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

async function carregarMilitares() {
  statusMilitares.textContent = "Carregando militares...";
  try {
    const q = query(collection(db, "militares"), orderBy("nomeServidor"));
    const snap = await getDocs(q);
    militaresCache = snap.docs.map((doc) => ({ matricula: doc.id, ...doc.data() }));
    renderizarMilitares(militaresCache);
  } catch (erro) {
    statusMilitares.textContent = "Erro ao carregar militares: " + erro.message;
  }
}

campoBusca.addEventListener("input", () => {
  const termo = campoBusca.value.trim().toLowerCase();
  if (!termo) {
    renderizarMilitares(militaresCache);
    return;
  }
  const filtrados = militaresCache.filter((m) =>
    (m.nomeServidor || "").toLowerCase().includes(termo) ||
    (m.matricula || "").toLowerCase().includes(termo) ||
    (m.postoGraduacao || "").toLowerCase().includes(termo) ||
    (m.nomeUnidade || "").toLowerCase().includes(termo)
  );
  renderizarMilitares(filtrados);
});

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
