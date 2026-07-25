/**
 * @fileoverview Hook encapsulating camera stream events, bindings, and cleanups.
 */
import { useEffect, useRef } from "react";
import { useCameraStore } from "../stores/camera.store";
import { CameraService } from "../services/camera/camera.service";

export function useCamera() {
  const { activeDeviceId, setStreaming, setPermission, setDevices } = useCameraStore();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function initCamera() {
      const allowed = await CameraService.requestPermissions();
      setPermission(allowed);
      if (allowed) {
        const devices = await CameraService.getDevices();
        setDevices(devices);
        const stream = await CameraService.startStream(activeDeviceId);
        streamRef.current = stream;
        setStreaming(!!stream);
      }
    }
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        setStreaming(false);
      }
    };
  }, [activeDeviceId, setDevices, setPermission, setStreaming]);

  return { stream: streamRef.current };
}
