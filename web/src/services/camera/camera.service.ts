/**
 * @fileoverview Service for camera stream controls and operations.
 * Components must interface with this rather than checking hardware/navigator directly.
 */

export class CameraService {
  private static currentStream: MediaStream | null = null;
  private static isPaused: boolean = false;

  /**
   * Request user permission to access camera devices.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log("Camera initializing...");
      console.log("Camera permission requested");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      console.log("Camera permission granted");
      return true;
    } catch (err) {
      console.error("Camera permission denied", err);
      return false;
    }
  }

  /**
   * Enumerate available video inputs.
   */
  static async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput");
    } catch (err) {
      console.error("Failed to enumerate devices", err);
      return [];
    }
  }

  /**
   * Start stream from a selected device.
   */
  static async startStream(deviceId?: string | null): Promise<MediaStream> {
    if (this.currentStream) {
      this.stopStream();
    }

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 },
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      audio: false,
    };

    console.log("Camera initializing...");
    console.log("Camera permission requested");

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      this.isPaused = false;
      console.log("Camera permission granted");
      console.log("Camera stream started");
      return stream;
    } catch (err: any) {
      console.error("Camera failed to start:", err.message);
      // Explicitly throw so UI can catch and display errors
      throw err;
    }
  }

  /**
   * Stop the active stream.
   */
  static stopStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
      console.log("Camera stopped");
    }
    this.isPaused = false;
  }

  /**
   * Temporarily pause or resume the stream by toggling track enabled state.
   */
  static togglePause(pause?: boolean): boolean {
    if (this.currentStream) {
      const videoTrack = this.currentStream.getVideoTracks()[0];
      if (videoTrack) {
        this.isPaused = pause !== undefined ? pause : !this.isPaused;
        videoTrack.enabled = !this.isPaused;
        return this.isPaused;
      }
    }
    return false;
  }
}
