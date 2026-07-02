import { useEffect, useRef } from 'react';
import { player } from '@/state/store';

const W = 300;
const H = 44;
const PPD = 2.4; // pixels per degree of heading on the tape
const CARDINALS = ['N', 'NÖ', 'Ö', 'SÖ', 'S', 'SV', 'V', 'NV'];

// Heading from camera yaw. Camera faces world (sin yaw, cos yaw); North is −Z,
// East is +X, so bearing = atan2(east, north) = atan2(sin yaw, −cos yaw).
function bearingDeg(yaw: number): number {
  const b = (Math.atan2(Math.sin(yaw), -Math.cos(yaw)) * 180) / Math.PI;
  return (b + 360) % 360;
}

function label(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  if (norm % 45 === 0) return CARDINALS[(norm / 45) % 8]!;
  return String(norm);
}

export function Compass(): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let id = 0;
    const draw = (): void => {
      id = requestAnimationFrame(draw);
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext('2d')!;
      const bearing = bearingDeg(player.camYaw);
      const cx = W / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(230,237,243,0.9)';
      ctx.textAlign = 'center';

      const start = Math.ceil(bearing - W / 2 / PPD);
      const end = Math.floor(bearing + W / 2 / PPD);
      for (let d = start; d <= end; d++) {
        const norm = ((d % 360) + 360) % 360;
        const x = cx + (d - bearing) * PPD;
        if (norm % 45 === 0) {
          ctx.strokeStyle = 'rgba(255,212,121,0.9)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x, 20);
          ctx.lineTo(x, 30);
          ctx.stroke();
          const isCardinal = norm % 90 === 0;
          ctx.fillStyle = isCardinal ? '#ffd479' : 'rgba(230,237,243,0.85)';
          ctx.font = `${isCardinal ? 'bold 13' : '11'}px Segoe UI, system-ui`;
          ctx.fillText(label(norm), x, 15);
        } else if (norm % 15 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 24);
          ctx.lineTo(x, 30);
          ctx.stroke();
        }
      }

      // fixed centre needle + numeric heading
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 18);
      ctx.lineTo(cx, 34);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Segoe UI, system-ui';
      ctx.fillText(`${Math.round(bearing)}°`, cx, H - 2);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="compass-strip">
      <canvas ref={ref} width={W} height={H} />
    </div>
  );
}
