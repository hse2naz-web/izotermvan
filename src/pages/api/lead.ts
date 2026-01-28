import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const token = import.meta.env.TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();

    // Основные поля
    const phone = String(data.phone ?? "").trim();
    const base = String(data.base ?? "").trim();
    const temp = String(data.temp ?? "").trim();
    const comment = String(data.comment ?? "").trim();

    // Метки (страница/utm/реферер)
    const pagePath = String(data.pagePath ?? "").trim();
    const pageUrl = String(data.pageUrl ?? "").trim();
    const referrer = String(data.referrer ?? "").trim();
    const utmRaw = data.utm && typeof data.utm === "object" ? data.utm : {};

    if (!phone) {
      return new Response(JSON.stringify({ ok: false, error: "Phone required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Время (Рига)
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Riga",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    // UTM только utm_*
    const utmStr = Object.entries(utmRaw)
      .filter(([k, v]) => typeof v === "string" && v.trim() !== "" && k.toLowerCase().startsWith("utm_"))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const text =
      `Новая заявка с сайта Izotermvan\n` +
      `Время: ${time}\n` +
      (pagePath ? `Страница: ${pagePath}\n` : "") +
      (pageUrl ? `URL: ${pageUrl}\n` : "") +
      (referrer ? `Реферер: ${referrer}\n` : "") +
      (utmStr ? `UTM:\n${utmStr}\n` : "") +
      `\n` +
      `Телефон: ${phone}\n` +
      `База: ${base || "-"}\n` +
      `Температурный режим: ${temp || "-"}` +
      (comment ? `\nКомментарий: ${comment}` : "");

    const tgResp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const tgJson = await tgResp.json().catch(() => ({}));

    if (!tgResp.ok || (tgJson as any)?.ok === false) {
      return new Response(
        JSON.stringify({ ok: false, error: "Telegram API error", details: tgJson }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err?.message ?? err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
