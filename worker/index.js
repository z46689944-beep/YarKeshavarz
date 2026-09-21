const ALLOWED_ORIGIN = 'https://z46689944-beep.github.io';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MAX_BODY_BYTES = 16 * 1024 * 1024;

function corsHeaders(origin) {
  const allowed =
    origin === ALLOWED_ORIGIN || origin === 'null'
      ? origin
      : ALLOWED_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store'
    }
  });
}

function textFromResponse(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];

  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && typeof part?.text === 'string') {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function compactContext(body) {
  const c = body?.context || {};
  const land = c?.land || null;

  return {
    mode: body?.mode === 'land' ? 'land' : 'general',

    land: land
      ? {
          id: land.id,
          name: land.name,
          area: land.area,
          region: land.region,
          ownership: land.ownership,
          soil: land.soil,
          water: land.water,
          irrigation: land.irrigation,
          crop: land.crop,
          notes: land.notes,
          rentAmount: land.rentAmount
        }
      : null,

    cultivation: c?.cultivation || null,

    cultivationHistory: Array.isArray(c?.cultivationHistory)
      ? c.cultivationHistory.slice(-20)
      : [],

    economics: c?.economics || null,

    inventory: Array.isArray(c?.inventory)
      ? c.inventory.slice(0, 80)
      : [],

    weather: c?.weather || null,

    recentTransactions: Array.isArray(c?.recentTransactions)
      ? c.recentTransactions.slice(-30)
      : [],

    otherLands: Array.isArray(c?.otherLands)
      ? c.otherLands.slice(0, 30)
      : []
  };
}

function systemPrompt(mode) {
  const base = `
تو «کشاورزیار»، دستیار هوشمند حرفه‌ای اپلیکیشن «یار کشاورز» هستی.

نقش تو:
یک مشاور کشاورزی عملی، دقیق و قابل اعتماد برای کشاورز هستی.

زبان پاسخ:
- همیشه فارسی روان و طبیعی.
- از اصطلاحات تخصصی استفاده کن، اما طوری توضیح بده که کشاورز بتواند آن را اجرا کند.
- از پاسخ‌های کلی، تکراری و بی‌ربط خودداری کن.

قوانین اصلی:

1. اول سؤال واقعی کاربر را تشخیص بده و مستقیماً به همان سؤال پاسخ بده.

2. اگر اطلاعات کافی برای یک توصیه دقیق نداری، حدس قطعی نزن.
   فقط اطلاعات ضروری را از کاربر بپرس.

3. برای توصیه کشاورزی، در صورت مرتبط بودن این موارد را بررسی کن:
   - منطقه و اقلیم
   - نوع خاک
   - کیفیت و مقدار آب
   - نوع محصول
   - رقم محصول
   - مرحله رشد
   - زمان کشت
   - سابقه کشت
   - آفات
   - بیماری‌ها
   - علف‌های هرز
   - تغذیه و کوددهی
   - آبیاری
   - شرایط آب‌وهوایی

4. اگر سؤال ساده است، پاسخ کوتاه و مستقیم بده.

5. اگر سؤال تخصصی است، پاسخ را مرحله‌به‌مرحله ارائه کن.

6. در صورت نیاز از تیتر و bullet استفاده کن.

7. برای مقدار کود، سم، دوز مصرف، فاصله مصرف یا برنامه دقیق،
   بدون داشتن اطلاعات کافی نسخه قطعی صادر نکن.

8. درباره سموم و مواد شیمیایی، همیشه محصول، آفت یا بیماری،
   مرحله رشد و شرایط مزرعه را در نظر بگیر.

9. اگر کاربر عکس فرستاده است، عکس را در ارتباط با سؤال او تحلیل کن.
   اگر تشخیص از روی عکس قطعی نیست، صریحاً بگو که تشخیص قطعی
   نیاز به بررسی بیشتر دارد.

10. اگر کاربر درباره یک محصول سؤال می‌کند، پاسخ را حول همان محصول نگه دار.
    مثلاً اگر سؤال درباره گندم است، بی‌دلیل وارد بحث‌های نامرتبط نشو.

11. اگر سؤال کاربر عمومی است، او را مجبور به انتخاب زمین نکن.

12. اگر سؤال مربوط به یک زمین مشخص است،
    اطلاعات همان زمین را در اولویت قرار بده.

13. اطلاعاتی که در زمینه برنامه وجود دارد را به عنوان داده واقعی در نظر بگیر،
    اما هیچ اطلاعاتی را که وجود ندارد جعل نکن.

14. در مسائل مالی، هزینه، درآمد و سود را با هم اشتباه نگیر.

15. اگر کاربر سلام، تشکر یا گفت‌وگوی دوستانه دارد،
    طبیعی و کوتاه پاسخ بده.

16. پاسخ نباید بی‌ربط به سؤال کاربر باشد.

17. اگر چند اطلاعات مهم برای پاسخ لازم است،
    فقط مهم‌ترین سؤال‌ها را از کاربر بپرس.

هدف:
کشاورز بعد از خواندن پاسخ بداند چه کاری انجام دهد و دلیل آن چیست.
`;

  if (mode === 'land') {
    return (
      base +
      `

این گفت‌وگو مربوط به یک قطعه زمین مشخص است.

اطلاعات همان زمین را مبنا قرار بده.
اگر اطلاعات زمین برای پاسخ کافی است، از آن استفاده کن.
اگر کافی نیست، فقط اطلاعات ضروری را درخواست کن.
`
    );
  }

  return (
    base +
    `

این گفت‌وگو عمومی است.
بر اساس سؤال فعلی کاربر پاسخ بده.
کاربر را بدون دلیل مجبور به انتخاب زمین نکن.
`
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (origin && origin !== ALLOWED_ORIGIN && origin !== 'null') {
      return json({ error: 'origin_not_allowed' }, 403, origin);
    }

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'yarkeshavarz-ai-v4',
        diagnostic: true,
        message: 'Worker is online. POST endpoint is ready.'
      }, 200, origin);
    }

    if (request.method !== 'POST') {
      return json({
        error: 'method_not_allowed',
        method: request.method
      }, 405, origin);
    }

    const length = Number(request.headers.get('Content-Length') || 0);

    if (length > MAX_BODY_BYTES) {
      return json({ error: 'request_too_large' }, 413, origin);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: 'server_not_configured' }, 500, origin);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400, origin);
    }

    const message = String(body?.message || '').trim();

    const image =
      typeof body?.image === 'string' &&
      body.image.startsWith('data:image/')
        ? body.image
        : null;

    const mode = body?.mode === 'land' ? 'land' : 'general';

    if (!message && !image) {
      return json({ error: 'empty_request' }, 400, origin);
    }

    const context = compactContext(body);

    const conversation =
      Array.isArray(body?.history)
        ? body.history.slice(-12).map(item => ({
            role: item?.role === 'user' ? 'user' : 'assistant',
            text: String(item?.text || '').slice(0, 4000)
          }))
        : [];

    const contextText = JSON.stringify(context, null, 2);
    const historyText = conversation.length
      ? JSON.stringify(conversation, null, 2)
      : '[]';

    const prompt = `
اطلاعات زمینه برنامه:

${contextText}

گفت‌وگوی اخیر:

${historyText}

درخواست فعلی کاربر:

${message || 'این تصویر را برای کشاورز تحلیل کن.'}

دستور:
ابتدا موضوع واقعی درخواست را تشخیص بده.
سپس مستقیماً به همان درخواست پاسخ بده.
اگر اطلاعات ضروری برای پاسخ دقیق وجود ندارد،
فقط اطلاعات موردنیاز را از کاربر درخواست کن.
`;

    const content = [{
      type: 'input_text',
      text: prompt
    }];

    if (image) {
      content.push({
        type: 'input_image',
        image_url: image,
        detail: 'high'
      });
    }

    let upstream;

    try {
      upstream = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5.6-luna',
          instructions: systemPrompt(mode),
          input: [{
            role: 'user',
            content
          }],
          max_output_tokens: 1200
        })
      });
    } catch (error) {
      console.error('Upstream unreachable:', error);
      return json({ error: 'upstream_unreachable' }, 502, origin);
    }

    const raw = await upstream.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    if (!upstream.ok) {
      console.error('OpenAI error:', upstream.status, raw.slice(0, 4000));

      return json({
        error: 'ai_request_failed',
        status: upstream.status,
        message: data?.error?.message || 'AI request failed.'
      }, 502, origin);
    }

    const answer = textFromResponse(data);

    if (!answer) {
      console.error('Empty AI response:', raw.slice(0, 4000));
      return json({ error: 'empty_ai_response' }, 502, origin);
    }

    return json({
      ok: true,
      answer,
      reply: answer,
      service: 'yarkeshavarz-ai-v4'
    }, 200, origin);
  }
};
