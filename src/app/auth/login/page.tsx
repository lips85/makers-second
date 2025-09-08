"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, User, Chrome, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<
    "signin" | "signup" | "google" | "guest" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("signin");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  const { signIn, signUp, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  // 비밀번호 강도 검증 함수
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = "";

    if (password.length >= 8) score += 1;
    else feedback += "최소 8자 이상, ";

    if (/[a-z]/.test(password)) score += 1;
    else feedback += "소문자 포함, ";

    if (/[A-Z]/.test(password)) score += 1;
    else feedback += "대문자 포함, ";

    if (/[0-9]/.test(password)) score += 1;
    else feedback += "숫자 포함, ";

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback += "특수문자 포함, ";

    if (feedback) {
      feedback = feedback.slice(0, -2) + "이 필요합니다.";
    }

    return { score, feedback };
  };

  // 비밀번호 변경 시 강도 검증
  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (activeTab === "signup" && newPassword.length > 0) {
      setPasswordStrength(checkPasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const currentLoadingType = activeTab === "signin" ? "signin" : "signup";
    setLoadingType(currentLoadingType);

    try {
      if (activeTab === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage("로그인 성공! 페이지를 이동합니다...");
          setTimeout(() => router.push(next), 1000);
        }
      } else {
        // 회원가입 처리
        const { error, data, needsEmailConfirmation } = await signUp(
          email,
          password
        );

        if (error) {
          setError(error.message);
        } else if (needsEmailConfirmation) {
          setError("이메일 확인이 필요합니다. 이메일을 확인해주세요.");
        } else {
          setSuccessMessage("회원가입 성공! 페이지를 이동합니다...");
          setTimeout(() => router.push(next), 1000);
        }
      }
    } catch (err) {
      setError("인증 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setLoadingType("google");
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage("Google 로그인 중...");
      }
    } catch (err) {
      setError("Google 로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGuestAuth = async () => {
    setIsLoading(true);
    setLoadingType("guest");
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signInAsGuest();
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage("게스트 로그인 성공! 페이지를 이동합니다...");
        setTimeout(() => router.push(next), 1000);
      }
    } catch (err) {
      setError("게스트 로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Word Rush</h2>
          <p className="mt-2 text-sm text-gray-600">
            영어 단어 스피드 퀴즈에 오신 것을 환영합니다
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>계정 로그인</CardTitle>
            <CardDescription>
              계정을 만들거나 로그인하여 학습을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">로그인</TabsTrigger>
                <TabsTrigger value="signup">회원가입</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && loadingType === "signin" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로그인 중...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        로그인
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">이메일</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="비밀번호를 입력하세요 (최소 8자)"
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                    {passwordStrength && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-2 w-full rounded ${
                                  level <= passwordStrength.score
                                    ? passwordStrength.score <= 2
                                      ? "bg-red-500"
                                      : passwordStrength.score <= 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            {passwordStrength.score <= 2
                              ? "약함"
                              : passwordStrength.score <= 3
                              ? "보통"
                              : "강함"}
                          </span>
                        </div>
                        {passwordStrength.feedback && (
                          <p className="text-xs text-red-600 mt-1">
                            {passwordStrength.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && loadingType === "signup" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        회원가입 중...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        회원가입
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  {isLoading && loadingType === "google" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Google 로그인 중...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-2 h-4 w-4" />
                      Google로 계속하기
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGuestAuth}
                  disabled={isLoading}
                >
                  {isLoading && loadingType === "guest" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      게스트 로그인 중...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      게스트로 시작하기
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
