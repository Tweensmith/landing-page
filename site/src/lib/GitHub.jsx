import { useEffect, useState } from "react";
import { Icon } from "../../../components/_shared/icons.jsx";
import { links, hrefFor } from "../links.js";
import { Key } from "./Key.jsx";

/** GitHub's mark (their own logo, used only to link to GitHub). */
export function GitHubMark({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable="false">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

const short = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

/**
 * The repository's star count. It is never a made-up number: it starts at 0 and, once `links.repo.slug`
 * ("owner/name") is filled in, is read live from GitHub's public API. If the request fails it stays as it was.
 */
export function useStars() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const slug = links.repo.slug;
    if (!slug) return;
    let gone = false;
    fetch(`https://api.github.com/repos/${slug}`, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!gone && d && Number.isFinite(d.stargazers_count)) setN(d.stargazers_count); })
      .catch(() => {});
    return () => { gone = true; };
  }, []);
  return n;
}

/** The GitHub key: the mark, the word, and the star count. */
export function GitHubKey({ small = false, word = true }) {
  const stars = useStars();
  return (
    <Key small={small} href={hrefFor("repo")} className="key--gh" aria-label={`GitHub repository, ${stars} ${stars === 1 ? "star" : "stars"}`}
      chip={<><Icon name="star" size={11} stroke={2} />{short(stars)}</>}>
      <GitHubMark size={small ? 15 : 16} />{word && <span>GitHub</span>}
    </Key>
  );
}
