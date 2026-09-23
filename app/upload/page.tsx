"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function UploadPage() {
  const router = useRouter();
  const [file,setFile]=useState<File|null>(null);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function publish(e:FormEvent){
    e.preventDefault();
    if(!supabase) return setMessage("Supabase n'est pas configuré.");
    if(!file) return setMessage("Choisis une vidéo.");
    if(!file.type.startsWith("video/")) return setMessage("Le fichier doit être une vidéo.");
    if(file.size>100*1024*1024) return setMessage("La vidéo doit faire moins de 100 Mo.");
    setBusy(true); setMessage("");
    const {data,error}=await supabase.auth.getUser();
    if(error||!data.user){setBusy(false);return setMessage("Connecte-toi avant de publier.");}
    const path=data.user.id+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const upload=await supabase.storage.from("videos").upload(path,file,{contentType:file.type,upsert:false});
    if(upload.error){setBusy(false);return setMessage("Upload impossible : "+upload.error.message);}
    const {data:publicData}=supabase.storage.from("videos").getPublicUrl(path);
    const insert=await supabase.from("craken_videos").insert({creator_id:data.user.id,title:title.trim()||null,description:description.trim()||null,video_url:publicData.publicUrl,visibility:"public"});
    if(insert.error){await supabase.storage.from("videos").remove([path]);setBusy(false);return setMessage("Publication impossible : "+insert.error.message);}
    router.replace("/"); router.refresh();
  }

  return <main className="auth-page"><div className="auth-card"><div className="logo">Craken<span>-type</span></div><h1>Publier une vidéo</h1><p>Ajoute une vidéo à ton fil Craken-type.</p><form onSubmit={publish}><input type="file" accept="video/*" required onChange={e=>setFile(e.target.files?.[0]??null)}/><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre de la vidéo" maxLength={120}/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" maxLength={500} rows={4}/><button type="submit" disabled={busy}>{busy?"Publication…":"Publier"}</button></form>{message&&<div className="auth-message">{message}</div>}<button className="back" onClick={()=>router.push("/")}>← Retour au fil</button></div></main>;
}