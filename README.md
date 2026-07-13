# CEO OS — نظام الإدارة التنفيذية الذكي

نظام تشغيلي متكامل للمدير التنفيذي، يدمج الذكاء الاصطناعي لإدارة المشاريع والأهداف والقرارات والمهام اليومية.

## 🚀 المميزات

- **وكيل تنفيذي ذكي** — مساعد AI مدرك للنظام بالكامل، ينفذ الإجراءات ويتحدث بالعربية
- **إدارة المشاريع** — إنشاء وتحديث المشاريع بمراحلها وربطها بالأهداف
- **الأهداف** — أهداف سنوية / ربعية / شهرية / أسبوعية مع مهام قابلة للتتبع
- **الخطة اليومية** — تنظيم المهام حسب أولوية Eisenhower Matrix
- **الأفكار** — تسجيل وتصنيف وتحويل الأفكار إلى مشاريع
- **القرارات** — توثيق القرارات مع أسبابها وأثرها المتوقع
- **المؤشرات** — متابعة مؤشرات الأداء الرئيسية
- **نظام Graph** — ربط جميع الكيانات بعلاقات ذكية
- **النشاطات** — سجل تلقائي لكل التعديلات

## 🛠️ التقنيات

| الطبقة           | التقنية                                  |
| ---------------- | ---------------------------------------- |
| الواجهة          | React 19 + TypeScript + Tailwind CSS 4   |
| التوجيه          | React Router v7                          |
| الحالة           | Zustand                                  |
| البيانات         | TanStack Query + Supabase                |
| القاعدة          | PostgreSQL (Supabase)                    |
| الذكاء الاصطناعي | DeepSeek API عبر Supabase Edge Functions |
| المكونات         | Radix UI + Lucide Icons                  |
| البناء           | Vite 6                                   |

## ⚙️ الإعداد

### المتطلبات

- Node.js 18+
- حساب Supabase
- مفتاح DeepSeek API

### التثبيت

```bash
git clone https://github.com/ahmed-bajaber539/CEO_OS.git
cd CEO_OS
npm install
```

### البيئة

أنشئ ملف `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### قاعدة البيانات

نفذ migrations من `supabase/migrations/` بالترتيب.

### الذكاء الاصطناعي

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set DEEPSEEK_API_KEY=sk-xxxx
npx supabase functions deploy executive-ai --no-verify-jwt
```

### التشغيل

```bash
npm run dev
```

## 📁 الهيكل

```
src/
├── components/          # مكونات واجهة مشتركة
│   ├── layout/          # التخطيط العام (Header, Sidebar, QuickAdd)
│   ├── shared/          # مكونات قابلة لإعادة الاستخدام
│   └── ui/              # مكونات النظام الأساسية (Radix)
├── features/            # صفحات النظام
│   ├── auth/            # تسجيل الدخول
│   ├── dashboard/       # لوحة التحكم
│   ├── projects/        # المشاريع
│   ├── goals/           # الأهداف
│   ├── daily/           # الخطة اليومية
│   ├── ideas/           # الأفكار
│   ├── decisions/       # القرارات
│   ├── metrics/         # المؤشرات
│   └── executive-ai/    # الوكيل التنفيذي AI
│       ├── core/        # المحرك الأساسي (Agent Manifest, Tool Registry, LLM Provider…)
│       ├── chat/        # واجهة المحادثة
│       └── stores/      # حالة Zustand
├── hooks/               # خطافات TanStack Query
├── services/            # طبقة الخدمات (المنطق التجاري)
├── stores/              # متاجر Zustand عامة
└── types/               # أنواع TypeScript
```

## 📝 الرخصة

MIT
