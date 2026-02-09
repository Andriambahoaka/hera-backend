import fs from "fs";
import path from "path";

export function renderTemplate(
  templateName: string,
  variables: Record<string, string>,
  ext: string = "html"
): string {
  const filePath = path.join(__dirname, `../templates/${templateName}.${ext}`);
  let template = fs.readFileSync(filePath, "utf8");

  // Replace placeholders like {{name}}, {{email}}, {{tempPassword}}
  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    template = template.replace(regex, variables[key]);
  }

  return template;
}
