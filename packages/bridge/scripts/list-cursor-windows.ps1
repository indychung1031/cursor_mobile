# Cursor 프로세스의 모든 최상위 창 제목 (MainWindowTitle만으로는 1개만 잡히는 Electron 특성 대응)
$ErrorActionPreference = 'Stop'

Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class CursorWindowEnum {
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

  const uint GW_OWNER = 4;

  static HashSet<uint> cursorPids = new HashSet<uint>();
  static List<string> titles = new List<string>();

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
    if (!titles.Contains(title)) titles.Add(title);
    return true;
  }

  public static string[] ListTitles() {
    cursorPids.Clear();
    titles.Clear();
    foreach (var p in System.Diagnostics.Process.GetProcessesByName("Cursor")) {
      cursorPids.Add((uint)p.Id);
    }
    EnumWindows(Callback, IntPtr.Zero);
    titles.Sort(StringComparer.OrdinalIgnoreCase);
    return titles.ToArray();
  }
}
"@

$titles = [CursorWindowEnum]::ListTitles()
$encoded = @($titles | ForEach-Object {
  [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_))
})
if ($encoded.Count -eq 0) {
  '[]'
} else {
  $encoded | ConvertTo-Json -Compress
}
