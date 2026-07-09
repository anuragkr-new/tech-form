import { prisma } from "@/lib/prisma";

export const DEFAULT_FORM_TITLE = "JAS Targets Requirements";
export const DEFAULT_FORM_SUBTITLE =
  "Submit your technical requirements for JAS targets. Signed in as {email}.";

export type FormSettingsData = {
  title: string;
  subtitle: string;
};

export async function getFormSettings(): Promise<FormSettingsData> {
  if (!("formSettings" in prisma)) {
    return {
      title: DEFAULT_FORM_TITLE,
      subtitle: DEFAULT_FORM_SUBTITLE,
    };
  }

  try {
    const settings = await prisma.formSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return {
        title: DEFAULT_FORM_TITLE,
        subtitle: DEFAULT_FORM_SUBTITLE,
      };
    }

    return {
      title: settings.title,
      subtitle: settings.subtitle,
    };
  } catch {
    return {
      title: DEFAULT_FORM_TITLE,
      subtitle: DEFAULT_FORM_SUBTITLE,
    };
  }
}
