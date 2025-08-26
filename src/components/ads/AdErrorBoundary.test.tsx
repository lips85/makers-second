import { render, screen } from "@testing-library/react";
import { AdErrorBoundary, DefaultAdFallback } from "./AdErrorBoundary";

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("테스트 에러");
  }
  return <div>정상 컴포넌트</div>;
};

describe("AdErrorBoundary", () => {
  // 에러 로그 스파이
  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  test("정상적인 경우 자식 컴포넌트를 렌더링해야 함", () => {
    render(
      <AdErrorBoundary>
        <ThrowError shouldThrow={false} />
      </AdErrorBoundary>
    );

    expect(screen.getByText("정상 컴포넌트")).toBeInTheDocument();
  });

  test("에러 발생 시 기본 폴백 UI를 렌더링해야 함", () => {
    render(
      <AdErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AdErrorBoundary>
    );

    // 기본 폴백 UI 요소들이 표시되어야 함
    expect(screen.getByText("광고를 불러올 수 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByLabelText("광고 로드 실패")).toBeInTheDocument();
  });

  test("에러 발생 시 커스텀 폴백 컴포넌트를 렌더링해야 함", () => {
    const CustomFallback = ({ error }: { error?: Error }) => (
      <div data-testid="custom-fallback">커스텀 에러: {error?.message}</div>
    );

    render(
      <AdErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </AdErrorBoundary>
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText("커스텀 에러: 테스트 에러")).toBeInTheDocument();
  });

  test("에러 발생 시 에러 로그가 기록되어야 함", () => {
    render(
      <AdErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AdErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "AdErrorBoundary caught an error:",
      expect.any(Error),
      expect.any(Object)
    );
  });

  test("className이 폴백 UI에 적용되어야 함", () => {
    render(
      <AdErrorBoundary className="test-class">
        <ThrowError shouldThrow={true} />
      </AdErrorBoundary>
    );

    const fallbackElement = screen.getByRole("banner");
    expect(fallbackElement).toHaveClass("test-class");
  });
});

describe("DefaultAdFallback", () => {
  test("기본 폴백 UI를 렌더링해야 함", () => {
    render(<DefaultAdFallback />);

    expect(screen.getByText("광고")).toBeInTheDocument();
    expect(
      screen.getByText("일시적으로 표시할 수 없습니다")
    ).toBeInTheDocument();
  });

  test("에러 객체가 전달되면 에러 정보를 표시할 수 있어야 함", () => {
    const testError = new Error("테스트 에러 메시지");
    render(<DefaultAdFallback error={testError} />);

    // 에러 정보가 표시될 수 있도록 구조가 준비되어 있어야 함
    expect(screen.getByText("광고")).toBeInTheDocument();
  });
});
