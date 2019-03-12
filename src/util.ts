import { default as Handlebars } from "handlebars";

function toCamelCase(envStr: string) {
  const l = envStr.toLowerCase();
  return l.replace(/_./g, s => {
    return s.charAt(1).toUpperCase();
  });
}

export function convert(yaml: string): string {
  const data = {};
  Object.keys(process.env).forEach(envkey => {
    const key = toCamelCase(envkey);
    data[key] = process.env[envkey];
  });
  const template = Handlebars.compile(yaml);
  const converted = template(data);
  return converted;
}
