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
  is_new: boolean;
}

export interface Progress {
  new: boolean;
  tuning: string[];
  last_review_date: string | null;
  review_date_to_spots: Record<string, string[]>;
  spot_to_review_date: Record<string, string>;
  spots: Spot[];
}

export type ColoredChunk = {
  text: string;
  onClick?: () => void;
  onMouseEnter? : () => void;
  onMouseLeave? : () => void;
  style?: React.CSSProperties;
  className?: string;
  noPadding?: boolean;
};