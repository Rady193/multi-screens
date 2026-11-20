# SCAFFApps spell helper: Windows' own spell checker, for Fix spelling in a SCAFFApps app's text boxes.
# The same file in every SCAFFApps Electron app (master: SCAFFApps Brand\apps\windows); started by
# scaffapps-spelling-main.js on first use and kept running while it is used. Nothing leaves the computer.
#
# Reads one command per line on standard input and answers each with one line of JSON on standard output:
#
#   spell <languages> <base64>   the spelling mistakes in a text (UTF-8, in base64: it may hold line breaks), by the
#                 first of the languages ("en-GB,ar") Windows has a dictionary for, else US English; a word another of
#                 the languages knows is no mistake. Each: start and length (in UTF-16 units, as JavaScript counts),
#                 and what Windows would do: "replace" (sure: its autocorrect list, teh -> the), "delete" (a word
#                 written twice) or "suggest" (only guesses, up to five)
#   quit
#
# The checker is the one that underlines mistakes in red in the apps' windows (Chromium uses it on Windows), with
# the words added to its dictionary. Windows 8 and later (spellcheck.h).
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using IEnumString = System.Runtime.InteropServices.ComTypes.IEnumString;

[ComImport, Guid("8E018A9D-2415-4677-BF08-794EA61F94BB"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IScaffSpellFactory {
  IEnumString SupportedLanguages { get; }
  int IsSupported([MarshalAs(UnmanagedType.LPWStr)] string languageTag);
  IScaffSpellChecker CreateSpellChecker([MarshalAs(UnmanagedType.LPWStr)] string languageTag);
}

[ComImport, Guid("B6FD0B71-E2BC-4653-8D05-F197E412770B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IScaffSpellChecker {
  string LanguageTag { [return: MarshalAs(UnmanagedType.LPWStr)] get; }
  IScaffSpellErrors Check([MarshalAs(UnmanagedType.LPWStr)] string text);
  IEnumString Suggest([MarshalAs(UnmanagedType.LPWStr)] string word);
  // (The rest of the interface, in its order, though only ComprehensiveCheck is used.)
  void Add([MarshalAs(UnmanagedType.LPWStr)] string word);
  void Ignore([MarshalAs(UnmanagedType.LPWStr)] string word);
  void AutoCorrect([MarshalAs(UnmanagedType.LPWStr)] string from, [MarshalAs(UnmanagedType.LPWStr)] string to);
  byte GetOptionValue([MarshalAs(UnmanagedType.LPWStr)] string optionId);
  IEnumString OptionIds { get; }
  string Id { [return: MarshalAs(UnmanagedType.LPWStr)] get; }
  string LocalizedName { [return: MarshalAs(UnmanagedType.LPWStr)] get; }
  uint AddSpellCheckerChanged(IntPtr handler);
  void RemoveSpellCheckerChanged(uint cookie);
  IntPtr GetOptionDescription([MarshalAs(UnmanagedType.LPWStr)] string optionId);
  IScaffSpellErrors ComprehensiveCheck([MarshalAs(UnmanagedType.LPWStr)] string text);
}

[ComImport, Guid("803E3BD4-2828-4410-8290-418D1D73C762"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IScaffSpellErrors {
  [PreserveSig] int Next(out IScaffSpellError value);
}

[ComImport, Guid("B7C82D61-FBE8-4B47-9B27-6C0D2E0DE0A3"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IScaffSpellError {
  uint StartIndex { get; }
  uint Length { get; }
  int CorrectiveAction { get; }     // 1 suggestions, 2 replace, 3 delete
  string Replacement { [return: MarshalAs(UnmanagedType.LPWStr)] get; }
}

[ComImport, Guid("7AB36653-1796-484B-BDFA-E74F1DB7C1DC")]
public class ScaffSpellFactoryClass { }

public class ScaffMistake {
  public int Start; public int Length; public string Action; public string Replacement; public string[] Suggestions;
}

public static class ScaffSpell {
  static IScaffSpellFactory factory;
  static readonly Dictionary<string, IScaffSpellChecker> checkers = new Dictionary<string, IScaffSpellChecker>();

  // The checker for one language, or null when Windows has no dictionary for it.
  static IScaffSpellChecker For(string lang) {
    IScaffSpellChecker c;
    if (checkers.TryGetValue(lang, out c)) return c;
    if (factory == null) factory = (IScaffSpellFactory)new ScaffSpellFactoryClass();
    c = factory.IsSupported(lang) != 0 ? factory.CreateSpellChecker(lang) : null;
    checkers[lang] = c;
    return c;
  }

  static List<string> Strings(IEnumString e, int max) {
    var list = new List<string>();
    if (e == null) return list;
    var one = new string[1];
    while (list.Count < max && e.Next(1, one, IntPtr.Zero) == 0) list.Add(one[0]);
    return list;
  }

  static List<IScaffSpellError> Errors(IScaffSpellErrors e) {
    var list = new List<IScaffSpellError>();
    IScaffSpellError one;
    while (e != null && e.Next(out one) == 0 && one != null) list.Add(one);
    return list;
  }

  // Null when Windows can check none of the languages. `used`: the language checked.
  public static List<ScaffMistake> Check(string text, string[] langs, out string used) {
    used = "";
    var all = new List<IScaffSpellChecker>();
    foreach (var l in langs) {
      var c = string.IsNullOrWhiteSpace(l) ? null : For(l.Trim());
      if (c != null) { all.Add(c); if (used == "") used = l.Trim(); }
    }
    if (all.Count == 0) { var us = For("en-US"); if (us != null) { all.Add(us); used = "en-US"; } }
    if (all.Count == 0) return null;
    var found = new List<ScaffMistake>();
    foreach (var e in Errors(all[0].ComprehensiveCheck(text))) {
      int start = (int)e.StartIndex, length = (int)e.Length;
      if (start < 0 || length < 0 || start + length > text.Length) continue;
      string word = text.Substring(start, length);
      bool known = false;
      for (int i = 1; i < all.Count && !known; i++) known = Errors(all[i].Check(word)).Count == 0;
      if (known) continue;
      int action = e.CorrectiveAction;
      found.Add(new ScaffMistake {
        Start = start, Length = length,
        Action = action == 2 ? "replace" : action == 3 ? "delete" : "suggest",
        Replacement = action == 2 ? (e.Replacement ?? "") : "",
        Suggestions = action == 1 ? Strings(all[0].Suggest(word), 5).ToArray() : new string[0],
      });
    }
    return found;
  }
}
'@

function Get-Spelling([string]$langs, [string]$b64) {
  $text = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
  $used = ''
  $list = [ScaffSpell]::Check($text, ($langs -split ','), [ref]$used)
  if ($null -eq $list) { return @{ error = 'Windows has no spell checker for this language' } }
  [ordered]@{
    language = $used
    mistakes = @($list | ForEach-Object {
      [ordered]@{ start = $_.Start; length = $_.Length; action = $_.Action; replacement = $_.Replacement; suggestions = @($_.Suggestions) }
    })
  }
}

[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $line = $line.Trim()
  try {
    if ($line -match '^spell ([A-Za-z0-9,-]+) ([A-Za-z0-9+/=]+)$') { $out = Get-Spelling $Matches[1] $Matches[2] }
    elseif ($line -eq 'quit') { break }
    else { $out = @{ error = 'unknown command' } }
  } catch {
    $out = @{ error = "$($_.Exception.Message)" }
  }
  [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress -Depth 4))
  [Console]::Out.Flush()
}
