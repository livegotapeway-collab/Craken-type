"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return setMessage("Supabase n'est pas encore configuré.");
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setSent(true);
    setMessage("Code envoyé. Vérifie ta boîte e-mail.");
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      return setMessage(error.message);
    }
    if (data.user) {
      const base = (data.user.email?.split("@")[0] || "craken").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || "craken";
      const username = `${base}_${data.user.id.slice(0, 6)}`;
      const { error: profileError } = await supabase.from("profiles").upsert(
        { id: data.user.id, username, full_name: base, country: "RDC" },
        { onConflict: "id", ignoreDuplicates: true }
      );
      if (profileError) {
        setBusy(false);
        return setMessage("Connexion réussie, mais création du profil impossible : " + profileError.message);
      }
    }
    setBusy(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="logo">Craken<span>-type</span></div>
        <h1>{sent ? "Entre le code reçu" : "Créer ton compte"}</h1>
        <p>{sent ? "Un code à 6 chiffres a été envoyé à ton adresse e-mail." : "Inscris-toi ou connecte-toi avec ton adresse e-mail."}</p>
        {!sent ? (
          <form onSubmit={sendCode}>
            <input type="email" required placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button type="submit" disabled={busy}>{busy ? "Envoi…" : "Recevoir le code"}</button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" />
            <button type="submit" disabled={busy}>{busy ? "Vérification…" : "Vérifier le code"}</button>
            <button type="button" className="secondary" onClick={() => setSent(false)}>Modifier l'e-mail</button>
          </form>
        )}
        {message && <div className="auth-message">{message}</div>}
        <button className="back" onClick={() => router.push("/")}>← Retour au fil</button>
      </div>
    </main>
  );
}
