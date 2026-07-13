import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const telaLogin = document.getElementById("tela-login");
const telaApp = document.getElementById("tela-app");
const btnEntrar = document.getElementById("btn-entrar");
const btnSair = document.getElementById("btn-sair");
const infoUsuario = document.getElementById("info-usuario");
const mensagemErro = document.getElementById("mensagem-erro");

btnEntrar.addEventListener("click", () => {
  mensagemErro.textContent = "";
  signInWithPopup(auth, provider).catch((erro) => {
    mensagemErro.textContent = "Não foi possível entrar: " + erro.message;
  });
});

btnSair.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    telaLogin.classList.add("escondido");
    telaApp.classList.remove("escondido");
    infoUsuario.textContent = usuario.displayName + " (" + usuario.email + ")";
  } else {
    telaLogin.classList.remove("escondido");
    telaApp.classList.add("escondido");
  }
});
