export type Message = { id: string; text: string; author: string; days: number; votes: number; boost: number; topBooster: string };
export const sampleMessages: Message[] = [
  { id: 'one', text: 'I miss who I was before I started worrying about money.', author: 'anonymous', days: 2, votes: 42891, boost: 1240, topBooster: 'quietgiver' },
  { id: 'two', text: 'Mom, I’m finally doing okay.', author: 'sunnydays', days: 5, votes: 38204, boost: 840, topBooster: 'goldenhour' },
  { id: 'three', text: 'Nobody tells you how lonely success can feel.', author: 'dreamer', days: 1, votes: 31882, boost: 620, topBooster: 'lighthouse' },
  { id: 'four', text: 'I wish I had told my dad I loved him more.', author: 'justme', days: 3, votes: 29441, boost: 210, topBooster: 'wanderly' },
  { id: 'five', text: 'I’m terrified, but I’m proud of myself.', author: 'braver', days: 6, votes: 27103, boost: 190, topBooster: 'ember' },
  { id: 'six', text: 'America, we can be kinder than this.', author: 'hopeful', days: 4, votes: 24991, boost: 160, topBooster: 'stillwater' },
  { id: 'seven', text: 'I still think about you.', author: 'nobody', days: 1, votes: 22884, boost: 120, topBooster: 'mildpeak' },
  { id: 'eight', text: 'I’m starting over. Again. And that’s okay.', author: 'reset', days: 2, votes: 20441, boost: 98, topBooster: 'northstar' },
  { id: 'nine', text: 'Mental health matters more than your productivity.', author: 'kindmind', days: 3, votes: 18903, boost: 76, topBooster: 'softlanding' },
  { id: 'ten', text: 'I hope you’re proud of me.', author: 'stilltrying', days: 4, votes: 17221, boost: 64, topBooster: 'dawnkeeper' },
];
