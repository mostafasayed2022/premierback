// ─── Permanent redirect: /gcc/iv-theropy/ar → /gcc/iv-therapy/ar ─────────────
// 308 Permanent Redirect — preserves SEO equity and any backlinks/ad URLs
// pointing to the old misspelled path.

import { redirect } from "next/navigation";

export default function OldSpellingRedirect() {
  redirect("/gcc/iv-therapy/ar");
}
