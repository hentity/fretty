export interface Spot {
  status: 'review' | 'unseen' | 'unlearnable' | 'learning';
  interval: number;
  string: number;
  fret:number;
  note: string;
  octave: number;
  ease_factor: number;
  good_attempts: number;
  all_attempts: number;
  num_practices: number;
}

export interface Progress {
  new: boolean;
  tuning: string[];
  last_review_date: string | null;
  review_date_to_spots: Record<string, string[]>;
  spot_to_review_date: Record<string, string>;
  spots: Spot[];
}

export type ColoredChar = {
  char: string;
  fgColor?: string; // text color
  bgColor?: string; // background color
};

export type ColoredChunk = {
  text: string;
  fgColor?: string;
  bgColor?: string;
};