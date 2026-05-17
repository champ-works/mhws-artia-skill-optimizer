"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "mhw-skill-table-v2";

const WEAPONS = ["大剣","太刀","片手剣","双剣","ハンマー","狩猟笛","ランス","ガンス","スラアク","チャアク","操虫棍","ライト","ヘビィ","弓"];
const ELEMENTS = ["火","水","雷","氷","龍","無","毒","麻痺","睡眠","爆破"];

const WEAPON_COLORS: Record<string, string> = {
  "大剣":"bg-blue-100 text-blue-800","太刀":"bg-teal-100 text-teal-800",
  "片手剣":"bg-orange-100 text-orange-800","双剣":"bg-pink-100 text-pink-800",
  "ハンマー":"bg-amber-100 text-amber-800","狩猟笛":"bg-purple-100 text-purple-800",
  "ランス":"bg-gray-100 text-gray-800","ガンス":"bg-red-100 text-red-800",
  "スラアク":"bg-cyan-100 text-cyan-800","チャアク":"bg-indigo-100 text-indigo-800",
  "操虫棍":"bg-green-100 text-green-800","弓":"bg-yellow-100 text-yellow-800",
  "ライト":"bg-slate-100 text-slate-800","ヘビィ":"bg-zinc-100 text-zinc-800",
};

const ELEM_COLORS: Record<string, string> = {
  "火":"bg-red-100 text-red-800","水":"bg-blue-100 text-blue-800",
  "雷":"bg-yellow-100 text-yellow-800","氷":"bg-cyan-100 text-cyan-800",
  "龍":"bg-purple-100 text-purple-800","無":"bg-gray-100 text-gray-800",
  "毒":"bg-lime-100 text-lime-800","麻痺":"bg-yellow-100 text-yellow-800",
  "睡眠":"bg-indigo-100 text-indigo-800","爆破":"bg-orange-100 text-orange-800",
};

const ARTIA_WEAPON_MAP: Record<string, string> = {
  "巨戟アーティア":"大剣","忘却のオストランツァ":"大剣",
  "斬罪のエルガンシオ":"太刀","破滅のキリエヴェルド":"片手剣",
  "永訣のクラウクライス":"双剣","禁戒のデスヴァンケル":"ハンマー",
  "闇黒のテルプリティカ":"狩猟笛","天涯のゲガルンロウ":"ランス",
  "前兆のプロフェネシス":"ガンス","邪執のコンキエレガン":"スラアク",
  "代償のネイディ・ギア":"チャアク","堕在のラクリエリカ":"操虫棍",
  "荊冠のデストレーター":"ライト","戦慄のヘルシャフェン":"ヘビィ",
  "亡国のクピドバイン":"弓",
};

export interface Entry {
  id: number;
  n: number;
  weapon: string;
  element: string;
  name: string;
  skill1: string;
  skill2: string;
  ts: string;
}

function guessWeaponFromName(name: string): string | null {
  if (!name) return null;
  if (ARTIA_WEAPON_MAP[name]) return ARTIA_WEAPON_MAP[name];
  for (const [k, v] of Object.entries(ARTIA_WEAPON_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return null;
}

function loadDB(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDB(db: Entry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) { console.error("saveDB error:", e); }
}

function normalizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("画像変換失敗"));
    img.src = dataUrl;
  });
}

// シリーズスキル・グループスキル（アーティア武器専用）
const SERIES_SKILLS = [
  "巨戟龍の黙示録","黒蝕竜の力","兇爪竜の力","白熾龍の脈動","泡狐竜の力","雷顎竜の闘志",
  "暗器蛸の力","暗黒騎士の証","オメガレゾナンス","海竜の渦雷","火竜の力",
  "煌雷竜の力","獄焔蛸の反逆","護鎖刃竜の命脈","鎖刃竜の飢餓","千刃竜の闘志",
  "凍峰竜の反逆","波衣竜の守護","闢獣の力","雪獅子の闘志","鎧竜の守護",
];
const GROUP_SKILLS = [
  "ヌシの魂","ヌシの憤激","ヌシの誇り","鱗重ねの工夫","鱗張りの技法",
  "革細工の滑性","革細工の柔性","毛皮の昂揚","毛皮の誘惑",
  "甲虫の擬態","甲虫の知らせ","護竜の守り","護竜の脈動","先達の導き",
];
const ALL_SKILLS = [...SERIES_SKILLS, ...GROUP_SKILLS];

function normalize(s: string): string {
  return s.replace(/\s/g, "").replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  ).replace(/[^　-鿿＀-￯]/g, "");
}

// OCRゆらぎに対応したファジーマッチング（文字列の部分シーケンス一致率で判定）
function fuzzyScore(ocr: string, skill: string): number {
  const o = normalize(ocr);
  const s = normalize(skill);
  if (s.length === 0) return 0;
  let matched = 0;
  let pos = 0;
  for (const ch of s) {
    const idx = o.indexOf(ch, pos);
    if (idx !== -1) { matched++; pos = idx + 1; }
  }
  return matched / s.length;
}

function findBestSkillMatch(text: string): string {
  const norm = normalize(text);
  // 完全一致を優先
  for (const skill of ALL_SKILLS) {
    if (norm.includes(normalize(skill))) return skill;
  }
  // ファジーマッチ（60%以上一致したら採用）
  let best = ""; let bestScore = 0;
  for (const skill of ALL_SKILLS) {
    if (normalize(skill).length < 4) continue;
    const score = fuzzyScore(norm, skill);
    if (score >= 0.5 && score > bestScore) { bestScore = score; best = skill; }
  }
  return best;
}

async function analyzeScreenshot(
  dataUrl: string,
  onProgress: (msg: string) => void
): Promise<{ weaponName: string; weapon: string; element: string; skill1: string; skill2: string; _rawText?: string }> {
  onProgress("🔄 画像を最適化中...");
  dataUrl = await normalizeImage(dataUrl);
  const { createWorker } = await import("tesseract.js");
  onProgress("🔄 OCRエンジンを起動中...");
  const worker = await createWorker("jpn", 1, {
    logger: (m: { status: string; progress: number }) => {
      const pct = Math.round((m.progress || 0) * 100);
      if (m.status === "loading language traineddata") {
        onProgress(`⬇️ 日本語データを読み込み中... ${pct}%\n（初回のみ時間がかかります。このままお待ちください）`);
      } else if (m.status === "recognizing text") {
        onProgress(`🔍 文字認識中... ${pct}%`);
      }
    },
  });
  try {
    const { data: { text } } = await worker.recognize(dataUrl);
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    // スペースを除去した行（マッチング用）
    const linesNoSpace = lines.map(l => l.replace(/\s/g, ""));

    // 武器名を探す（完全一致→ファジーマッチの順で試みる）
    // OCR全テキストを1行に結合してもマッチできるようにする
    const fullText = linesNoSpace.join("");
    let weaponName = "";
    // まず完全一致
    for (const key of Object.keys(ARTIA_WEAPON_MAP)) {
      if (fullText.includes(normalize(key))) { weaponName = key; break; }
    }
    // ファジーマッチ（カタカナ部分が長いので0.55以上で採用）
    if (!weaponName) {
      let best = ""; let bestScore = 0;
      for (const key of Object.keys(ARTIA_WEAPON_MAP)) {
        const score = fuzzyScore(fullText, normalize(key));
        if (score >= 0.55 && score > bestScore) { bestScore = score; best = key; }
      }
      weaponName = best;
    }

    // 属性を探す（スペース除去してマッチ）
    let element = "";
    for (const norm of linesNoSpace) {
      for (const el of ["火","水","雷","氷","龍","無"]) {
        if (norm.includes(el + "属性") || norm.includes(el + "タイプ")) {
          element = el;
          break;
        }
      }
      if (element) break;
    }

    // スキルを探す（スペース除去してマッチ）
    const skills: string[] = [];
    for (const norm of linesNoSpace) {
      const match = findBestSkillMatch(norm);
      if (match && !skills.includes(match)) skills.push(match);
      if (skills.length >= 2) break;
    }

    // シリーズスキル(skill1)とグループスキル(skill2)に分類
    const seriesFound = skills.filter(s => SERIES_SKILLS.includes(s));
    const groupFound  = skills.filter(s => GROUP_SKILLS.includes(s));

    return {
      weaponName,
      weapon: ARTIA_WEAPON_MAP[weaponName] || "",
      element,
      skill1: seriesFound[0] || "",
      skill2: groupFound[0]  || "",
      _rawText: text,
    };
  } finally {
    await worker.terminate();
  }
}

function Badge({ label, colorClass }: { label: string; colorClass?: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass || "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
}

// ── 記録＋テーブル統合タブ ────────────────────────────────────────
function CaptureTab({ db, setDb }: { db: Entry[]; setDb: (d: Entry[]) => void }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [weapon, setWeapon] = useState("");
  const [element, setElement] = useState("");
  const [nVal, setNVal] = useState("1");
  const [skill1, setSkill1] = useState("");
  const [skill2, setSkill2] = useState("");
  const [log, setLog] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const dbRef = useRef(db);
  const nValRef = useRef(nVal);

  useEffect(() => { dbRef.current = db; }, [db]);
  useEffect(() => { nValRef.current = nVal; }, [nVal]);

  const processImageSrc = async (src: string) => {
    setImgSrc(src);
    setLog("🔄 画像受信...");
    try {
        const result = await analyzeScreenshot(src, setLog);
      const resolvedWeapon = (() => {
        const guessed = guessWeaponFromName(result.weaponName);
        if (guessed) return guessed;
        if (result.weapon && WEAPONS.includes(result.weapon)) return result.weapon;
        return "";
      })();
      const resolvedElement = (result.element && result.element !== "不明" && ELEMENTS.includes(result.element))
        ? result.element : "";

      // 武器種と属性が取れた場合に自動保存（スキルは任意）
      if (resolvedWeapon && resolvedElement) {
        const entry: Entry = {
          id: Date.now(),
          n: parseInt(nValRef.current) || dbRef.current.length + 1,
          weapon: resolvedWeapon,
          element: resolvedElement,
          name: result.weaponName || "",
          skill1: result.skill1,
          skill2: result.skill2 || "",
          ts: new Date().toLocaleDateString("ja-JP"),
        };
        const next = [...dbRef.current, entry];
        setDb(next);
        saveDB(next);
        setNVal(v => String(parseInt(v) + 1));
        setLog(`✓ 自動保存: ${entry.weapon}(${entry.element}) #${entry.n}\nスキル: ${entry.skill1} / ${entry.skill2}`);
        setImgSrc(null);
      } else {
        // 取れた情報をフォームにセットして手動保存を促す
        if (result.skill1) setSkill1(result.skill1);
        if (result.skill2) setSkill2(result.skill2);
        if (resolvedWeapon) setWeapon(resolvedWeapon);
        if (resolvedElement) setElement(resolvedElement);
        const missing = [];
        if (!resolvedWeapon) missing.push("武器種");
        if (!resolvedElement) missing.push("属性");
        setLog(`⚠️ ${missing.join("・")}が読み取れませんでした。フォームで確認して「記録を保存」を押してください。\n[OCR生テキスト]: ${result._rawText?.slice(0, 200) || "(空)"}`);
      }
    } catch (err) {
      setLog("❌ " + ((err as Error).message || String(err)));
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImageSrc(ev.target!.result as string);
    reader.onerror = () => setLog("❌ ファイル読み込み失敗");
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) { setLog("❌ クリップボードにアクセスできません"); return; }
    const imgItem = Array.from(items).find(i => i.type.startsWith("image/"));
    if (!imgItem) { setLog("❌ クリップボードに画像がありません"); return; }
    const file = imgItem.getAsFile();
    if (!file) { setLog("❌ 画像の取得に失敗しました"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => processImageSrc(ev.target!.result as string);
    reader.onerror = () => setLog("❌ ファイル読み込み失敗");
    reader.readAsDataURL(file);
  };

  const startEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setWeapon(entry.weapon);
    setElement(entry.element);
    setSkill1(entry.skill1);
    setSkill2(entry.skill2);
    setImgSrc(null); setLog(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSkill1(""); setSkill2("");
  };

  const handleSave = () => {
    if (!weapon || !element) { setSaveMsg("武器種と属性は必須です"); return; }
    if (editingId !== null) {
      const next = db.map(e => e.id === editingId ? { ...e, weapon, element, skill1, skill2 } : e);
      setDb(next); saveDB(next);
      setEditingId(null);
      setSkill1(""); setSkill2("");
      setImgSrc(null); setLog(null);
      setSaveMsg("✓ 更新しました");
    } else {
      const entry: Entry = {
        id: Date.now(),
        n: parseInt(nVal) || db.length + 1,
        weapon, element, name: "", skill1, skill2,
        ts: new Date().toLocaleDateString("ja-JP"),
      };
      const next = [...db, entry];
      setDb(next); saveDB(next);
      setNVal(v => String(parseInt(v) + 1));
      setSkill1(""); setSkill2("");
      setImgSrc(null); setLog(null);
      setSaveMsg(`✓ 保存しました（保存済み${next.length}件）`);
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">スクショをアップロードすると武器種・属性・スキルを自動読み取りします</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
        <p className="text-xs text-amber-700 font-medium">📌 スクショの撮り方</p>
        <p className="text-xs text-amber-600">武器名〜グループスキルが映る範囲だけを切り取ってください。画面全体だと読み取り精度が大きく下がります。</p>
        <p className="text-xs text-amber-600">読み取れなかった項目はフォームから手入力できます。</p>
      </div>
      <div
        onPaste={handlePaste}
        className="border border-dashed border-gray-300 rounded-xl p-6 text-center"
      >
        <div className="text-3xl mb-2">📷</div>
        <label style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
          <span className="text-sm text-blue-500 underline">タップしてアップロード</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
          />
        </label>
        <div className="text-xs text-gray-300 mt-1">PCはここをクリック後 Ctrl+V で貼り付け可</div>
      </div>

      {imgSrc && <img src={imgSrc} className="w-full max-h-44 object-contain rounded-lg border border-gray-100" alt="preview" />}
      {log && (
        <div className={`text-xs rounded-lg px-3 py-2 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto ${
          log.startsWith("✓") ? "bg-green-50 text-green-700" :
          log.startsWith("❌") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
        }`}>
          {log}
        </div>
      )}

      {/* n回目 + リセット */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">n回目</label>
          <input type="number" value={nVal} onChange={e => setNVal(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
        </div>
        <button
          type="button"
          onClick={() => { setNVal("1"); setWeapon(""); setElement(""); setSkill1(""); setSkill2(""); setImgSrc(null); setLog(null); setSaveMsg(null); }}
          className="mt-5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-400 cursor-pointer"
        >リセット</button>
      </div>

      {/* 武器種ボタン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">武器種</label>
        <div className="flex flex-wrap gap-1">
          {WEAPONS.map(w => (
            <button type="button" key={w} onClick={() => setWeapon(v => v === w ? "" : w)}
              className={`px-2 py-1 text-xs rounded-lg border cursor-pointer ${weapon === w ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600"}`}>
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* 属性ボタン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">属性</label>
        <div className="flex flex-wrap gap-1">
          {ELEMENTS.map(el => (
            <button type="button" key={el} onClick={() => setElement(v => v === el ? "" : el)}
              className={`px-3 py-1 text-xs rounded-lg border cursor-pointer ${element === el ? `${ELEM_COLORS[el]} border-transparent font-bold` : "border-gray-200 text-gray-600"}`}>
              {el}
            </button>
          ))}
        </div>
      </div>

      {/* スキルプルダウン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">シリーズスキル</label>
        <select value={skill1} onChange={e => setSkill1(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white">
          <option value="">選択...</option>
          {SERIES_SKILLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">グループスキル</label>
        <select value={skill2} onChange={e => setSkill2(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white">
          <option value="">選択...</option>
          {GROUP_SKILLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {editingId !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-blue-700">✏️ セルを編集中</span>
          <button type="button" onClick={cancelEdit} className="text-xs text-blue-400 cursor-pointer">キャンセル</button>
        </div>
      )}
      {saveMsg && <p className="text-xs text-center text-green-600 font-medium">{saveMsg}</p>}
      <button type="button" onClick={handleSave} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">
        {editingId !== null ? "記録を更新して保存" : "記録を保存"}
      </button>

      {/* ── テーブル ── */}
      {db.length > 0 && (() => {
        const maxN = Math.max(...db.map(e => e.n));
        // 追加された順に列を並べる
        const cols = [...new Set(db.map(e => `${e.weapon}/${e.element}`))];
        const cellMap: Record<string, Entry> = {};
        db.forEach(e => { cellMap[`${e.n}/${e.weapon}/${e.element}`] = e; });

        const delEntry = (id: number) => {
          if (!confirm("削除しますか？")) return;
          const next = db.filter(e => e.id !== id);
          setDb(next); saveDB(next);
        };

        const handleCheck = (key: string, n: number) => {
          const rowKey = Object.keys(checked).find(k => checked[k] && k.startsWith(`${n}/`) && k !== key);
          if (rowKey) {
            if (!confirm("同じ行に既にチェックがあります。入れ替えますか？")) return;
            setChecked(prev => ({ ...prev, [rowKey]: false, [key]: true }));
            return;
          }
          setChecked(prev => ({ ...prev, [key]: !prev[key] }));
        };

        const clearAll = () => {
          if (!confirm("全記録を削除しますか？")) return;
          setDb([]); saveDB([]); setChecked({}); setNVal("1");
        };

        return (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">行=n回目 / 列=武器種+属性<br />セルをタップで回収したいスキルをマーク（1行1つ）</p>
              <button type="button" onClick={clearAll} className="text-xs text-red-300 border border-red-200 rounded px-2 py-0.5 cursor-pointer">全クリア</button>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse min-w-full bg-white text-gray-800">
                <thead>
                  <tr>
                    <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500">#</th>
                    {cols.map(col => {
                      const [w, el] = col.split("/");
                      return (
                        <th key={col} className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-700 whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge label={w} colorClass={WEAPON_COLORS[w]} />
                            {el && <Badge label={el} colorClass={ELEM_COLORS[el]} />}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxN }, (_, i) => i + 1).map(n => (
                    <tr key={n} className="bg-white">
                      <td className="border border-gray-200 px-2 py-1 text-center text-gray-500 bg-gray-50">{n}</td>
                      {cols.map(col => {
                        const entry = cellMap[`${n}/${col}`];
                        const ck = `${n}/${col}`;
                        const isChecked = !!checked[ck];
                        return (
                          <td
                            key={col}
                            onClick={() => entry && handleCheck(ck, n)}
                            className={`border px-2 py-1 text-center ${entry ? `cursor-pointer ${SCORE_STYLES[getCellScore(entry.skill1, entry.skill2)]?.bg || "border-gray-200"}` : "border-gray-200"} ${isChecked ? "ring-2 ring-inset ring-blue-400" : ""}`}
                          >
                            {entry ? (
                              <div className="relative flex flex-col items-center gap-0.5 pr-3">
                                {SCORE_STYLES[getCellScore(entry.skill1, entry.skill2)] && (
                                  <span className="text-yellow-500 text-xs leading-none">{SCORE_STYLES[getCellScore(entry.skill1, entry.skill2)].stars}</span>
                                )}
                                <span className="text-xs text-gray-800">{entry.skill1 || "？"}</span>
                                <span className="text-xs text-gray-400">×</span>
                                <span className="text-xs text-gray-600">{entry.skill2 || "？"}</span>
                                <div className="absolute top-0 right-0 flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); startEdit(entry); }}
                                    className="text-gray-300 leading-none text-xs cursor-pointer"
                                    title="編集"
                                  >✏️</button>
                                  <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); delEntry(entry.id); }}
                                    className="text-gray-300 leading-none text-xs cursor-pointer"
                                    title="削除"
                                  >🗑</button>
                                </div>
                              </div>
                            ) : <span className="text-gray-100">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-xs text-gray-400">オススメ度：</span>
              {Object.entries(SCORE_STYLES).sort((a,b) => Number(b[0])-Number(a[0])).map(([score, s]) => (
                <span key={score} className={`text-xs px-2 py-0.5 rounded border ${s.bg}`}>
                  <span className="text-yellow-500">{s.stars}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const SKILL_POPULARITY: Record<string, number> = {
  "巨戟龍の黙示録": 3, "黒蝕竜の力": 3,
  "兇爪竜の力": 2, "白熾龍の脈動": 2,
  "泡狐竜の力": 1, "雷顎竜の闘志": 1,
  "ヌシの魂": 3,
};

function getCellScore(skill1: string, skill2: string): number {
  return (SKILL_POPULARITY[skill1] || 0) + (SKILL_POPULARITY[skill2] || 0);
}

const SCORE_STYLES: Record<number, { bg: string; stars: string }> = {
  6: { bg: "bg-yellow-50 border-yellow-400",  stars: "★★★★★★" },
  5: { bg: "bg-yellow-50 border-yellow-300",  stars: "★★★★★" },
  4: { bg: "bg-amber-50 border-amber-300",    stars: "★★★★" },
  3: { bg: "bg-green-50 border-green-300",    stars: "★★★" },
  2: { bg: "bg-blue-50 border-blue-300",      stars: "★★" },
  1: { bg: "bg-gray-50 border-gray-300",      stars: "★" },
};

// ── スキル検索タブ ──────────────────────────────────────────────
function SearchTab({ db }: { db: Entry[] }) {
  const [seriesSkill, setSeriesSkill] = useState("");
  const [groupSkill, setGroupSkill] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);

  const search = () => {
    if (!seriesSkill && !groupSkill) { setResults([]); return; }
    const matches = db.filter(e =>
      (!seriesSkill || e.skill1 === seriesSkill || e.skill2 === seriesSkill) &&
      (!groupSkill  || e.skill1 === groupSkill  || e.skill2 === groupSkill)
    ).sort((a, b) => a.n - b.n);
    setResults(matches);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">スキルを選んで記録済みデータの場所を検索します</p>
      <div>
        <label className="text-xs text-gray-400 block mb-1">シリーズスキル</label>
        <select value={seriesSkill} onChange={e => setSeriesSkill(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white text-gray-900">
          <option value="">指定なし</option>
          {SERIES_SKILLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">グループスキル</label>
        <select value={groupSkill} onChange={e => setGroupSkill(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white text-gray-900">
          <option value="">指定なし</option>
          {GROUP_SKILLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <button type="button" onClick={search} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">
        検索
      </button>
      {results !== null && (
        results.length === 0
          ? <div className="text-center py-6 text-gray-300 text-sm">該当するデータがありません</div>
          : (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-gray-400">{results.length}件ヒット（n回目の小さい順）</p>
              {results.map(e => (
                <div key={e.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">{e.n}<span className="text-xs font-normal text-gray-400 ml-0.5">回目</span></span>
                    <Badge label={e.weapon} colorClass={WEAPON_COLORS[e.weapon]} />
                    <Badge label={e.element} colorClass={ELEM_COLORS[e.element]} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{e.skill1 || "？"}{e.skill2 ? ` / ${e.skill2}` : ""}</div>
                </div>
              ))}
            </div>
          )
      )}
      {db.length === 0 && <div className="text-center py-6 text-gray-300 text-sm">記録タブでデータを追加してください</div>}
    </div>
  );
}

// ── 統計タブ ────────────────────────────────────────────────────
function StatsTab({ db }: { db: Entry[] }) {
  const weapons = [...new Set(db.map(e => e.weapon))].length;
  const skills: Record<string, number> = {};
  db.forEach(e => {
    if (e.skill1) skills[e.skill1] = (skills[e.skill1] || 0) + 1;
    if (e.skill2) skills[e.skill2] = (skills[e.skill2] || 0) + 1;
  });
  const top = Object.entries(skills).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxN = db.length > 0 ? Math.max(...db.map(e => e.n)) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {([["総記録数", db.length], ["武器種数", weapons], ["最大テーブル位置", maxN], ["スキル種類", Object.keys(skills).length]] as const).map(([label, val]) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-semibold text-gray-900">{val}</div>
          </div>
        ))}
      </div>
      {top.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">出現頻度 top {top.length}</div>
          <div className="space-y-2">
            {top.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{name}</span><span>{count}回</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-800 rounded-full" style={{ width: `${Math.round(count / top[0][1] * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {db.length === 0 && <div className="text-center py-12 text-gray-300 text-sm">データがありません</div>}
    </div>
  );
}

// ── メインアプリ ────────────────────────────────────────────────
const TABS = [
  { id: "capture", icon: "📷", label: "記録" },
  { id: "search",  icon: "🔍", label: "スキル検索" },
  { id: "stats",   icon: "📊", label: "統計" },
];

export default function MHWTracker() {
  const [tab, setTab] = useState("capture");
  const [db, setDb] = useState<Entry[]>([]);

  useEffect(() => {
    setDb(loadDB());
  }, []);

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      <h1 className="text-center text-base font-bold text-gray-700 mb-4">
        巨戟アーティアスキル厳選補助ツール
      </h1>
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
          >
            <span className="mr-0.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ display: tab === "capture" ? "block" : "none" }}><CaptureTab db={db} setDb={setDb} /></div>
      <div style={{ display: tab === "search"  ? "block" : "none" }}><SearchTab  db={db} /></div>
      <div style={{ display: tab === "stats"   ? "block" : "none" }}><StatsTab   db={db} /></div>
      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <a
          href="https://buymeacoffee.com/champ.work"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-gray-400 hover:text-yellow-500 transition-colors"
        >
          ☕ このツールが役に立ったら
        </a>
      </div>
    </div>
  );
}
