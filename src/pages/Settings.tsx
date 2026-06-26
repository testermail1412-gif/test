import { useState } from "react";
import { Save } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Field, Avatar } from "../components/ui";
import { getSoundEnabled, setSoundEnabled, sfx } from "../lib/sound";

export default function Settings() {
  const { me, updateMe, pushToast } = useStore();
  const [f, setF] = useState({
    name: me!.name, handle: me!.handle, bio: me!.bio, location: me!.location, website: me!.website,
    email: me!.email, avatarColor: me!.avatarColor,
  });
  const [s, setS] = useState(me!.settings);
  const [sound, setSound] = useState(getSoundEnabled());
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });
  const colors = ["#6d5efc", "#22d3a8", "#ff7a59", "#39a0ed", "#e74c9b", "#f5b400"];

  const save = () => {
    updateMe({ ...f, settings: s });
    pushToast({ title: "Gespeichert", body: "Deine Einstellungen wurden aktualisiert.", kind: "success" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      <div className="card p-6 space-y-5">
        <h2 className="font-bold">Profil</h2>
        <div className="flex items-center gap-4">
          <Avatar name={f.name} color={f.avatarColor} size={64} />
          <div className="flex gap-2">
            {colors.map((c) => (
              <button key={c} onClick={() => setF({ ...f, avatarColor: c })}
                className={`w-8 h-8 rounded-lg ${f.avatarColor === c ? "ring-2 ring-white" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={f.name} onChange={set("name")} /></Field>
          <Field label="Benutzername"><input className="input" value={f.handle} onChange={set("handle")} /></Field>
        </div>
        <Field label="Bio"><textarea rows={3} className="input" value={f.bio} onChange={set("bio")} placeholder="Erzähl etwas über dich…" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Standort"><input className="input" value={f.location} onChange={set("location")} /></Field>
          <Field label="Website"><input className="input" value={f.website} onChange={set("website")} /></Field>
        </div>
        <Field label="E-Mail"><input className="input" value={f.email} onChange={set("email")} /></Field>
      </div>

      <div className="card p-6 space-y-2 mt-5">
        <h2 className="font-bold mb-2">Benachrichtigungen & Privatsphäre</h2>
        <Toggle label="Online-Status anzeigen" v={s.showOnline} on={(v) => setS({ ...s, showOnline: v })} />
        <Toggle label="E-Mail-Benachrichtigungen" v={s.emailNotifs} on={(v) => setS({ ...s, emailNotifs: v })} />
        <Toggle label="Desktop-Popup bei neuen Nachrichten" v={s.desktopNotifs} on={(v) => setS({ ...s, desktopNotifs: v })} />
        <Toggle label="Zwei-Faktor-Authentifizierung" v={s.twoFactor} on={(v) => setS({ ...s, twoFactor: v })} />
        <Toggle label="Sound-Effekte" v={sound} on={(v) => { setSound(v); setSoundEnabled(v); if (v) sfx.success(); }} />
      </div>

      <button onClick={save} className="btn-primary w-full mt-5"><Save size={16} /> Änderungen speichern</button>
    </div>
  );
}

function Toggle({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <button onClick={() => on(!v)} className="w-full flex items-center justify-between py-2.5 text-sm">
      {label}
      <span className={`w-11 h-6 rounded-full p-0.5 transition ${v ? "bg-brand" : "bg-line"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition ${v ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}
