"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  const t = useTranslations();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <Button variant="ghost" size="sm" className="-ml-2" onClick={handleClick}>
      <ArrowLeft className="size-4" />
      {t("common.back")}
    </Button>
  );
}
