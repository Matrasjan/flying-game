import { _decorator, Component, Node, Graphics, Vec3, Color, UITransform, Label, director, Canvas } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScatteredLayer')
export class ScatteredLayer extends Component {

    @property({ tooltip: 'Total number of candies' })
    count: number = 20;

    @property({ tooltip: 'Candy radius in px' })
    radius: number = 14;

    start() {
        this.spawnCandies();
    }

    private spawnCandies() {
        const scene = director.getScene();
        const canvas = scene.getComponentInChildren(Canvas);
        const { width, height } = canvas.getComponent(UITransform).contentSize;

        for (let i = 0; i < this.count; i++) {
            const isGreen = Math.random() < 0.1;
            const x = Math.random() * width - width / 2;
            const y = Math.random() * height - height / 2;
            this.createCandy(x, y, isGreen);
        }
    }

    private createCandy(x: number, y: number, isGreen: boolean) {
        const node = new Node('candy');
        node.layer = this.node.layer;
        this.node.addChild(node);
        node.setPosition(new Vec3(x, y, 0));

        node.addComponent(UITransform).setContentSize(this.radius * 2, this.radius * 2);

        const g = node.addComponent(Graphics);
        const color = isGreen ? new Color(72, 199, 89, 255) : new Color(255, 213, 0, 255);

        // filled circle
        g.fillColor = color;
        g.circle(0, 0, this.radius);
        g.fill();

        // white border
        g.strokeColor = new Color(255, 255, 255, 120);
        g.lineWidth = 1.5;
        g.circle(0, 0, this.radius);
        g.stroke();

        // 'm' label
        const labelNode = new Node('lbl');
        labelNode.layer = this.node.layer;
        node.addChild(labelNode);
        labelNode.addComponent(UITransform);
        const label = labelNode.addComponent(Label);
        label.string = 'm';
        label.fontSize = Math.round(this.radius * 0.9);
        label.color = new Color(255, 255, 255, 200);
    }
}
