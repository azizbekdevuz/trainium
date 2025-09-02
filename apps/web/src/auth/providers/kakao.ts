import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface KakaoProfile {
  id: number;
  connected_at: string;
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email?: string;
  };
}

export default function Kakao(
  options: OAuthUserConfig<KakaoProfile>
): OAuthConfig<KakaoProfile> {
  // normalize http → https for Kakao avatars
  const toHttps = (url?: string | null) =>
    url?.startsWith("http://") ? url.replace(/^http:\/\//, "https://") : url ?? null;

  return {
    id: "kakao",
    name: "Kakao",
    type: "oauth",
    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        // matches your enabled consent items
        scope: "profile_nickname profile_image account_email",
      },
    },
    token: "https://kauth.kakao.com/oauth/token",
    userinfo: "https://kapi.kakao.com/v2/user/me",
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,

    profile(profile) {
      const acc = profile.kakao_account ?? ({} as KakaoProfile["kakao_account"]);
      const p = acc.profile ?? {};
      const img = toHttps(p.profile_image_url ?? p.thumbnail_image_url ?? null);

      return {
        id: String(profile.id),
        name: p.nickname ?? "Kakao User",
        // Kakao may return null if not verified; keep your app tolerant
        email: acc.is_email_valid && acc.is_email_verified ? acc.email ?? null : null,
        image: img,
      };
    },

    options,
  };
}