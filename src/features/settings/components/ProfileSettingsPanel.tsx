"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/authStore";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { avatarImageUnoptimized } from "@/shared/lib/avatar-image";
import { cn } from "@/shared/lib/utils";

import {
  useChangePasswordMutation,
  useUpdateProfileSection,
  useUserProfileBundle,
} from "../hooks/useSettingsQueries";

function UserAvatar({
  url,
  label,
  onPick,
  disabled,
}: {
  url: string | null;
  label: string;
  onPick: () => void;
  disabled?: boolean;
}) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-warm-200 bg-warm-100 text-xl font-semibold text-warm-700",
        "outline-none transition hover:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        disabled && "pointer-events-none opacity-60")}
      aria-label="Đổi ảnh đại diện"
    >
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          sizes="96px"
          unoptimized={avatarImageUnoptimized(url)}
        />
      ) : (
        initials || "?"
      )}
    </button>
  );
}

export function ProfileSettingsPanel() {
  const authUser = useAuthStore((s) => s.user);
  const profileQuery = useUserProfileBundle();
  const updateProfile = useUpdateProfileSection();
  const changePw = useChangePasswordMutation();

  const user = profileQuery.data?.user ?? authUser;

  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayAvatar = previewUrl ?? user?.avatarUrl ?? null;

  const onAvatarClick = () => fileRef.current?.click();

  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setAvatarFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onSaveProfile = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) {
      return;
    }
    updateProfile.mutate({
      fullName: fullName.trim() || user.fullName,
      avatarFile,
    }, {
      onSuccess: () => {
        setAvatarFile(null);
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if (fileRef.current) {
          fileRef.current.value = "";
        }
      },
    });
  };

  const onSavePassword = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (newPw !== confirmPw) {
      return;
    }
    changePw.mutate(
      { currentPassword: curPw, newPassword: newPw },
      {
        onSuccess: () => {
          setCurPw("");
          setNewPw("");
          setConfirmPw("");
        },
      });
  };

  if (!user) {
    return (
      <p className="text-sm text-warm-600">
        Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm md:p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">Hồ sơ</h2>
        <p className="mt-1 text-sm text-warm-600">
          Cập nhật ảnh đại diện và họ tên hiển thị.
        </p>

        <form className="mt-6 flex flex-col gap-6 md:flex-row" onSubmit={onSaveProfile}>
          <UserAvatar
            url={displayAvatar}
            label={user.fullName || user.email}
            onPick={onAvatarClick}
            disabled={updateProfile.isPending}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-warm-700" htmlFor="profile-email">
                Email
              </label>
              <input
                id="profile-email"
                readOnly
                value={user.email}
                aria-readonly
                className={cn(
                  "h-10 w-full max-w-md rounded-input border border-warm-200 bg-warm-50 px-3 text-sm text-warm-700")}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={updateProfile.isPending}>
                Lưu hồ sơ
              </Button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm md:p-6">
        <h2 className="font-display text-lg font-semibold text-warm-900">Đổi mật khẩu</h2>
        <p className="mt-1 text-sm text-warm-600">
          Dùng mật khẩu mạnh mà bạn chưa dùng ở nơi khác.
        </p>

        <form className="mx-auto mt-6 max-w-md space-y-4" onSubmit={onSavePassword}>
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            required
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            autoComplete="new-password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            error={
              confirmPw.length > 0 && newPw !== confirmPw
                ? "Mật khẩu xác nhận không khớp"
                : undefined
            }
            required
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="secondary"
              disabled={newPw !== confirmPw || newPw.length === 0}
              isLoading={changePw.isPending}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </section>

      {profileQuery.isError ? (
        <p className="text-xs text-warm-500">
          Không tải được cấu hình từ máy chủ; hiển thị thông tin đăng nhập cục bộ.
        </p>
      ) : null}
    </div>
  );
}
