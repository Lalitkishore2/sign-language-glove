/**
 * @fileoverview Temporal buffer for accumulating feature frames before sending them for inference.
 */

export class FrameBuffer {
  private buffer: number[][] = [];
  private readonly minFrames: number;

  constructor(minFrames: number = 16) {
    this.minFrames = minFrames;
  }

  /**
   * Pushes a new frame into the buffer.
   * @param frame The 1D feature array representing the frame.
   * @returns The buffer array if it has reached minFrames, otherwise null.
   */
  push(frame: number[]): number[][] | null {
    // Only buffer frames that have non-zero features (i.e., hands are detected)
    const hasData = frame.some((val) => val !== 0);
    
    if (hasData) {
      this.buffer.push(frame);
    } else if (this.buffer.length > 0) {
      // If hands disappear, clear buffer to avoid recognizing fragmented gestures
      this.clear();
    }

    if (this.buffer.length >= this.minFrames) {
      // We have reached the minimum required frames for an inference chunk
      // We take a copy of the buffer up to maxFrames, and slide the window
      const sequence = [...this.buffer];
      
      // Slide the window (overlap by half) to maintain temporal continuity
      const slideAmount = Math.max(1, Math.floor(this.minFrames / 2));
      this.buffer = this.buffer.slice(slideAmount);
      
      return sequence;
    }

    return null;
  }

  clear() {
    this.buffer = [];
  }

  get length() {
    return this.buffer.length;
  }
}
