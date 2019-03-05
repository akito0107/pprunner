import { default as Handlebars } from "handlebars";

export function convert(yaml: string): string {
  const data = {
    hostUrl: process.env.HOST_URL || "http://localhost:3000",
    password: process.env.PASSWORD || "passw0rd",
    userId: process.env.USER_ID || "test@example.com"
  };
  const template = Handlebars.compile(yaml);
  const converted = template(data);
  return converted;
}
