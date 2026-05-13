export interface PollTemplate {
  key: string;
  label: string;
  title: string;
  options: string[];
}

export const TEMPLATES: PollTemplate[] = [
  {
    key: 'lunch',
    label: '中饭吃啥',
    title: '今天中饭吃啥？',
    options: ['麻辣烫', '沙县小吃', '日料', '自带便当'],
  },
  {
    key: 'travel',
    label: '旅游目的地',
    title: '下次团建去哪？',
    options: ['杭州', '成都', '日本', '泰国'],
  },
];
