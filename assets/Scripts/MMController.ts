import { _decorator, Component, Vec3, tween, Node, director, Canvas,
         Label, UITransform, Material, EffectAsset, assetManager,
         Graphics, Color } from 'cc';
const { ccclass } = _decorator;

const GRADIENT_EFFECT_UUID = 'e0000003-ef00-4000-8000-000000000001';

@ccclass('MMController')
export class MMController extends Component {

    private arcUp = true;
    private _gradientEffect: EffectAsset | null = null;

    start() {
        this.schedule(this.spawnPuff, 0.08);
        this.flyToNext();
        assetManager.loadAny(GRADIENT_EFFECT_UUID, (err, asset) => {
            if (!err && asset) this._gradientEffect = asset as EffectAsset;
        });
    }

    // ─── Smoke puffs ─────────────────────────────────────────────────────────

    private spawnPuff = () => {
        const pos = this.node.worldPosition.clone();

        const puffNode = new Node('puff');
        puffNode.layer = this.node.layer;
        this.node.parent.addChild(puffNode);
        puffNode.setWorldPosition(pos);

        const size  = 6 + Math.random() * 10;
        const grey  = Math.floor(130 + Math.random() * 80);
        puffNode.addComponent(UITransform).setContentSize(size * 6, size * 6);
        const g = puffNode.addComponent(Graphics);

        const anim = { t: 0 };
        tween(anim)
            .to(0.9, { t: 1 }, {
                onUpdate: () => {
                    const alpha  = Math.round(180 * (1 - anim.t));
                    const radius = size * (1 + anim.t * 2);
                    const s      = 1 + anim.t * 1.5;
                    puffNode.setScale(s, s, 1);
                    g.clear();
                    g.fillColor = new Color(grey, grey, grey, alpha);
                    g.circle(0, 0, radius);
                    g.fill();
                }
            })
            .call(() => { if (puffNode.isValid) puffNode.destroy(); })
            .start();
    };

    // ─── Candy hunting ───────────────────────────────────────────────────────

    private getCandies(): Node[] {
        const canvas = director.getScene().getComponentInChildren(Canvas).node;
        const layer = canvas.getChildByName('ScatteredLayer');
        if (!layer) return [];
        return layer.children.filter(n => n.name === 'candy');
    }

    private findNearest(candies: Node[]): Node {
        const pos = this.node.worldPosition;
        let nearest = candies[0];
        let minDist = Infinity;
        for (const c of candies) {
            const d = Vec3.distance(pos, c.worldPosition);
            if (d < minDist) { minDist = d; nearest = c; }
        }
        return nearest;
    }

    private flyToNext() {
        const candies = this.getCandies();
        if (!candies.length) { this.flyToCenter(); return; }

        const target  = this.findNearest(candies);
        const start   = this.node.position.clone();
        const end     = target.position.clone();
        const control = new Vec3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2 + (this.arcUp ? 180 : -180),
            0
        );
        this.arcUp = !this.arcUp;

        const duration = Math.max(0.7, Vec3.distance(start, end) / 450);
        this.moveBezier(start, control, end, duration, () => {
            if (target.isValid) target.destroy();
            this.flyToNext();
        });
    }

    // ─── End game ────────────────────────────────────────────────────────────

    private flyToCenter() {
        const start   = this.node.position.clone();
        const end     = new Vec3(0, 0, 0);
        const control = new Vec3(start.x / 2, (start.y + end.y) / 2 + 100, 0);
        this.moveBezier(start, control, end, 1.5, () => {
            this.unschedule(this.spawnPuff);
            this.showGameOver();
        });
    }

    private showGameOver() {
        const labelNode = new Node('GameOver');
        labelNode.layer = this.node.layer;
        this.node.parent.addChild(labelNode);
        labelNode.setPosition(0, 90, 0);

        labelNode.addComponent(UITransform).setContentSize(500, 80);

        const label = labelNode.addComponent(Label);
        label.string          = 'Game Over!';
        label.fontSize        = 52;
        label.isBold          = true;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign   = Label.VerticalAlign.CENTER;
        label.overflow        = Label.Overflow.SHRINK;

        if (this._gradientEffect) {
            const mat = new Material();
            mat.initialize({ effectAsset: this._gradientEffect });
            label.customMaterial = mat;
        }
    }

    // ─── Bezier ──────────────────────────────────────────────────────────────

    private moveBezier(p0: Vec3, p1: Vec3, p2: Vec3, duration: number, callback?: Function) {
        const t = { value: 0 };
        tween(t)
            .to(duration, { value: 1 }, {
                onUpdate: () => {
                    const u = 1 - t.value;
                    this.node.setPosition(new Vec3(
                        u*u*p0.x + 2*u*t.value*p1.x + t.value*t.value*p2.x,
                        u*u*p0.y + 2*u*t.value*p1.y + t.value*t.value*p2.y,
                        0
                    ));
                }
            })
            .call(() => callback?.())
            .start();
    }
}
