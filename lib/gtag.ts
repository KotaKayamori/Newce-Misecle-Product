export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
export const IS_DEV = process.env.NODE_ENV === 'development';

export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      debug_mode: IS_DEV, 
    });
  }
};