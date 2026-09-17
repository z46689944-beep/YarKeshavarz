const ALLOWED_ORIGIN = 'https://z46689944-beep.github.io';
const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MAX_BODY_BYTES = 16 * 1024 * 1024;

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === 'null' ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}

function textFromResponse(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && part?.text) chunks.push(part.text);
    }
  }
  return chunks.join('\n').trim();
}

function compactContext(body) {
  const c = body?.context || {};
  const land = c?.land || null;
  return {
    mode: body?.mode === 'land' ? 'land' : 'general',
    land: land ? {
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
      rentAmount: land.rentAmount,
    } : null,
    economics: c?.economics || null,
    inventory: Array.isArray(c?.inventory) ? c.inventory.slice(0, 80) : [],
    weather: c?.weather || null,
    recentTransactions: Array.isArray(c?.recentTransactions) ? c.recentTransactions.slice(-30) : [],
    otherLands: Array.isArray(c?.otherLands) ? c.otherLands.slice(0, 30) : [],
  };
}

function systemPrompt(mode) {
  const base = `تو «کشاورزیار»، دستیار هوشمند حرفه‌ای اپلیکیشن «یار کشاورز» هستی.

نقش تو:
یک مشاور کشاورزی عملی، دقیق و قابل اعتماد برای کشاورز هستی. پاسخ‌ها باید به فارسی روان و طبیعی باشند.

قواعد پاسخ:
1. ابتدا دقیقاً متوجه سؤال کاربر شو و مستقیماً به همان سؤال پاسخ بده.
2. جواب کلی، بی‌ربط یا تکراری نده.
3. اگر اطلاعات کافی برای توصیه دقیق نداری، حدس قطعی نزن؛ ابتدا اطلاعات ضروری را از کاربر بپرس.
4. در توصیه‌های کشاورزی تا حد امکان این موارد را در نظر بگیر:
   - منطقه و اقلیم
   - نوع خاک
   - کیفیت و مقدار آب
   - محصول و رقم
   - مرحله رشد
   - زمان کشت
   - سابقه کشت
   - آفات و بیماری‌ها
   - کوددهی و تغذیه
   - آبیاری
   - علف‌های هرز
5. اگر کاربر فقط یک سؤال ساده پرسید، پاسخ را بیش از حد طولانی نکن.
6. اگر سؤال تخصصی بود، پاسخ را مرحله‌به‌مرحله و کاربردی ارائه کن.
7. در صورت نیاز از تیتر کوتاه و bullet استفاده کن.
8. مقدار، دوز، فاصله زمانی یا برنامه مصرف را فقط وقتی بیان کن که اطلاعات کافی برای آن وجود داشته باشد.
9. درباره سموم و مواد شیمیایی، بدون اطلاعات کافی درباره محصول، آفت، مرحله رشد و شرایط مزرعه، نسخه قطعی صادر نکن.
10. اگر تشخیص آفت، بیماری یا کمبود عنصر از روی عکس قطعی نیست، صریحاً بگو که تشخیص نیاز به بررسی بیشتر دارد.
11. اطلاعات موجود در زمینه برنامه را با دقت استفاده کن، اما چیزی را که در داده‌ها وجود ندارد به عنوان واقعیت فرض نکن.
12. در مسائل مالی، هزینه ثبت‌شده، درآمد ثبت‌شده و سود محاسبه‌شده را از هم جدا نگه دار.
13. اگر سؤال کاربر عمومی است، او را مجبور به انتخاب زمین نکن.
14. اگر سؤال درباره یک زمین مشخص است، اطلاعات همان زمین را در اولویت قرار بده.
15. اگر کاربر سلام، تشکر یا گفت‌وگوی دوستانه دارد، پاسخ طبیعی و کوتاه بده.
16. هرگز برای سؤال کشاورزی پاسخ بی‌ربط درباره عکس، آب‌وهوا یا موضوعات دیگر نده مگر اینکه سؤال کاربر به آن مربوط باشد.

ساختار پیشنهادی پاسخ:
- جواب مستقیم
- نکات مهم
- اگر اطلاعاتی برای دقیق‌تر شدن لازم است، در پایان فقط سؤال‌های ضروری را بپرس.

هدف:
کشاورز بعد از خواندن پاسخ بداند چه کاری انجام دهد و چرا.
`;

  if (mode === 'land') {
    return base + `
این گفت‌وگو مربوط به یک قطعه زمین مشخص است.
اطلاعات همان زمین را مبنا قرار بده و پاسخ را تا حد امکان اختصاصی برای آن زمین ارائه کن.
اگر اطلاعات زمین برای یک توصیه کافی نیست، فقط اطلاعات ضروری را درخواست کن.
`;
  }

  return base + `
این گفت‌وگو عمومی است.
پاسخ را بر اساس سؤال فعلی کاربر بده و فقط در صورت نیاز اطلاعات تکمیلی درخواست کن.
`;
}
  const base = `تو «کشاورزیار»، دستیار هوشمند حرفه‌ای اپلیکیشن «یار کشاورز» هستی.
پاسخ‌ها را به فارسی روان، دقیق، کاربردی و قابل فهم برای کشاورز بده.
از اطلاعات داده‌شده در زمینه کاربر استفاده کن و چیزی را که در داده‌ها وجود ندارد قطعی فرض نکن.
برای تشخیص آفت، بیماری، کمبود عناصر یا مشکلات محصول از روی عکس، اگر تصویر یا اطلاعات کافی نیست صریح بگو که نیاز به بررسی بیشتر دارد.
در توصیه‌های کشاورزی، شرایط آب، خاک، محصول، منطقه و مرحله رشد را در نظر بگیر.
در موضوعات مالی، بین هزینه ثبت‌شده، درآمد ثبت‌شده و سود محاسبه‌شده تفاوت بگذار.
پاسخ را با تیترهای کوتاه و bulletهای مناسب ارائه کن و از زیاده‌گویی غیرضروری پرهیز کن.`;
  if (mode === 'land') {
    return base + `\nاین گفت‌وگو مربوط به یک قطعه زمین مشخص است. پاسخ را تا حد ممکن اختصاصی برای همان زمین بده و اطلاعات زمین را مبنا قرار بده.`;
  }
  return base + `\nاین حالت عمومی است و نباید کاربر را مجبور به انتخاب زمین کنی؛ اگر اطلاعات زمین لازم است، فقط آن را به‌عنوان اطلاعات موردنیاز مطرح کن.`;
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
        service: 'yarkeshavarz-ai-v3',
        diagnostic: true,
        message: 'Worker is online. POST endpoint is ready.',
        allowedOrigin: ALLOWED_ORIGIN
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
        ? body.history.slice(-12).map(x => ({
            role: x?.role === 'user' ? 'user' : 'assistant',
            text: String(x?.text || '').slice(0, 4000),
          }))
        : [];

    const contextText = JSON.stringify(context, null, 2);

    const historyText =
      conversation.length
        ? JSON.stringify(conversation, null, 2)
        : '[]';

    const prompt = `اطلاعات زمینه برنامه:
${contextText}

گفت‌وگوی اخیر:
${historyText}

درخواست کاربر:
${message || 'این تصویر را تحلیل کن و نتیجه را برای کشاورز توضیح بده.'}`;

    const content = [
      {
        type: 'input_text',
        text: prompt
      }
    ];

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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || 'gpt-5.6-luna',
          instructions: systemPrompt(mode),
          input: [
            {
              role: 'user',
              content
            }
          ],
          max_output_tokens: 1200,
        }),
      });
    } catch (error) {
      return json({
        error: 'upstream_unreachable'
      }, 502, origin);
    }

    const raw = await upstream.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {}

    if (!upstream.ok) {
      const oe = data?.error || {};

      console.error(
        'OpenAI error',
        upstream.status,
        raw.slice(0, 4000)
      );

      return json({
        error: 'ai_request_failed',
        status: upstream.status,
        model: env.OPENAI_MODEL || 'gpt-5.6-luna',
        openai: {
          type: oe?.type || null,
          code: oe?.code || null,
          param: oe?.param || null,
          message: String(
            oe?.message ||
            raw ||
            'Unknown OpenAI error'
          ).slice(0, 1000),
        }
      }, 502, origin);
    }

    if (data?.error) {
      const oe = data.error;

      console.error(
        'OpenAI response error',
        JSON.stringify(oe).slice(0, 4000)
      );

      return json({
        error: 'ai_response_failed',
        status: 502,
        model: env.OPENAI_MODEL || 'gpt-5.6-luna',
        openai: {
          type: oe?.type || null,
          code: oe?.code || null,
          param: oe?.param || null,
          message: String(
            oe?.message ||
            'OpenAI returned an error'
          ).slice(0, 1000),
        }
      }, 502, origin);
    }

    const reply =
      textFromResponse(data) ||
      'پاسخی از هوش مصنوعی دریافت نشد.';

    return json({
      ok: true,
      answer: reply,
      reply,
      mode,
      hasImage: Boolean(image),
      model: env.OPENAI_MODEL || 'gpt-5.6-luna'
    }, 200, origin);
  },
};
