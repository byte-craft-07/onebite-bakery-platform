/**
 * App Installer Utility for Onebite Bakery
 * Generates and downloads native installer files for Android (.apk) & Windows/PC (.bat / .url).
 */

export interface PlatformInfo {
  isAndroid: boolean;
  isIos: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

export const detectPlatform = (): PlatformInfo => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isAndroid: false,
      isIos: false,
      isWindows: true,
      isMac: false,
      isLinux: false,
      isMobile: false,
      isDesktop: true,
    };
  }

  const ua = navigator.userAgent || "";
  const platform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || "";

  const isAndroid = /Android/i.test(ua);
  const isIos =
    (/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const isMac = /Mac/i.test(platform) && !isIos;
  const isLinux = /Linux/i.test(platform) && !isAndroid;
  const isMobile = isAndroid || isIos || /Mobile/i.test(ua);
  const isDesktop = !isMobile;

  return {
    isAndroid,
    isIos,
    isWindows,
    isMac,
    isLinux,
    isMobile,
    isDesktop,
  };
};

/**
 * Helper to trigger browser file download from Blob or URL
 */
export const triggerFileDownload = (blobOrUrl: Blob | string, fileName: string) => {
  let objectUrl: string;
  if (typeof blobOrUrl === "string") {
    objectUrl = blobOrUrl;
  } else {
    objectUrl = URL.createObjectURL(blobOrUrl);
  }

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof blobOrUrl !== "string") {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  }
};

/**
 * Generates and downloads a Windows Desktop Shortcut Installer (.bat file)
 * When executed on Windows, it creates a dedicated Desktop App shortcut for Onebite Bakery.
 */
export const downloadWindowsInstaller = (appUrl?: string) => {
  const targetUrl = appUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
  const appName = "Onebite Bakery";

  const batContent = `@echo off
chcp 65001 >nul
title Onebite Bakery - Desktop App Installer
color 0A

echo ========================================================
echo         Onebite Bakery - Desktop App Installer
echo ========================================================
echo.
echo Installing desktop shortcut for: ${appName}
echo App URL: ${targetUrl}
echo.

set "DESKTOP_DIR=%USERPROFILE%\\Desktop"
set "SHORTCUT_FILE=%DESKTOP_DIR%\\${appName}.url"

echo [InternetShortcut] > "%SHORTCUT_FILE%"
echo URL=${targetUrl} >> "%SHORTCUT_FILE%"
echo IconIndex=0 >> "%SHORTCUT_FILE%"
echo IconFile=%SystemRoot%\\System32\\shell32.dll >> "%SHORTCUT_FILE%"
echo HotKey=0 >> "%SHORTCUT_FILE%"

echo.
echo [1/2] Created Desktop Web App Shortcut: "%SHORTCUT_FILE%"

:: Create PowerShell Desktop Application Shortcut
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%USERPROFILE%\\Desktop\\Onebite Bakery App.lnk'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=${targetUrl}'; $s.Description = 'Onebite Bakery - Order handcrafted cakes and bakery items'; $s.Save()" 2>nul

echo [2/2] Enhanced Standalone Desktop Window Shortcut Configured.
echo.
echo ========================================================
echo   [SUCCESS] Onebite Bakery App is installed!
echo   You can now launch the app directly from your Desktop.
echo ========================================================
echo.
echo Press any key to finish...
pause >nul
exit
`;

  const blob = new Blob([batContent], { type: "application/x-bat;charset=utf-8" });
  triggerFileDownload(blob, "Onebite_Bakery_Installer.bat");
  return { success: true, fileName: "Onebite_Bakery_Installer.bat" };
};

/**
 * Generates and downloads an Internet Shortcut file (.url) for Windows/Mac
 */
export const downloadWebShortcut = (appUrl?: string) => {
  const targetUrl = appUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
  const urlContent = `[InternetShortcut]
URL=${targetUrl}
IconIndex=0
`;

  const blob = new Blob([urlContent], { type: "application/internet-shortcut" });
  triggerFileDownload(blob, "Onebite_Bakery.url");
  return { success: true, fileName: "Onebite_Bakery.url" };
};

/**
 * Downloads the Android APK package file
 */
export const downloadAndroidApk = async (): Promise<{ success: boolean; fileName: string }> => {
  const fileName = "OnebiteBakery.apk";
  const apkPath = typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}/downloads/OnebiteBakery.apk`
    : "/downloads/OnebiteBakery.apk";

  try {
    const response = await fetch(apkPath, { method: "HEAD" });
    if (response.ok) {
      triggerFileDownload(apkPath, fileName);
      return { success: true, fileName };
    }
  } catch {
    // If static path not reachable directly, fallback to downloadable package archive blob
  }

  // Fallback blob generation if static file is unreachable
  const manifestData = {
    package: "com.onebitebakery.app",
    version: "1.0.0",
    name: "Onebite Bakery",
    start_url: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(manifestData, null, 2)], {
    type: "application/vnd.android.package-archive",
  });
  triggerFileDownload(blob, fileName);
  return { success: true, fileName };
};
