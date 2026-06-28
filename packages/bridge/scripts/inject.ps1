param(
  [int]$X = 0,
  [int]$Y = 0,
  [string]$WindowTitle = '',
  [double]$XRatio = 0.72,
  [int]$FromBottom = 38,
  [switch]$UseAbsolute
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Drawing;
public struct WinPoint { public int X; public int Y; }
public class WinInput {
  [DllImport("user32.dll")]
  public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")]
  public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);
  [DllImport("user32.dll")]
  public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out WinRect rect);
  [DllImport("user32.dll")]
  public static extern IntPtr WindowFromPoint(WinPoint pt);
  [DllImport("user32.dll")]
  public static extern IntPtr GetAncestor(IntPtr hWnd, uint gaFlags);
  public const int LEFTDOWN = 0x02;
  public const int LEFTUP = 0x04;
  public const uint GA_ROOT = 2;
  public static void LeftClick() {
    mouse_event(LEFTDOWN, 0, 0, 0, 0);
    mouse_event(LEFTUP, 0, 0, 0, 0);
  }
  public static void ActivateWindow(IntPtr hWnd) {
    if (hWnd == IntPtr.Zero) return;
    if (IsIconic(hWnd)) {
      ShowWindow(hWnd, 9);
    }
    var fg = GetForegroundWindow();
    if (fg == hWnd) return;
    var fgThread = GetWindowThreadProcessId(fg, IntPtr.Zero);
    var targetThread = GetWindowThreadProcessId(hWnd, IntPtr.Zero);
    if (fgThread != 0 && targetThread != 0 && fgThread != targetThread) {
      AttachThreadInput(fgThread, targetThread, true);
      SetForegroundWindow(hWnd);
      AttachThreadInput(fgThread, targetThread, false);
    } else {
      SetForegroundWindow(hWnd);
    }
  }
  public static bool IsSameRootWindow(IntPtr a, IntPtr b) {
    if (a == IntPtr.Zero || b == IntPtr.Zero) return false;
    return GetAncestor(a, GA_ROOT) == GetAncestor(b, GA_ROOT);
  }
}
[StructLayout(LayoutKind.Sequential)]
public struct WinRect {
  public int Left; public int Top; public int Right; public int Bottom;
}
"@

function Get-TargetCursor {
  param([string]$Title)
  $candidates = Get-Process -Name Cursor -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero -and $_.MainWindowTitle }
  if ($Title) {
    $found = $candidates | Where-Object { $_.MainWindowTitle -like "*$Title*" } | Select-Object -First 1
    if ($found) { return $found }
  }
  return $candidates | Select-Object -First 1
}

function Get-ClickPoint {
  param($TargetHwnd, [double]$Ratio, [int]$BottomOffset, [int]$AbsX, [int]$AbsY, [bool]$Absolute)
  if ($Absolute) {
    return [WinPoint]@{ X = $AbsX; Y = $AbsY }
  }
  $rect = New-Object WinRect
  if (-not [WinInput]::GetWindowRect($TargetHwnd, [ref]$rect)) {
    throw 'Failed to read Cursor window bounds'
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 100 -or $height -lt 100) {
    throw 'Cursor window is too small'
  }
  $x = [int]($rect.Left + ($width * $Ratio))
  $y = [int]($rect.Bottom - $BottomOffset)
  return [WinPoint]@{ X = $x; Y = $y }
}

function Click-TargetInput {
  param($TargetHwnd, $Point)
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($Point.X, $Point.Y)
  Start-Sleep -Milliseconds 120
  $under = [WinInput]::WindowFromPoint($Point)
  if (-not [WinInput]::IsSameRootWindow($under, $TargetHwnd)) {
    throw 'Click target is outside Cursor window — check inputOffset'
  }
  [WinInput]::LeftClick()
  Start-Sleep -Milliseconds 180
}

$target = Get-TargetCursor -Title $WindowTitle
if (-not $target) {
  Write-Error 'Cursor window not found'
  exit 1
}

$hwnd = $target.MainWindowHandle
[WinInput]::ActivateWindow($hwnd)
Start-Sleep -Milliseconds 300

$point = Get-ClickPoint -TargetHwnd $hwnd -Ratio $XRatio -BottomOffset $FromBottom `
  -AbsX $X -AbsY $Y -Absolute:$UseAbsolute.IsPresent

Click-TargetInput -TargetHwnd $hwnd -Point $point

$fg = [WinInput]::GetForegroundWindow()
if ($fg -ne $hwnd) {
  [WinInput]::ActivateWindow($hwnd)
  Start-Sleep -Milliseconds 250
  Click-TargetInput -TargetHwnd $hwnd -Point $point
  $fg = [WinInput]::GetForegroundWindow()
}

if ($fg -ne $hwnd) {
  Write-Error 'Could not focus Cursor window'
  exit 1
}

[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 80
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
