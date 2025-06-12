import { Component } from "../core/component";

export class ScoreBoardComponent extends Component {
  private score = 0;
  private best = 0;
  private overlay!: HTMLDivElement;
  private msgDiv!: HTMLDivElement;

  start() {
    // Score display (top-right)
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '24px',
      textAlign: 'right',
      pointerEvents: 'none'
    });
    this.overlay.textContent = 'Score: 0  Best: 0';
    document.body.appendChild(this.overlay);

    // Game-over message (center)
    this.msgDiv = document.createElement('div');
    Object.assign(this.msgDiv.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#ff8080',
      fontFamily: 'monospace',
      fontSize: '32px',
      textAlign: 'center',
      pointerEvents: 'none',
      display: 'none'
    });
    document.body.appendChild(this.msgDiv);
  }

  /** Call every frame to accumulate score */
  increment(dt: number) {
    this.score += dt;
    this.updateOverlay();
  }

  /** Show game-over message and update best */
  gameOver() {
    if (this.score > this.best) this.best = this.score;
    this.msgDiv.textContent = 'GAME OVER – press SPACE to restart';
    this.msgDiv.style.display = 'block';
  }

  /** Reset score for a new run */
  reset() {
    this.score = 0;
    this.msgDiv.style.display = 'none';
    this.msgDiv.textContent = '';
    this.updateOverlay();
  }

  private updateOverlay() {
    this.overlay.textContent = `Score: ${Math.floor(this.score)}  Best: ${Math.floor(this.best)}`;
  }

  dispose() {
    document.body.removeChild(this.overlay);
    document.body.removeChild(this.msgDiv);
  }
} 