export const PAGE_SIZE = 20;

export const TOKEN_KEY = "pfp_access_token";

export const REFRESH_TOKEN_KEY = "pfp_refresh_token";

export const LOCALE_KEY = "pfp_locale";

/**
 * Workspace persistence keys. Mirrored vào cookie cùng tên để Edge middleware
 * có thể đọc khi quyết định redirect onboarding (xem `src/middleware.ts`).
 */
export const WORKSPACE_ORG_KEY = "pfp_current_org_id";
export const WORKSPACE_SPACE_KEY = "pfp_current_space_id";
export const WORKSPACE_SMODULE_KEY = "pfp_current_smodule_id";
