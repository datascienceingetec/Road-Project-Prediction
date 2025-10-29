import Image from 'next/image';

export default function Logo({ variant = 'compact' }) {
  const src = variant === 'full' ? '/LOGO_INGETEC_BLANCO.png' : '/SIMBOLO_INGETEC_BLANCO.png';
  const alt = variant === 'full' ? 'Logo completo' : 'Logo compacto';
  const width = variant === 'full' ? 150 : 120;
  const height = variant === 'full' ? 100 : 40;

  return <Image src={src} alt={alt} width={width} height={height} />;
}
