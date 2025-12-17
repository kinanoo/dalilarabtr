# 🧪 دليل الاختبارات (Testing Guide)

هذا المشروع يستخدم **Jest** و **React Testing Library** للاختبارات الآلية.

## 📦 المكتبات المستخدمة

- **Jest**: إطار عمل الاختبارات
- **React Testing Library**: اختبار مكونات React من وجهة نظر المستخدم
- **@testing-library/jest-dom**: إضافة matchers مخصصة

## 🚀 تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات مرة واحدة
npm test

# تشغيل الاختبارات في الوضع المراقب (Watch Mode)
npm run test:watch

# إنشاء تقرير التغطية (Coverage Report)
npm run test:coverage
```

## 📁 بنية الملفات

```
src/
├── components/
│   ├── Component.tsx        # المكون الأساسي
│   └── __tests__/
│       └── Component.test.tsx  # اختبارات المكون
└── lib/
    └── __tests__/           # اختبارات الدوال المساعدة
```

## ✍️ كتابة اختبار جديد

### مثال بسيط:

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### اختبار الأحداث:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>اضغط</Button>);
    
    fireEvent.click(screen.getByText('اضغط'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🎯 أفضل الممارسات

1. **اختبر السلوك، لا التنفيذ**: اختبر ما يفعله المكون، ليس كيفية قيامه به
2. **استخدم `screen`**: بدلاً من الوصول المباشر إلى DOM
3. **اكتب اختبارات قابلة للقراءة**: استخدم وصف واضح لكل اختبار
4. **تجنب التفاصيل التنفيذية**: مثل testing for implementation details

## 📊 التغطية المستهدفة

```
Statements   : 80%+
Branches     : 70%+
Functions    : 80%+
Lines        : 80%+
```

## 🔗 روابط مفيدة

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
