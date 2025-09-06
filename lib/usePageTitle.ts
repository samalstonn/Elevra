"use client";

import { useEffect } from "react";

/**
 * Sets the document title on the client for pages that are client components
 * and therefore cannot use Next.js metadata directly.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    if (!title) return;
    document.title = title.includes("Elevra") ? title : `${title} | Elevra`;
  }, [title]);
}

