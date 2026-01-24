<template>
  <!-- Modal automático (NÃO bloqueia o site, pode fechar) -->
  <v-dialog v-model="assinaturaModal" max-width="420px">
    <v-card>
      <v-card-title>🔑 Ativar Assinatura</v-card-title>

      <v-card-text>
        <p style="margin:0 0 10px; opacity:.85">
          Sua assinatura está inativa ou expirou. Ative para liberar todos os recursos.
        </p>

        <v-text-field
          v-model="chaveAssinatura"
          label="Digite sua chave"
          outlined
          dense
          @keyup.enter="ativarAssinatura"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="assinaturaModal = false">Agora não</v-btn>
        <v-btn color="primary" :loading="loadingAtivar" @click="ativarAssinatura">
          Ativar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  setDoc,
  doc as docRef,
} from "firebase/firestore";
import { useToast } from "vue-toast-notification";
import "vue-toast-notification/dist/theme-sugar.css";

const $toast = useToast();

const assinaturaModal = ref(false);
const chaveAssinatura = ref("");
const loadingAtivar = ref(false);

let unsubAuth = null;

function isAssinaturaValida(userData) {
  const endRaw = userData?.subscriptionEnd; // ISO string
  const endDate = endRaw ? new Date(endRaw) : null;
  const now = new Date();

  return (
    userData?.subscription === "ativa" &&
    endDate instanceof Date &&
    !isNaN(endDate) &&
    endDate > now
  );
}

async function getUserDocByEmail(emailLower) {
  const q = query(
    collection(db, "users"),
    where("email", "==", emailLower),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  return { id: d.id, data: d.data() };
}

// ✅ abre o modal só se estiver inativa/expirada
async function verificarEabrirModalSePrecisa() {
  const user = auth.currentUser;
  if (!user?.email) return;

  const emailLower = user.email.toLowerCase();
  const u = await getUserDocByEmail(emailLower);
  if (!u) {
    // se não achou doc, pode decidir abrir ou não.
    // vou abrir pra incentivar ativação:
    abrirModalUmaVezPorDia();
    return;
  }

  const valida = isAssinaturaValida(u.data);

  if (!valida) {
    // opcional: se expirou mas ainda está "ativa", marca como inativa
    if (u.data?.subscription === "ativa") {
      const endRaw = u.data.subscriptionEnd;
      const endDate = endRaw ? new Date(endRaw) : null;
      if (endDate && !isNaN(endDate) && endDate <= new Date()) {
        await setDoc(
          docRef(db, "users", u.id),
          { subscription: "inativa" },
          { merge: true }
        );
      }
    }

    abrirModalUmaVezPorDia();
  }
}

// ✅ evita abrir toda hora (ex.: abre 1 vez por dia)
function abrirModalUmaVezPorDia() {
  const key = "assinatura_modal_last_open";
  const last = localStorage.getItem(key);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (last === today) return; // já abriu hoje

  localStorage.setItem(key, today);
  assinaturaModal.value = true;
}

async function ativarAssinatura() {
  try {
    loadingAtivar.value = true;

    const user = auth.currentUser;
    if (!user?.email) {
      $toast.error("Usuário não autenticado", { position: "top" });
      return;
    }

    const emailLower = user.email.toLowerCase();
    const u = await getUserDocByEmail(emailLower);
    if (!u) {
      $toast.error("Usuário não encontrado no Firestore", { position: "top" });
      return;
    }

    // valida chave
    const chavesSnap = await getDocs(collection(db, "Chaves"));
    if (chavesSnap.empty) {
      $toast.error("Nenhuma chave encontrada!", { position: "top" });
      return;
    }

    const keys = chavesSnap.docs[0].data().Keys || [];
    if (!keys.includes(chaveAssinatura.value)) {
      $toast.error("Chave inválida!", { position: "top" });
      return;
    }

    // define 30 dias
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 30);

    await setDoc(
      docRef(db, "users", u.id),
      {
        subscription: "ativa",
        subscriptionStart: start.toISOString(),
        subscriptionEnd: end.toISOString(),
      },
      { merge: true }
    );

    $toast.success("Assinatura ativada!", { position: "top" });
    assinaturaModal.value = false;
    chaveAssinatura.value = "";

    // se quiser: marcar que hoje já abriu (pra não reabrir)
    localStorage.setItem("assinatura_modal_last_open", new Date().toISOString().slice(0, 10));
  } catch (err) {
    console.error(err);
    $toast.error("Erro ao ativar assinatura!", { position: "top" });
  } finally {
    loadingAtivar.value = false;
  }
}

onMounted(() => {
  unsubAuth = onAuthStateChanged(auth, async () => {
    await verificarEabrirModalSePrecisa();
  });
});

onBeforeUnmount(() => {
  if (unsubAuth) unsubAuth();
});
</script>
