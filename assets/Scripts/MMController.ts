import { _decorator, Component, Vec3, tween, Node, director, Canvas, ParticleSystem2D } from 'cc';
const { ccclass } = _decorator;

@ccclass('MMController')
export class MMController extends Component {

    private arcUp = true;

    start() {
        this.flyToNext();
    }

    private getCandies(): Node[] {
        const scene = director.getScene();
        const canvas = scene.getComponentInChildren(Canvas).node;
        const layer = canvas.getChildByName('ScatteredLayer');
        if (!layer) return [];
        return layer.children.filter(n => n.name === 'candy');
    }

    private findNearest(candies: Node[]): Node {
        const pos = this.node.worldPosition;
        let nearest: Node = candies[0];
        let minDist = Infinity;
        for (const c of candies) {
            const d = Vec3.distance(pos, c.worldPosition);
            if (d < minDist) { minDist = d; nearest = c; }
        }
        return nearest;
    }

    private flyToNext() {
        const candies = this.getCandies();

        if (!candies.length) {
            this.flyToCenter();
            return;
        }

        const target = this.findNearest(candies);
        const start = this.node.position.clone();
        // ScatteredLayer is at canvas origin with scale 1, so target.position = canvas-local coords
        const end = target.position.clone();

        const control = new Vec3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2 + (this.arcUp ? 180 : -180),
            0
        );
        this.arcUp = !this.arcUp;

        const dist = Vec3.distance(start, end);
        const duration = Math.max(0.7, dist / 450);

        this.moveBezier(start, control, end, duration, () => {
            if (target.isValid) target.destroy();
            this.flyToNext();
        });
    }

    private flyToCenter() {
        const start = this.node.position.clone();
        const end = new Vec3(0, 0, 0);
        const control = new Vec3(start.x / 2, (start.y + end.y) / 2 + 100, 0);
        this.moveBezier(start, control, end, 1.5, () => {
            const smoke = this.node.getChildByName('Smoke');
            smoke?.getComponent(ParticleSystem2D)?.stopSystem();
        });
    }

    private moveBezier(p0: Vec3, p1: Vec3, p2: Vec3, duration: number, callback?: Function) {
        const t = { value: 0 };
        tween(t)
            .to(duration, { value: 1 }, {
                onUpdate: () => {
                    const u = 1 - t.value;
                    const x = u * u * p0.x + 2 * u * t.value * p1.x + t.value * t.value * p2.x;
                    const y = u * u * p0.y + 2 * u * t.value * p1.y + t.value * t.value * p2.y;
                    this.node.setPosition(new Vec3(x, y, 0));
                }
            })
            .call(() => callback?.())
            .start();
    }
}
