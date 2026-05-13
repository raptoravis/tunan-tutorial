export interface Template {
  title: string;
  options: string[];
}

export const TEMPLATES: Record<string, Template> = {
  travel: {
    title: "周末去哪玩？",
    options: ["杭州", "成都", "厦门", "西安"],
  },
  lunch: {
    title: "中饭吃什么？",
    options: ["麻辣烫", "盖浇饭", "兰州拉面", "便利店"],
  },
};

export function getTemplate(key: string | null | undefined): Template | null {
  if (!key) return null;
  return TEMPLATES[key] ?? null;
}
