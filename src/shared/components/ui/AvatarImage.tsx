import { avatarImageUnoptimized } from "@/shared/lib/avatar-image";
import { cn } from "@/shared/lib/utils";

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
};

/** Replaces next/image for avatar URLs. */
export function AvatarImage({
  src,
  alt = "",
  className,
  width,
  height,
  fill,
}: AvatarImageProps) {
  const unoptimized = avatarImageUnoptimized(src);

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 size-full object-cover", className)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        {...(unoptimized ? {} : { crossOrigin: "anonymous" })}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      {...(unoptimized ? {} : { crossOrigin: "anonymous" })}
    />
  );
}
