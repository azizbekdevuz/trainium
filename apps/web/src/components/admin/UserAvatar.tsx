'use client';

interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
  email: string;
  className?: string;
  size?: string;
}

export function UserAvatar({ image, name, email, className = "w-10 h-10" }: UserAvatarProps) {
  return (
    <div className={`${className} rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name || email}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-avatar.png';
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/default-avatar.png"
          alt="No avatar"
          className="w-full h-full object-cover opacity-50"
        />
      )}
    </div>
  );
}
