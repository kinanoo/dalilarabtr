import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

describe('ErrorBoundary Component', () => {
  // يجب تعطيل console.error لأن ErrorBoundary يطبعها
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children correctly when no error', () => {
    render(
      <ErrorBoundary>
        <div>محتوى آمن</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('محتوى آمن')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    const ThrowError = () => {
      throw new Error('خطأ اختبار');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // يجب أن يظهر عنوان الخطأ
    expect(screen.getByText('حدث خطأ')).toBeInTheDocument();
    // يجب أن يكون هناك زر لتحديث الصفحة
    expect(screen.getByText('تحديث الصفحة')).toBeInTheDocument();
  });
});
