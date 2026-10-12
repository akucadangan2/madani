export const POSE = {
  jempol: 1,
  percaya: 2,
  digital: 3,
  tunjuk: 4,
  semangat: 5,
  berpikir: 6,
  sapa: 7,
  bersama: 8,
} as const;

export type Pose = keyof typeof POSE;

export function Maskot({
  pose,
  className = '',
  goyang = true,
  cepat = false,
  alt = '',
}: {
  pose: Pose;
  className?: string;
  goyang?: boolean;
  cepat?: boolean;
  alt?: string;
}) {
  const nomor = String(POSE[pose]).padStart(2, '0');
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/maskot/${nomor}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={cepat ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={`pointer-events-none select-none ${goyang ? 'maskot-goyang' : ''} ${className}`}
    />
  );
}