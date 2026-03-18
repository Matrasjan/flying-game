import { _decorator, Component, Node , Vec3 , tween} from 'cc';
const { ccclass } = _decorator;

@ccclass('MMController')
export class MMController extends Component {
    start() {
        this.startFlight();
    }

    startFlight() {
        const start = this.node.position.clone();

        const end = new Vec3(start.x + 500, start.y, 0);
        const control = new Vec3(start.x + 250, start.y + 200, 0);

        let t = { value: 0 };

        tween(t)
            .to(2, { value: 1 }, {
                onUpdate: () => {
                    const x = (1 - t.value) * (1 - t.value) * start.x +
                        2 * (1 - t.value) * t.value * control.x +
                        t.value * t.value * end.x;

                    const y = (1 - t.value) * (1 - t.value) * start.y +
                        2 * (1 - t.value) * t.value * control.y +
                        t.value * t.value * end.y;

                    this.node.setPosition(new Vec3(x, y, 0));
                }
            })
            .start();
    }
}

