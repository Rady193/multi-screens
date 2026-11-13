# Lists the connected monitors and their physical sizes, for Multi Screens.
# Two sources are printed; the app combines them:
#   GDI  lines: device | left | top | width | height | mm wide | mm high | primary(1/0)
#   EDID lines: native width px | native height px | mm wide | mm high | cm wide | cm high
# The EDID figures come from the monitor's own data block and are in millimetres,
# which is more precise than the whole centimetres Windows reports elsewhere.
$ErrorActionPreference = 'SilentlyContinue'

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class MsDisplays {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct MONITORINFOEX {
    public int cbSize; public RECT rcMonitor; public RECT rcWork; public uint dwFlags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string szDevice;
  }
  public delegate bool MonitorEnumProc(IntPtr hMon, IntPtr hdc, ref RECT r, IntPtr data);
  [DllImport("user32.dll")] static extern bool EnumDisplayMonitors(IntPtr hdc, IntPtr clip, MonitorEnumProc cb, IntPtr data);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern bool GetMonitorInfo(IntPtr hMon, ref MONITORINFOEX mi);
  [DllImport("gdi32.dll", CharSet = CharSet.Unicode)] static extern IntPtr CreateDC(string drv, string dev, string o, IntPtr dm);
  [DllImport("gdi32.dll")] static extern int GetDeviceCaps(IntPtr hdc, int index);
  [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr hdc);
  public static List<string> List() {
    var result = new List<string>();
    EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, delegate(IntPtr h, IntPtr d, ref RECT r, IntPtr p) {
      var mi = new MONITORINFOEX();
      mi.cbSize = Marshal.SizeOf(typeof(MONITORINFOEX));
      if (GetMonitorInfo(h, ref mi)) {
        int mmW = 0, mmH = 0;
        IntPtr dc = CreateDC(null, mi.szDevice, null, IntPtr.Zero);
        if (dc != IntPtr.Zero) { mmW = GetDeviceCaps(dc, 4); mmH = GetDeviceCaps(dc, 6); DeleteDC(dc); }
        result.Add(mi.szDevice + "|" + mi.rcMonitor.L + "|" + mi.rcMonitor.T + "|" + (mi.rcMonitor.R - mi.rcMonitor.L) + "|" + (mi.rcMonitor.B - mi.rcMonitor.T) + "|" + mmW + "|" + mmH + "|" + (mi.dwFlags & 1));
      }
      return true;
    }, IntPtr.Zero);
    return result;
  }
}
"@

foreach ($line in [MsDisplays]::List()) { "GDI|$line" }

Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorDescriptorMethods | ForEach-Object {
  $block = (Invoke-CimMethod -InputObject $_ -MethodName WmiGetMonitorRawEEdidV1Block -Arguments @{ BlockId = [byte]0 }).BlockContent
  if ($block -and $block.Count -ge 128) {
    # First detailed timing descriptor starts at byte 54.
    # The values are 12 bits wide; work in [int] so the high bits are not lost.
    $pxW = [int]$block[56] + (([int]$block[58] -shr 4) -shl 8)
    $pxH = [int]$block[59] + (([int]$block[61] -shr 4) -shl 8)
    $mmW = [int]$block[66] + (([int]$block[68] -shr 4) -shl 8)
    $mmH = [int]$block[67] + (([int]$block[68] -band 15) -shl 8)
    "EDID|$pxW|$pxH|$mmW|$mmH|$($block[21])|$($block[22])"
  }
}
