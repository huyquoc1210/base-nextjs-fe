import { notFound } from "next/navigation";

// A prerendered shell would commit a 200 before notFound() runs, so this
// route has to block and render on the server to answer with a real 404
export const instant = false;

// Without this catch-all an unknown URL falls through to Next's global
// /_not-found, which sits outside the locale segment and is untranslated
const NotFoundCatchAll = () => {
  notFound();
};

export default NotFoundCatchAll;
