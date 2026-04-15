import React, { useEffect } from 'react';
import { useKYCStore } from '../../stores/kycStore';
import { Monitor } from 'lucide-react';

export default function DeviceFingerprint() {
  const { setDeviceMetadata } = useKYCStore();

  useEffect(() => {
    const meta = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory // in GB, may be undefined
    };
    setDeviceMetadata(meta);
  }, [setDeviceMetadata]);

  return null; // Side-effect only component
}
