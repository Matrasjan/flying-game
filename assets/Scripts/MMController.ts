import { _decorator, Component, Vec3, tween, Node, director, Canvas,
         ParticleSystem2D, Label, UITransform, Material, EffectAsset,
         assetManager} from 'cc';
const { ccclass } = _decorator;

const GRADIENT_EFFECT_UUID = 'e0000003-ef00-4000-8000-000000000001';

@ccclass('MMController')
export class MMController extends Component {

    private arcUp = true;
    private _gradientEffect: EffectAsset | null = null;

    start() {
        this.flyToNext();
        assetManager.loadAny(GRADIENT_EFFECT_UUID, (err, asset) => {
            if (!err && asset) this._gradientEffect = asset as EffectAsset;
        });
    }

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

    private flyToCenter() {
        const start   = this.node.position.clone();
        const end     = new Vec3(0, 0, 0);
        const control = new Vec3(start.x / 2, (start.y + end.y) / 2 + 100, 0);
        this.moveBezier(start, control, end, 1.5, () => {
            this.node.getChildByName('Smoke')?.getComponent(ParticleSystem2D)?.stopSystem();
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
