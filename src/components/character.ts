import { Object3D, AnimationMixer, AnimationAction } from "three";
import { Component } from "../core/component";
export class Character extends Component {
    characterModel: Object3D;
    animationMixer: AnimationMixer;
    animationMap: Map<string, AnimationAction>;
    constructor(character: Object3D, animationMap: Map<string, any>) {
        super();
        this.characterModel = character;
        this.animationMap = animationMap;
        this.animationMixer = new AnimationMixer(this.characterModel);
        this.animationMap = new Map<string, AnimationAction>();
        for (const [key, value] of animationMap) {
            let clip = this.animationMixer.clipAction(value.animations[0]);
            if (!this.animationMap.get(key)) {
                this.animationMap.set(key, clip);
            }
        }
        this.playAnimation("Idle");
    }
    playAnimation(name: string) {
        if (this.animationMap.has(name)) {
            this.animationMap.get(name)!.reset().play();
        } else {
            console.log(`No animation ${name} found!`);
        }
    }
    stopAnimation() {
        this.animationMap.forEach(a => a.stop())
    }
    update(dt: number): void {
        this.animationMixer.update(dt);
    }
}
