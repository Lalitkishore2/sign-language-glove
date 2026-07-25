/**
 * @fileoverview Safe API endpoints layer to communicate with physical drivers or Bluetooth hardware.
 */

export const deviceApi = {
  /**
   * Scan WebBluetooth devices with GATT service characteristics.
   */
  async scanForGattDevice(serviceUUID: string): Promise<any> {
    if (!(navigator as any).bluetooth) {
      throw new Error("Web Bluetooth API not supported in this environment");
    }
    return await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: [serviceUUID] }],
    });
  },

  /**
   * Write data values directly to Bluetooth characteristic.
   */
  async writeCharacteristicValue(characteristic: any, buffer: ArrayBuffer): Promise<void> {
    await characteristic.writeValue(buffer);
  },
};
