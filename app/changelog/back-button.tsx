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
    <Button variant="ghost" className="-ml-2 text-base" onClick={handleClick}>
      <ArrowLeft />
      {t("common.back")}
    </Button>
  );
}
