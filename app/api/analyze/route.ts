import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("ANTHROPIC_API_KEY exists:", !!apiKey, "length:", apiKey?.length);
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "APIキーが設定されていません" }, { status: 500 });
  }

  const { base64 } = await req.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
          {
            type: "text",
            text: `モンスターハンターワイルズの武器錬成画面です。画面左上に武器種アイコンと武器名が表示されています。中央に「○属性タイプ」、下部「発動スキル」欄にスキルが2つ縦並び。JSONのみ返してください（説明不要）：{"weaponName":"画面左上の武器名テキスト","weapon":"武器種(大剣/太刀/片手剣/双剣/ハンマー/狩猟笛/ランス/ガンランス/スラッシュアックス/チャージアックス/操虫棍/弓/ライトボウガン/ヘビィボウガン/不明)","element":"属性(火/水/雷/氷/龍/無/不明)","skill1":"スキル1名","skill2":"スキル2名","found":true}`
          }
        ]
      }]
    }),
  });

  const data = await res.json();
  if (data.error) {
    return NextResponse.json({ error: data.error.message || "API Error" }, { status: 500 });
  }

  const text = (data.content || []).map((c: { text?: string }) => c.text || "").join("");
  const m = text.match(/\{[\s\S]*?\}/);
  if (!m) {
    return NextResponse.json({ error: "解析失敗: " + text.slice(0, 60) }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(m[0]));
}
