// Confetti particle burst animation via canvas.

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	age: number;
	color: string;
	size: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animation_id: number | null = null;

function setup_canvas(): void {
	canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
	if (!canvas) {
		return;
	}
	ctx = canvas.getContext("2d");
	if (!ctx) {
		return;
	}
	resize_canvas();
	window.addEventListener("resize", resize_canvas);
}

function resize_canvas(): void {
	if (!canvas) {
		return;
	}
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function animate(): void {
	if (!ctx || !canvas) {
		return;
	}

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Update and draw particles
	let active_count = 0;
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];
		p.age += 16; // ~60fps
		if (p.age >= p.life) {
			particles.splice(i, 1);
		} else {
			active_count++;
			p.vy += 0.2; // gravity
			p.x += p.vx;
			p.y += p.vy;

			const progress = p.age / p.life;
			const alpha = 1 - progress;

			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
			ctx.restore();
		}
	}

	if (active_count > 0) {
		animation_id = requestAnimationFrame(animate);
	} else {
		animation_id = null;
	}
}

//============================================

// Spawn ~80 confetti particles at (x, y) with optional color pool.
// If color_pool undefined, sample theme button colors from CSS variables.
export function burst_confetti(
	x: number,
	y: number,
	color_pool?: string[]
): void {
	if (!canvas && typeof document !== "undefined") {
		setup_canvas();
	}
	if (!canvas || !ctx) {
		return;
	}

	// Default: use theme button colors
	if (!color_pool) {
		const style = getComputedStyle(document.body);
		color_pool = [
			style.getPropertyValue("--btn-1").trim(),
			style.getPropertyValue("--btn-2").trim(),
			style.getPropertyValue("--btn-3").trim(),
			style.getPropertyValue("--btn-4").trim(),
		].filter((c) => c.length > 0);
		if (color_pool.length === 0) {
			color_pool = ["#ff6b6b", "#ffd166", "#06d6a0", "#9b5de5"];
		}
	}

	const particle_count = 80;
	for (let i = 0; i < particle_count; i++) {
		const angle = (Math.random() * Math.PI * 2);
		const speed = 2 + Math.random() * 6;
		const color = color_pool[Math.floor(Math.random() * color_pool.length)];

		particles.push({
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 3, // initial upward bias
			life: 1200,
			age: 0,
			color,
			size: 6 + Math.random() * 4,
		});
	}

	if (animation_id === null) {
		animate();
	}
}
