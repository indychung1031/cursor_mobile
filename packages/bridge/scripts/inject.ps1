param(
  [int]$X = 0,
  [int]$Y = 0,
  [string]$WindowTitle = '',
  [double]$XRatio = 0.72,
  [int]$FromBottom = 38,
  [switch]$UseAbsolute,
  [int]$DisplayLeft = 0,
  [int]$DisplayTop = 0,
  [int]$DisplayRight = 0,
  [int]$DisplayBottom = 0,
  [switch]$DryRun,
  [switch]$FocusOnly,
  [switch]$MinimizeOthers,
  [switch]$ScrollOnly,
  [int]$DeltaY = -240,
  [ValidateSet('wheel', 'page', 'home', 'end')]
  [string]$ScrollMode = 'wheel',
  [double]$ScrollYRatio = 0.45
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Drawing;

public struct WinPoint { public int X; public int Y; }

public class CursorInjectWindow {
  public IntPtr Hwnd;
  public string Title;
  public int Left, Top, Right, Bottom;
}

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
  public const int WHEEL = 0x0800;
  public const uint GA_ROOT = 2;
  public static void LeftClick() {
    mouse_event(LEFTDOWN, 0, 0, 0, 0);
    mouse_event(LEFTUP, 0, 0, 0, 0);
  }
  public static void MouseWheelDelta(int delta) {
    mouse_event(WHEEL, 0, 0, delta, 0);
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

public static class CursorInjectEnum {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out WinRect rect);
  const uint GW_OWNER = 4;
  static HashSet<uint> pids = new HashSet<uint>();
  static List<CursorInjectWindow> list = new List<CursorInjectWindow>();
  static bool Callback(IntPtr hWnd, IntPtr lParam) {
    if (!IsWindowVisible(hWnd)) return true;
    if (GetWindow(hWnd, GW_OWNER) != IntPtr.Zero) return true;
    uint pid; GetWindowThreadProcessId(hWnd, out pid);
    if (!pids.Contains(pid)) return true;
    int len = GetWindowTextLength(hWnd);
    if (len <= 0) return true;
    var sb = new StringBuilder(len + 1);
    GetWindowText(hWnd, sb, sb.Capacity);
    string title = sb.ToString().Trim();
    if (title.Length == 0) return true;
    WinRect rect;
    if (!GetWindowRect(hWnd, out rect)) return true;
    foreach (var w in list) { if (w.Title == title) return true; }
    list.Add(new CursorInjectWindow {
      Hwnd = hWnd, Title = title,
      Left = rect.Left, Top = rect.Top, Right = rect.Right, Bottom = rect.Bottom
    });
    return true;
  }
  public static CursorInjectWindow[] ListWindows() {
    pids.Clear(); list.Clear();
    foreach (var p in System.Diagnostics.Process.GetProcessesByName("Cursor")) { pids.Add((uint)p.Id); }
    EnumWindows(Callback, IntPtr.Zero);
    return list.ToArray();
  }
}
"@

function Test-WindowOnDisplay {
  param($Rect, [int]$DispLeft, [int]$DispTop, [int]$DispRight, [int]$DispBottom)
  if ($DispRight -le $DispLeft -or $DispBottom -le $DispTop) { return $true }
  $cx = [int](($Rect.Left + $Rect.Right) / 2)
  $cy = [int](($Rect.Top + $Rect.Bottom) / 2)
  return ($cx -ge $DispLeft -and $cx -lt $DispRight -and $cy -ge $DispTop -and $cy -lt $DispBottom)
}

function Get-TargetCursor {
  param(
    [string]$Title,
    [int]$DispLeft,
    [int]$DispTop,
    [int]$DispRight,
    [int]$DispBottom
  )
  $all = [CursorInjectEnum]::ListWindows()
  if ($all.Count -eq 0) { return $null }

  $useDisplay = ($DispRight -gt $DispLeft -and $DispBottom -gt $DispTop)
  $onDisplay = @($all | Where-Object {
    Test-WindowOnDisplay -Rect $_ -DispLeft $DispLeft -DispTop $DispTop -DispRight $DispRight -DispBottom $DispBottom
  })

  if ($useDisplay) {
    if ($onDisplay.Count -eq 0) { return $null }
    $pool = $onDisplay
  } else {
    $pool = @($all)
  }

  if ($Title) {
    $found = @($pool | Where-Object { $_.Title -like "*$Title*" })
    if ($found.Count -gt 0) {
      return [PSCustomObject]@{ MainWindowHandle = $found[0].Hwnd; MainWindowTitle = $found[0].Title }
    }
  }

  if ($pool.Count -gt 0) {
    return [PSCustomObject]@{ MainWindowHandle = $pool[0].Hwnd; MainWindowTitle = $pool[0].Title }
  }
  return $null
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

function Get-ScrollPoint {
  param($TargetHwnd, [double]$RatioX, [double]$RatioY)
  $rect = New-Object WinRect
  if (-not [WinInput]::GetWindowRect($TargetHwnd, [ref]$rect)) {
    throw 'Failed to read Cursor window bounds'
  }
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  if ($width -lt 100 -or $height -lt 100) {
    throw 'Cursor window is too small'
  }
  $x = [int]($rect.Left + ($width * $RatioX))
  $y = [int]($rect.Top + ($height * $RatioY))
  return [WinPoint]@{ X = $x; Y = $y }
}

function Invoke-ScrollAtPoint {
  param($TargetHwnd, $Point, [int]$DeltaY, [string]$Mode)
  [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($Point.X, $Point.Y)
  Start-Sleep -Milliseconds 120
  $under = [WinInput]::WindowFromPoint($Point)
  if (-not [WinInput]::IsSameRootWindow($under, $TargetHwnd)) {
    throw 'Scroll target is outside Cursor window'
  }
  [WinInput]::LeftClick()
  Start-Sleep -Milliseconds 150
  switch ($Mode) {
    'page' {
      if ($DeltaY -lt 0) {
        [System.Windows.Forms.SendKeys]::SendWait('{PGUP}')
      } else {
        [System.Windows.Forms.SendKeys]::SendWait('{PGDN}')
      }
    }
    'home' { [System.Windows.Forms.SendKeys]::SendWait('^{HOME}') }
    'end' { [System.Windows.Forms.SendKeys]::SendWait('^{END}') }
    default { [WinInput]::MouseWheelDelta($DeltaY) }
  }
  Start-Sleep -Milliseconds 80
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

function Minimize-OtherWindows {
  param([IntPtr]$KeepHwnd)
  $keepRoot = [WinInput]::GetAncestor($KeepHwnd, [WinInput]::GA_ROOT)
  Get-Process | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | ForEach-Object {
    $h = $_.MainWindowHandle
    if ($h -eq $KeepHwnd) { return }
    $root = [WinInput]::GetAncestor($h, [WinInput]::GA_ROOT)
    if ($root -eq $keepRoot) { return }
    [void][WinInput]::ShowWindow($h, 6)
  }
}

$target = Get-TargetCursor -Title $WindowTitle -DispLeft $DisplayLeft -DispTop $DisplayTop `
  -DispRight $DisplayRight -DispBottom $DisplayBottom
if (-not $target) {
  Write-Error 'Cursor window not found on selected display'
  exit 1
}

$hwnd = $target.MainWindowHandle

if ($ScrollOnly) {
  $scrollPoint = Get-ScrollPoint -TargetHwnd $hwnd -RatioX $XRatio -RatioY $ScrollYRatio
  [WinInput]::ActivateWindow($hwnd)
  Start-Sleep -Milliseconds 300
  Invoke-ScrollAtPoint -TargetHwnd $hwnd -Point $scrollPoint -DeltaY $DeltaY -Mode $ScrollMode
  exit 0
}

$point = Get-ClickPoint -TargetHwnd $hwnd -Ratio $XRatio -BottomOffset $FromBottom `
  -AbsX $X -AbsY $Y -Absolute:$UseAbsolute.IsPresent

if ($DryRun) {
  $rect = New-Object WinRect
  [void][WinInput]::GetWindowRect($hwnd, [ref]$rect)
  @{
    ok = $true
    windowTitle = $target.MainWindowTitle
    hwnd = $hwnd.ToInt64()
    click = @{ x = $point.X; y = $point.Y }
    windowRect = @{
      left = $rect.Left; top = $rect.Top; right = $rect.Right; bottom = $rect.Bottom
    }
    displayFilter = @{
      left = $DisplayLeft; top = $DisplayTop; right = $DisplayRight; bottom = $DisplayBottom
    }
  } | ConvertTo-Json -Compress
  exit 0
}

if ($MinimizeOthers) {
  Minimize-OtherWindows -KeepHwnd $hwnd
  Start-Sleep -Milliseconds 150
}

$focused = $false
$maxAttempts = 4
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  [WinInput]::ActivateWindow($hwnd)
  Start-Sleep -Milliseconds 350
  try {
    Click-TargetInput -TargetHwnd $hwnd -Point $point
  } catch {
    if ($attempt -ge $maxAttempts) { throw }
    Start-Sleep -Milliseconds 450
    continue
  }
  $fg = [WinInput]::GetForegroundWindow()
  if ($fg -eq $hwnd) {
    $focused = $true
    break
  }
  if ($attempt -ge $maxAttempts) {
    Write-Error 'Could not focus Cursor window (another app may be covering it — close popup and retry)'
    exit 1
  }
  Start-Sleep -Milliseconds 400
}

if (-not $focused) {
  Write-Error 'Could not focus Cursor window'
  exit 1
}

if ($FocusOnly) {
  exit 0
}

[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 80
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
