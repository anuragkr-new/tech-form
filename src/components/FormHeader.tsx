import type { FormSettingsData } from "@/types/form";

export function FormSubtitle({
  template,
  email,
}: {
  template: string;
  email: string;
}) {
  const marker = "{email}";
  const index = template.indexOf(marker);

  if (index === -1) {
    return <>{template}</>;
  }

  return (
    <>
      {template.slice(0, index)}
      <strong>{email}</strong>
      {template.slice(index + marker.length)}
    </>
  );
}
