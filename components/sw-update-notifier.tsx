"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";

const version = process.env.NEXT_PUBLIC_APP_VERSION;
const releaseNotes = process.env.NEXT_PUBLIC_RELEASE_NOTES;

export function SwUpdateNotifier() {
  const t = useTranslations();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!("serwist" in window) || !window.serwist) return;

    window.serwist.addEventListener("controlling", (event) => {
      if (!event.isUpdate) return;

      const notes = releaseNotes
        ?.split("\n")
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2));

      toast(t("update.whatsNew", { version: version ?? "" }), {
        duration: Infinity,
        description: (
          <div className="flex flex-col gap-2">
            {notes && notes.length > 0 && (
              <ul className="list-disc pl-4 text-sm">
                {notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            )}
            <Link
              href="/changelog"
              className="text-sm underline underline-offset-2 opacity-70 hover:opacity-100"
              style={{ textDecorationSkipInk: "none" }}
              onClick={() => toast.dismiss()}
            >
              {t("update.viewPastUpdates")}
            </Link>
          </div>
        ),
      });
    });
  }, [t]);

  return null;
}
