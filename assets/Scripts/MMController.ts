import { _decorator, Component, Vec3, tween } from 'cc';
const { ccclass } = _decorator;

@ccclass('MMController')
export class MMController extends Component {

    start() {
        this.loopFlight();
    }

    loopFlight() {
        const start = this.node.position.clone();

        const right = new Vec3(start.x + 250, start.y, 0);

        const upControl = new Vec3(start.x + 125, start.y + 160, 0);
        const downControl = new Vec3(start.x + 125, start.y - 160, 0);

        this.moveBezier(start, upControl, right, () => {

            this.moveBezier(right, downControl, start, () => {

                this.loopFlight();
            });
        });
    }

    moveBezier(p0: Vec3, p1: Vec3, p2: Vec3, callback?: Function) {
        let t = { value: 0 };

        tween(t)
            .to(1.2, { value: 1 }, {
                onUpdate: () => {
                    const x = (1 - t.value) * (1 - t.value) * p0.x +
                        2 * (1 - t.value) * t.value * p1.x +
                        t.value * t.value * p2.x;

                    const y = (1 - t.value) * (1 - t.value) * p0.y +
                        2 * (1 - t.value) * t.value * p1.y +
                        t.value * t.value * p2.y;

                    this.node.setPosition(new Vec3(x, y, 0));
                }
            })
            .call(() => callback && callback())
            .start();
    }
}