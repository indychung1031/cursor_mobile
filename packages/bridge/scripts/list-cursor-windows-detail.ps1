# Cursor 최상위 창: 제목 + 화면 좌표 (inject·모니터 매칭용)
$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class CursorWindowDetail {
  public string Title;
  public int Left;
  public int Top;
  public int Right;
  public int Bottom;
}

public static class CursorWindowDetailEnum {
  delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")]
  static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

  [DllImport("user32.dll")]
  static extern int GetWindowTextLength(IntPtr hWnd);

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

  [DllImport("user32.dll")]
  static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

  [DllImport("user32.dll")]
  static extern bool IsWindowVisible(IntPtr hWnd);

  [DllImport("user32.dll")]
  static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

  [DllImport("user32.dll")]
  static extern bool GetWindowRect(IntPtr hWnd, out WinRect rect);

  const uint GW_OWNER = 4;

  [StructLayout(LayoutKind.Sequential)]
  public struct WinRect {
    public int Left; public int Top; public int Right; public int Bottom;
  }

  static HashSet<uint> cursorPids = new HashSet<uint>();
  static List<CursorWindowDetail> windows = new List<CursorWindowDetail>();

  static bool Callback(IntPtr hWnd, IntPtr lParam) {
    if (!IsWindowVisible(hWnd)) return true;
    if (GetWindow(hWnd, GW_OWNER) != IntPtr.Zero) return true;

    uint pid;
    GetWindowThreadProcessId(hWnd, out pid);
    if (!cursorPids.Contains(pid)) return true;

    int len = GetWindowTextLength(hWnd);
    if (len <= 0) return true;

    var sb = new StringBuilder(len + 1);
    GetWindowText(hWnd, sb, sb.Capacity);
    string title = sb.ToString().Trim();
    if (title.Length == 0) return true;

    WinRect rect;
    if (!GetWindowRect(hWnd, out rect)) return true;

    foreach (var w in windows) {
      if (w.Title == title) return true;
    }

    windows.Add(new CursorWindowDetail {
      Title = title,
      Left = rect.Left,
      Top = rect.Top,
      Right = rect.Right,
      Bottom = rect.Bottom
    });
    return true;
  }

  public static CursorWindowDetail[] List() {
    cursorPids.Clear();
    windows.Clear();
    foreach (var p in System.Diagnostics.Process.GetProcessesByName("Cursor")) {
      cursorPids.Add((uint)p.Id);
    }
    EnumWindows(Callback, IntPtr.Zero);
    windows.Sort((a, b) => StringComparer.OrdinalIgnoreCase.Compare(a.Title, b.Title));
    return windows.ToArray();
  }
}
"@

$items = [CursorWindowDetailEnum]::List() | ForEach-Object {
  @{
    titleB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_.Title))
    left     = $_.Left
    top      = $_.Top
    right    = $_.Right
    bottom   = $_.Bottom
  }
}

if ($items.Count -eq 0) {
  '[]'
} else {
  $items | ConvertTo-Json -Compress
}
