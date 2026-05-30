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

// ── 英語翻訳マップ ───────────────────────────────────────────────
const WEAPON_EN: Record<string, string> = {
  "大剣":"Great Sword","太刀":"Long Sword","片手剣":"Sword & Shield",
  "双剣":"Dual Blades","ハンマー":"Hammer","狩猟笛":"Hunting Horn",
  "ランス":"Lance","ガンス":"Gunlance","スラアク":"Switch Axe",
  "チャアク":"Charge Blade","操虫棍":"Insect Glaive",
  "ライト":"Light Bowgun","ヘビィ":"Heavy Bowgun","弓":"Bow",
};
const ELEM_EN: Record<string, string> = {
  "火":"Fire","水":"Water","雷":"Thunder","氷":"Ice","龍":"Dragon",
  "無":"Non-elem","毒":"Poison","麻痺":"Paralysis","睡眠":"Sleep","爆破":"Blast",
};
const SERIES_SKILL_EN: Record<string, string> = {
  "巨戟龍の黙示録":"Gogmapocalypse","黒蝕竜の力":"Gore Magala's Tyranny",
  "兇爪竜の力":"Ebony Odogaron's Power","白熾龍の脈動":"Zoh Shia's Pulse",
  "泡狐竜の力":"Mizutsune's Prowess","雷顎竜の闘志":"Fulgur Anjanath's Will",
  "暗器蛸の力":"Xu Wu's Vigor","暗黒騎士の証":"Soul of the Dark Knight",
  "オメガレゾナンス":"Omega Resonance","海竜の渦雷":"Leviathan's Fury",
  "火竜の力":"Rathalos's Flare","煌雷竜の力":"Rey Dau's Voltage",
  "獄焔蛸の反逆":"Nu Udra's Mutiny","護鎖刃竜の命脈":"Guardian Arkveld's Vitality",
  "鎖刃竜の飢餓":"Arkveld's Hunger","千刃竜の闘志":"Seregios's Tenacity",
  "凍峰竜の反逆":"Jin Dahaad's Revolt","波衣竜の守護":"Uth Duna's Cover",
  "闢獣の力":"Doshaguma's Might","雪獅子の闘志":"Blangonga's Spirit",
  "鎧竜の守護":"Gravios's Protection",
};
const GROUP_SKILL_EN: Record<string, string> = {
  "ヌシの魂":"Lord's Soul","ヌシの憤激":"Lord's Fury","ヌシの誇り":"Lord's Pride",
  "鱗重ねの工夫":"Scale Layering","鱗張りの技法":"Scale Craft",
  "革細工の滑性":"Buttery Leathercraft","革細工の柔性":"Flexible Leathercraft",
  "毛皮の昂揚":"Fortifying Pelt","毛皮の誘惑":"Alluring Pelt",
  "甲虫の擬態":"Neopteron Camouflage","甲虫の知らせ":"Neopteron Alert",
  "護竜の守り":"Guardian's Protection","護竜の脈動":"Guardian's Pulse",
  "先達の導き":"Imparted Wisdom",
};

function sLabel(jp: string, lang: string): string {
  if (lang !== "en") return jp;
  return SERIES_SKILL_EN[jp] || GROUP_SKILL_EN[jp] || jp;
}
function wLabel(jp: string, lang: string): string {
  return lang === "en" ? (WEAPON_EN[jp] || jp) : jp;
}
function eLabel(jp: string, lang: string): string {
  return lang === "en" ? (ELEM_EN[jp] || jp) : jp;
}

// ── EN→JP 逆引きマップ（英語OCR用） ──────────────────────────────
const ARTIA_WEAPON_EN_REVERSE: Record<string, string> = {
  "Ostrak Oblivion":"忘却のオストランツァ","Headsman's Hamus":"斬罪のエルガンシオ",
  "Kyrie Verd":"破滅のキリエヴェルド","Eternal Cusp":"永訣のクラウクライス",
  "Bound Admonition":"禁戒のデスヴァンケル","Onyx Choros":"闇黒のテルプリティカ",
  "Aether Pike":"天涯のゲガルンロウ","Auguring Omen":"前兆のプロフェネシス",
  "Wicked Regnum":"邪執のコンキエレガン","Promised Abyss":"代償のネイディ・ギア",
  "Limbo Llor":"堕在のラクリエリカ","Bethorned Agony":"荊冠のデストレーター",
  "Trembling Hels":"戦慄のヘルシャフェン","Calamitous Angel":"亡国のクピドバイン",
  "Artian":"巨戟アーティア",
};

const ELEM_EN_KEYWORDS: [string[], string][] = [
  [["Fire"], "火"], [["Water"], "水"], [["Thunder","Lightning"], "雷"],
  [["Ice"], "氷"], [["Dragon"], "龍"], [["Non-elem","Non-element","None","Null"], "無"],
  [["Poison"], "毒"], [["Paralysis"], "麻痺"], [["Sleep"], "睡眠"], [["Blast"], "爆破"],
];

const ALL_SKILLS_EN: [string, string][] = [
  ...Object.entries(SERIES_SKILL_EN).map(([jp, en]) => [en, jp] as [string, string]),
  ...Object.entries(GROUP_SKILL_EN).map(([jp, en]) => [en, jp] as [string, string]),
];

function findBestSkillMatchEN(text: string): string {
  const t = text.toLowerCase();
  for (const [en, jp] of ALL_SKILLS_EN) {
    if (t.includes(en.toLowerCase())) return jp;
  }
  let best = ""; let bestScore = 0;
  for (const [en, jp] of ALL_SKILLS_EN) {
    const words = en.toLowerCase().split(" ").filter(w => w.length > 3);
    if (words.length === 0) continue;
    const matched = words.filter(w => t.includes(w)).length;
    const score = matched / words.length;
    if (score >= 0.6 && score > bestScore) { bestScore = score; best = jp; }
  }
  return best;
}

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
      const ctx = canvas.getContext("2d")!;
      ctx.filter = "grayscale(1) contrast(1.5)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

const OCR_CORRECTIONS: [RegExp, string][] = [
  [/竜/g, "龍"],       // 龍/竜 混同
  [/謁/g, "黙"],       // 黙示録の誤認識
  [/示録/g, "示録"],   // そのまま
  [/已/g, "己"],
  [/巨載/g, "巨戟"],
  [/巨蔵/g, "巨戟"],
  [/戟$/g, "戟"],
  [/鉄/g, "鎧"],
  [/ヌシの魂/g, "ヌシの魂"],
  [/ヌシの奮激/g, "ヌシの憤激"],
  [/鱗重ね/g, "鱗重ね"],
  [/革細工の滑牲/g, "革細工の滑性"],
  [/甲虫の知ら世/g, "甲虫の知らせ"],
];

function normalize(s: string): string {
  let r = s.replace(/\s/g, "").replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  ).replace(/[^　-鿿＀-￯]/g, "");
  for (const [pattern, replacement] of OCR_CORRECTIONS) {
    r = r.replace(pattern, replacement);
  }
  return r;
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
  onProgress: (msg: string) => void,
  lang: string
): Promise<{ weaponName: string; weapon: string; element: string; skill1: string; skill2: string; _rawText?: string }> {
  const isEN = lang === "en";
  onProgress(isEN ? "🔄 Optimizing image..." : "🔄 画像を最適化中...");
  dataUrl = await normalizeImage(dataUrl);
  const { createWorker } = await import("tesseract.js");
  onProgress(isEN ? "🔄 Starting OCR engine..." : "🔄 OCRエンジンを起動中...");
  const ocrLang = isEN ? "eng" : "jpn";
  const worker = await createWorker(ocrLang, 1, {
    logger: (m: { status: string; progress: number }) => {
      const pct = Math.round((m.progress || 0) * 100);
      if (m.status === "loading language traineddata") {
        onProgress(isEN
          ? `⬇️ Loading language data... ${pct}%\n(This may take a moment on first use)`
          : `⬇️ 言語データを読み込み中... ${pct}%\n（初回のみ時間がかかります。このままお待ちください）`);
      } else if (m.status === "recognizing text") {
        onProgress(isEN ? `🔍 Recognizing text... ${pct}%` : `🔍 文字認識中... ${pct}%`);
      }
    },
  });
  const { PSM } = await import("tesseract.js");
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "0",
  });
  try {
    const { data: { text } } = await worker.recognize(dataUrl);
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    let weaponName = "";
    let element = "";
    const skills: string[] = [];

    if (isEN) {
      // ── 英語OCRパス ──
      const fullText = lines.join(" ");
      // 武器名（EN→JP逆引き）
      for (const [en, jp] of Object.entries(ARTIA_WEAPON_EN_REVERSE)) {
        if (fullText.toLowerCase().includes(en.toLowerCase())) { weaponName = jp; break; }
      }
      // 属性
      for (const [keywords, jpEl] of ELEM_EN_KEYWORDS) {
        if (keywords.some(k => fullText.toLowerCase().includes(k.toLowerCase()))) {
          element = jpEl; break;
        }
      }
      // スキル
      for (const line of lines) {
        const match = findBestSkillMatchEN(line);
        if (match && !skills.includes(match)) skills.push(match);
        if (skills.length >= 2) break;
      }
    } else {
      // ── 日本語OCRパス ──
      const linesNoSpace = lines.map(l => l.replace(/\s/g, ""));
      const fullText = linesNoSpace.join("");
      // 武器名
      for (const key of Object.keys(ARTIA_WEAPON_MAP)) {
        if (fullText.includes(normalize(key))) { weaponName = key; break; }
      }
      if (!weaponName) {
        let best = ""; let bestScore = 0;
        for (const key of Object.keys(ARTIA_WEAPON_MAP)) {
          const score = fuzzyScore(fullText, normalize(key));
          if (score >= 0.55 && score > bestScore) { bestScore = score; best = key; }
        }
        weaponName = best;
      }
      // 属性
      for (const norm of linesNoSpace) {
        for (const el of ["火","水","雷","氷","龍","無"]) {
          if (norm.includes(el + "属性") || norm.includes(el + "タイプ")) { element = el; break; }
        }
        if (element) break;
      }
      // スキル
      for (const norm of linesNoSpace) {
        const match = findBestSkillMatch(norm);
        if (match && !skills.includes(match)) skills.push(match);
        if (skills.length >= 2) break;
      }
    }

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
function CaptureTab({ db, setDb, lang }: { db: Entry[]; setDb: (d: Entry[]) => void; lang: string }) {
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
  const [guideOpen, setGuideOpen] = useState(true);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const dbRef = useRef(db);
  const nValRef = useRef(nVal);

  useEffect(() => { dbRef.current = db; }, [db]);
  useEffect(() => { nValRef.current = nVal; }, [nVal]);

  const processImageSrc = async (src: string) => {
    setImgSrc(src);
    setLog(lang === "en" ? "🔄 Receiving image..." : "🔄 画像受信...");
    try {
      const result = await analyzeScreenshot(src, setLog, lang);
      const resolvedWeapon = (() => {
        const guessed = guessWeaponFromName(result.weaponName);
        if (guessed) return guessed;
        if (result.weapon && WEAPONS.includes(result.weapon)) return result.weapon;
        return "";
      })();
      const resolvedElement = (result.element && result.element !== "不明" && ELEMENTS.includes(result.element))
        ? result.element : "";

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
        setGuideOpen(false);
        setLastSavedId(entry.id);
        setTimeout(() => setLastSavedId(null), 3000);
        setLog(lang === "en"
          ? `✓ Auto-saved: Roll #${entry.n} ${wLabel(entry.weapon,lang)}(${eLabel(entry.element,lang)})\nSkills: ${entry.skill1 ? sLabel(entry.skill1,lang) : "Series skill undetected"} / ${entry.skill2 ? sLabel(entry.skill2,lang) : "Group skill undetected"}`
          : `✓ 自動保存: ${entry.n}回目 ${entry.weapon}(${entry.element})\nスキル: ${entry.skill1 || "シリーズスキル読取不可"} / ${entry.skill2 || "グループスキル読取不可"}`);
        setImgSrc(null);
      } else {
        if (result.skill1) setSkill1(result.skill1);
        if (result.skill2) setSkill2(result.skill2);
        if (resolvedWeapon) setWeapon(resolvedWeapon);
        if (resolvedElement) setElement(resolvedElement);
        const missing = lang === "en"
          ? [...(!resolvedWeapon ? ["weapon type"] : []), ...(!resolvedElement ? ["element"] : [])]
          : [...(!resolvedWeapon ? ["武器種"] : []), ...(!resolvedElement ? ["属性"] : [])];
        setLog(lang === "en"
          ? `⚠️ Could not detect: ${missing.join(", ")}. Please fill in manually and press "Save Record".\n[OCR raw]: ${result._rawText?.slice(0, 200) || "(empty)"}`
          : `⚠️ ${missing.join("・")}が読み取れませんでした。フォームで確認して「記録を保存」を押してください。\n[OCR生テキスト]: ${result._rawText?.slice(0, 200) || "(空)"}`);
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
    if (!weapon || !element) { setSaveMsg(lang==="en" ? "Weapon type and element are required" : "武器種と属性は必須です"); return; }
    if (editingId !== null) {
      const next = db.map(e => e.id === editingId ? { ...e, weapon, element, skill1, skill2 } : e);
      setDb(next); saveDB(next);
      setEditingId(null);
      setSkill1(""); setSkill2("");
      setImgSrc(null); setLog(null);
      setSaveMsg(lang==="en" ? "✓ Updated" : "✓ 更新しました");
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
      setGuideOpen(false);
      setLastSavedId(entry.id);
      setTimeout(() => setLastSavedId(null), 3000);
      setSaveMsg(lang==="en" ? `✓ Saved (${next.length} records total)` : `✓ 保存しました（保存済み${next.length}件）`);
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-3">
      {/* 使い方ガイド */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-xs text-gray-600 font-medium cursor-pointer"
        >
          <span>{lang==="en" ? "📖 How to Use" : "📖 使い方ガイド"}</span>
          <span className="text-gray-400">{guideOpen ? (lang==="en" ? "▲ Close" : "▲ 閉じる") : (lang==="en" ? "▼ Open" : "▼ 開く")}</span>
        </button>
        {guideOpen && (
          <div className="px-3 py-2 space-y-2">
            {lang === "en" ? (
              <ul className="text-xs text-gray-500 space-y-1.5 list-none">
                <li>📷 Upload a screenshot to auto-detect weapon type, element &amp; skills (still images only)</li>
                <li>✏️ If detection fails, select weapon type &amp; element manually then press &quot;Save Record&quot;</li>
                <li>🔢 &quot;Roll #&quot; tracks reroll count. Auto-increments on each save. Press Reset when returning to title screen</li>
                <li>☑️ Tap a cell to mark it with a blue ring (bookmark skills you want to collect)</li>
                <li>🔍 Use the Skill Search tab to find which roll number has a specific skill</li>
                <li className="text-gray-400">※ Uses a free OCR engine — accuracy may vary. Manual input is recommended if OCR fails.</li>
              </ul>
            ) : (
              <ul className="text-xs text-gray-500 space-y-1.5 list-none">
                <li>📷 スクショをアップロードすると武器種・属性・スキルを自動読み取りして保存します（静止画のみ対応）</li>
                <li>✏️ 読み取れない場合は武器種・属性を手動で選択して「記録を保存」を押してください</li>
                <li>🔢 n回目はリロール回数です。保存するたびに自動カウントアップ。タイトルに戻るときはリセットボタンで1回目に戻してください</li>
                <li>☑️ テーブルのセルをタップすると青枠でマーク（回収候補スキルの目印に）</li>
                <li>🔍 スキル検索タブで特定スキルが何回目にあるか検索できます</li>
                <li className="text-gray-400">※無料の読み取りエンジンを使用しているため精度が低い場合があります。うまく読み取れないときは手入力でご利用ください。</li>
              </ul>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
              <p className="text-xs text-amber-700 font-medium">{lang==="en" ? "📌 Tips for better OCR accuracy" : "📌 OCR精度を上げるスクショの撮り方"}</p>
              <p className="text-xs text-amber-600">{lang==="en" ? "Recommended crop area (weapon name to skill list):" : "切り取り範囲の目安（武器名〜スキル一覧）："}</p>
              {lang === "en" ? (
                <ul className="text-xs text-amber-700 bg-amber-100 rounded px-3 py-1.5 space-y-0.5 list-none">
                  <li>▶ Weapon name (e.g.: Eternal Cusp) ← start here</li>
                  <li>　 Fire Element Type</li>
                  <li>　 Active Skills</li>
                  <li>　 Gogmapocalypse</li>
                  <li>　 Lord&apos;s Soul　　　　← end here</li>
                </ul>
              ) : (
                <ul className="text-xs text-amber-700 bg-amber-100 rounded px-3 py-1.5 space-y-0.5 list-none">
                  <li>▶ 武器名（例：永訣の〜）　← ここから</li>
                  <li>　 火属性タイプ</li>
                  <li>　 発動スキル</li>
                  <li>　 巨戟龍の黙示録</li>
                  <li>　 ヌシの魂　　　　← ここまで</li>
                </ul>
              )}
              <p className="text-xs text-amber-600">{lang==="en" ? "Capturing the full screen degrades accuracy. Use manual input for undetected fields." : "画面全体・ゲームUI全域は精度が大きく下がります。読み取れない項目は手入力してください。"}</p>
            </div>
          </div>
        )}
      </div>
      <div
        onPaste={handlePaste}
        className="border border-dashed border-gray-300 rounded-xl p-6 text-center"
      >
        <div className="text-3xl mb-2">📷</div>
        <label style={{ position: "relative", display: "inline-block", cursor: "pointer" }}>
          <span className="text-sm text-blue-500 underline">{lang==="en" ? "Tap to upload" : "タップしてアップロード"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
          />
        </label>
        <div className="text-xs text-gray-300 mt-1">{lang==="en" ? "PC: Click here then Ctrl+V to paste" : "PCはここをクリック後 Ctrl+V で貼り付け可"}</div>
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
        <div>
          <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Roll #" : "n回目"}</label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setNVal(v => String(Math.max(1, parseInt(v) - 1)))}
              className="w-7 h-8 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-pointer">−</button>
            <input type="number" value={nVal} onChange={e => setNVal(e.target.value)}
              className="w-14 border border-gray-200 rounded-lg p-2 text-sm text-center" />
            <button type="button" onClick={() => setNVal(v => String(parseInt(v) + 1))}
              className="w-7 h-8 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-pointer">＋</button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setNVal("1"); setWeapon(""); setElement(""); setSkill1(""); setSkill2(""); setImgSrc(null); setLog(null); setSaveMsg(null); }}
          className="mt-5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-400 cursor-pointer"
        >{lang==="en" ? "Reset" : "リセット"}</button>
      </div>

      {/* 武器種ボタン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Weapon Type" : "武器種"}</label>
        <div className="flex flex-wrap gap-1">
          {WEAPONS.map(w => (
            <button type="button" key={w} onClick={() => setWeapon(v => v === w ? "" : w)}
              className={`px-2 py-1 text-xs rounded-lg border cursor-pointer ${weapon === w ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 text-gray-600"}`}>
              {wLabel(w, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* 属性ボタン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Element" : "属性"}</label>
        <div className="flex flex-wrap gap-1">
          {ELEMENTS.map(el => (
            <button type="button" key={el} onClick={() => setElement(v => v === el ? "" : el)}
              className={`px-3 py-1 text-xs rounded-lg border cursor-pointer ${element === el ? `${ELEM_COLORS[el]} border-transparent font-bold` : "border-gray-200 text-gray-600"}`}>
              {eLabel(el, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* スキルプルダウン */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Series Skill" : "シリーズスキル"}</label>
        <select value={skill1} onChange={e => setSkill1(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white">
          <option value="">{lang==="en" ? "Select..." : "選択..."}</option>
          {SERIES_SKILLS.map(s => <option key={s} value={s}>{sLabel(s, lang)}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Group Skill" : "グループスキル"}</label>
        <select value={skill2} onChange={e => setSkill2(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white">
          <option value="">{lang==="en" ? "Select..." : "選択..."}</option>
          {GROUP_SKILLS.map(s => <option key={s} value={s}>{sLabel(s, lang)}</option>)}
        </select>
      </div>

      {editingId !== null && (() => {
        const e = db.find(e => e.id === editingId);
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-blue-700">✏️ {e ? (lang==="en" ? `Editing Roll #${e.n} ${wLabel(e.weapon,lang)}(${eLabel(e.element,lang)})` : `${e.n}回目 ${e.weapon}（${e.element}）を編集中`) : (lang==="en" ? "Editing cell" : "セルを編集中")}</span>
            <button type="button" onClick={cancelEdit} className="text-xs text-blue-400 cursor-pointer">{lang==="en" ? "Cancel" : "キャンセル"}</button>
          </div>
        );
      })()}
      {saveMsg && <p className="text-xs text-center text-green-600 font-medium">{saveMsg}</p>}
      <button type="button" onClick={handleSave} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">
        {editingId !== null ? (lang==="en" ? "Update & Save" : "記録を更新して保存") : (lang==="en" ? "Save Record" : "記録を保存")}
      </button>

      {/* ── テーブル ── */}
      {db.length > 0 && (() => {
        const maxN = Math.max(...db.map(e => e.n));
        // 追加された順に列を並べる
        const cols = [...new Set(db.map(e => `${e.weapon}/${e.element}`))];
        const cellMap: Record<string, Entry> = {};
        db.forEach(e => { cellMap[`${e.n}/${e.weapon}/${e.element}`] = e; });

        const delEntry = (id: number) => {
          if (!confirm(lang==="en" ? "Delete this entry?" : "削除しますか？")) return;
          const next = db.filter(e => e.id !== id);
          setDb(next); saveDB(next);
        };

        const handleCheck = (key: string, n: number) => {
          const rowKey = Object.keys(checked).find(k => checked[k] && k.startsWith(`${n}/`) && k !== key);
          if (rowKey) {
            if (!confirm(lang==="en" ? "This row already has a bookmark. Replace it?" : "同じ行に既にチェックがあります。入れ替えますか？")) return;
            setChecked(prev => ({ ...prev, [rowKey]: false, [key]: true }));
            return;
          }
          setChecked(prev => ({ ...prev, [key]: !prev[key] }));
        };

        const clearAll = () => {
          if (!confirm(lang==="en" ? "Delete all records?" : "全記録を削除しますか？")) return;
          setDb([]); saveDB([]); setChecked({}); setNVal("1");
        };

        return (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{lang==="en" ? "Row=Roll# / Col=Weapon+Element" : "行=n回目 / 列=武器種+属性"}<br />{lang==="en" ? "Tap a cell to bookmark a skill (1 per row)" : "セルをタップで回収したいスキルをマーク（1行1つ）"}</p>
              <button type="button" onClick={clearAll} className="text-xs text-red-300 border border-red-200 rounded px-2 py-0.5 cursor-pointer">{lang==="en" ? "Clear All" : "全クリア"}</button>
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
                            <Badge label={wLabel(w,lang)} colorClass={WEAPON_COLORS[w]} />
                            {el && <Badge label={eLabel(el,lang)} colorClass={ELEM_COLORS[el]} />}
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
                            className={`border px-2 py-1 text-center ${entry ? `cursor-pointer ${SCORE_STYLES[getCellScore(entry.skill1, entry.skill2)]?.bg || "border-gray-200"}` : "border-gray-200"} ${entry && entry.id === lastSavedId ? "ring-2 ring-inset ring-green-400" : isChecked ? "ring-2 ring-inset ring-blue-400" : ""}`}
                          >
                            {entry ? (
                              <div className="flex flex-col gap-0.5">
                                {/* 上段：アイコン行 */}
                                <div className="flex items-center justify-between">
                                  <button type="button" onClick={e => { e.stopPropagation(); startEdit(entry); }}
                                    className="text-gray-300 text-xs cursor-pointer leading-none" title="編集">✏️</button>
                                  {(() => { const s = SCORE_STYLES[getCellScore(entry.skill1, entry.skill2)]; return s ? <span className={`${s.starColor} text-xs leading-none`}>{s.stars}</span> : <span />; })()}
                                  <button type="button" onClick={e => { e.stopPropagation(); delEntry(entry.id); }}
                                    className="text-gray-300 text-xs cursor-pointer leading-none" title="削除">🗑</button>
                                </div>
                                {/* 下段：スキル名 */}
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs text-gray-800">{entry.skill1 ? sLabel(entry.skill1,lang) : "？"}</span>
                                  <span className="text-xs text-gray-400">×</span>
                                  <span className="text-xs text-gray-600">{entry.skill2 ? sLabel(entry.skill2,lang) : "？"}</span>
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
            <div className="pt-1 space-y-0.5">
              {lang === "en" ? (<>
                <p className="text-xs text-gray-400"><span className="text-yellow-500">★</span>Popular Series Skills: Gogmapocalypse / Gore Magala&apos;s Tyranny / Ebony Odogaron&apos;s Power / Zoh Shia&apos;s Pulse / Fulgur Anjanath&apos;s Will / Leviathan&apos;s Fury</p>
                <p className="text-xs text-gray-400"><span className="text-yellow-500">★</span>Popular Group Skills: Lord&apos;s Soul</p>
              </>) : (<>
                <p className="text-xs text-gray-400"><span className="text-yellow-500">★</span>人気シリーズスキル：巨戟龍の黙示録 / 黒蝕竜の力 / 兇爪竜の力 / 白熾龍の脈動 / 雷顎竜の闘志 / 海竜の渦雷</p>
                <p className="text-xs text-gray-400"><span className="text-yellow-500">★</span>人気グループスキル：ヌシの魂</p>
              </>)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const POPULAR_SERIES_SKILLS = new Set(["巨戟龍の黙示録","黒蝕竜の力","兇爪竜の力","白熾龍の脈動","雷顎竜の闘志","海竜の渦雷"]);
const POPULAR_GROUP_SKILLS  = new Set(["ヌシの魂"]);

function getCellScore(skill1: string, skill2: string): number {
  const s = (POPULAR_SERIES_SKILLS.has(skill1) || POPULAR_SERIES_SKILLS.has(skill2)) ? 1 : 0;
  const g = (POPULAR_GROUP_SKILLS.has(skill1)  || POPULAR_GROUP_SKILLS.has(skill2))  ? 1 : 0;
  return s + g;
}

const SCORE_STYLES: Record<number, { bg: string; stars: string; starColor: string }> = {
  2: { bg: "bg-yellow-50 border-yellow-400", stars: "★★", starColor: "text-yellow-500" },
  1: { bg: "bg-amber-50 border-amber-300",   stars: "★",  starColor: "text-amber-600"  },
};

// ── スキル検索タブ ──────────────────────────────────────────────
function SearchTab({ db, lang }: { db: Entry[]; lang: string }) {
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
      <p className="text-xs text-gray-400">{lang==="en" ? "Search recorded data by skill" : "スキルを選んで記録済みデータの場所を検索します"}</p>
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Series Skill" : "シリーズスキル"}</label>
        <select value={seriesSkill} onChange={e => setSeriesSkill(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white text-gray-900">
          <option value="">{lang==="en" ? "Any" : "指定なし"}</option>
          {SERIES_SKILLS.map(s => <option key={s} value={s}>{sLabel(s,lang)}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">{lang==="en" ? "Group Skill" : "グループスキル"}</label>
        <select value={groupSkill} onChange={e => setGroupSkill(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white text-gray-900">
          <option value="">{lang==="en" ? "Any" : "指定なし"}</option>
          {GROUP_SKILLS.map(s => <option key={s} value={s}>{sLabel(s,lang)}</option>)}
        </select>
      </div>
      <button type="button" onClick={search} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer">
        {lang==="en" ? "Search" : "検索"}
      </button>
      {results !== null && (
        results.length === 0
          ? <div className="text-center py-6 text-gray-300 text-sm">{lang==="en" ? "No results found" : "該当するデータがありません"}</div>
          : (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-gray-400">{lang==="en" ? `${results.length} result(s) found` : `${results.length}件ヒット（n回目の小さい順）`}</p>
              {results.map(e => (
                <div key={e.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-gray-800">{e.n}<span className="text-xs font-normal text-gray-400 ml-0.5">{lang==="en" ? "th roll" : "回目"}</span></span>
                    <Badge label={wLabel(e.weapon,lang)} colorClass={WEAPON_COLORS[e.weapon]} />
                    <Badge label={eLabel(e.element,lang)} colorClass={ELEM_COLORS[e.element]} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{e.skill1 ? sLabel(e.skill1,lang) : "？"}{e.skill2 ? ` / ${sLabel(e.skill2,lang)}` : ""}</div>
                </div>
              ))}
            </div>
          )
      )}
      {db.length === 0 && <div className="text-center py-6 text-gray-300 text-sm">{lang==="en" ? "Add data in the Record tab" : "記録タブでデータを追加してください"}</div>}
    </div>
  );
}

// ── 統計タブ ────────────────────────────────────────────────────
function StatsTab({ db, lang }: { db: Entry[]; lang: string }) {
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
        {(lang === "en"
        ? [["Total Records", db.length], ["Weapon Types", weapons], ["Max Roll #", maxN], ["Skill Types", Object.keys(skills).length]]
        : [["総記録数", db.length], ["武器種数", weapons], ["最大テーブル位置", maxN], ["スキル種類", Object.keys(skills).length]]
      ).map(([label, val]) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-semibold text-gray-900">{val}</div>
          </div>
        ))}
      </div>
      {top.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">{lang==="en" ? `Top ${top.length} Skills` : `出現頻度 top ${top.length}`}</div>
          <div className="space-y-2">
            {top.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{sLabel(name,lang)}</span><span>{count}{lang==="en" ? "x" : "回"}</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-800 rounded-full" style={{ width: `${Math.round(count / top[0][1] * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {db.length === 0 && <div className="text-center py-12 text-gray-300 text-sm">{lang==="en" ? "No data yet" : "データがありません"}</div>}
    </div>
  );
}

// ── メインアプリ ────────────────────────────────────────────────
export default function MHWTracker() {
  const [tab, setTab] = useState("capture");
  const [db, setDb] = useState<Entry[]>([]);
  const [lang, setLang] = useState("ja");

  useEffect(() => {
    setDb(loadDB());
  }, []);

  const TABS = [
    { id: "capture", icon: "📷", label: lang==="en" ? "Record" : "記録" },
    { id: "search",  icon: "🔍", label: lang==="en" ? "Skill Search" : "スキル検索" },
    { id: "stats",   icon: "📊", label: lang==="en" ? "Stats" : "統計" },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-bold text-gray-700">
          {lang==="en" ? "Artian Weapon Skill Roll Tracker" : "巨戟アーティアスキル厳選補助ツール"}
        </h1>
        <button
          type="button"
          onClick={() => setLang(v => v==="ja" ? "en" : "ja")}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 cursor-pointer hover:bg-gray-50"
        >
          {lang==="en" ? "🇯🇵 JP" : "🇺🇸 EN"}
        </button>
      </div>
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
      <div style={{ display: tab === "capture" ? "block" : "none" }}><CaptureTab db={db} setDb={setDb} lang={lang} /></div>
      <div style={{ display: tab === "search"  ? "block" : "none" }}><SearchTab  db={db} lang={lang} /></div>
      <div style={{ display: tab === "stats"   ? "block" : "none" }}><StatsTab   db={db} lang={lang} /></div>
      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <a
          href="https://buymeacoffee.com/champ.work"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-gray-400 hover:text-yellow-500 transition-colors"
        >
          {lang==="en" ? "☕ If this tool helped you" : "☕ このツールが役に立ったら"}
        </a>
      </div>
    </div>
  );
}
