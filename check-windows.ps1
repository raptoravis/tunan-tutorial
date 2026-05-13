# check-windows.ps1
# tunan environment verifier (Windows / PowerShell) -- READ-ONLY.
# Verifies prerequisites + .claude/skills/ + workspace + MCPs.
# Does NOT install or copy anything. Run inside the target project.
#
# Workspace structure SSOT: see the pool structure section in .claude/skills/tunan-prime/SKILL.md.
# Keep the expected dir/file list below in sync with that section.
#
# Usage:
#   ./check-windows.ps1                              # check current directory
#   ./check-windows.ps1 -TargetPath D:\dev\my-proj   # check specified project

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$TargetPath = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
    chcp 65001 > $null
} catch {}

function Write-Info($msg)  { Write-Host "[INFO]  $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function Test-CommandExists($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

$script:Failures = 0
function Fail($msg) { Write-Err $msg; $script:Failures++ }

# -----------------------------------------------------------------
# 0. Target validation
# -----------------------------------------------------------------
Write-Info "===== Step 0/4: Target project ====="
if (-not (Test-Path -LiteralPath $TargetPath -PathType Container)) {
    Fail "Target path does not exist or is not a directory: $TargetPath"
    exit 1
}
$TargetPath = (Resolve-Path -LiteralPath $TargetPath).Path
Write-Info "Target project path: $TargetPath"

Push-Location -LiteralPath $TargetPath
try {
    $insideRepo = (git rev-parse --is-inside-work-tree 2>$null)
    if ($LASTEXITCODE -ne 0 -or $insideRepo -ne "true") {
        Fail "Target path is not a git repository: $TargetPath"
    } else {
        Write-Ok "Git repository initialized."
    }
    $remotes = git remote -v 2>$null
    if (-not $remotes) {
        Fail "Target repository has no remote configured."
    } elseif ($remotes -notmatch "github\.com") {
        Fail "Target repository remote does not point to github.com."
    } else {
        Write-Ok "GitHub remote configured."
    }
} finally {
    Pop-Location
}

# -----------------------------------------------------------------
# 1. Prerequisite CLIs
# -----------------------------------------------------------------
Write-Info "===== Step 1/4: Prerequisite CLIs ====="
$required = @("git", "node", "uv", "gh", "claude", "ruflo")
foreach ($c in $required) {
    if (Test-CommandExists $c) {
        Write-Ok "$c ready: $((Get-Command $c).Source)"
    } else {
        Fail "$c not installed."
    }
}

if (Test-CommandExists "node") {
    $nodeMajor = [int](((node --version) -replace 'v','').Split('.')[0])
    if ($nodeMajor -lt 18) {
        Fail "Node.js version too low (v$nodeMajor); requires >= 18."
    } else {
        Write-Ok "Node.js version OK (v$nodeMajor)."
    }
}

if (Test-CommandExists "gh") {
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Fail "GitHub CLI not logged in (run: gh auth login)."
    } else {
        Write-Ok "GitHub CLI logged in."
    }
}

# -----------------------------------------------------------------
# 2. MCP servers
# -----------------------------------------------------------------
Write-Info "===== Step 2/4: MCP servers ====="
if (Test-CommandExists "claude") {
    $finalMcp = claude mcp list 2>&1 | Out-String
    foreach ($name in @("memory", "context7", "playwright")) {
        if ($finalMcp -match [regex]::Escape($name)) {
            Write-Ok "MCP $name registered."
        } else {
            Fail "MCP $name not registered (run: claude mcp add $name -- npx -y <pkg>)."
        }
    }
} else {
    Fail "claude CLI missing; cannot verify MCP."
}

# -----------------------------------------------------------------
# 3. Skills + companion files
# -----------------------------------------------------------------
Write-Info "===== Step 3/4: Skills and companion files ====="
$skillsRoot = Join-Path $TargetPath ".claude\skills"
$expectedSkills = @(
    "tunan-req", "tunan-prd", "tunan-story", "tunan-plan", "tunan-testplan", "tunan-pr",
    "tunan-dev", "tunan-tdd", "tunan-review", "tunan-test",
    "tunan-pr-resolve", "tunan-merge", "tunan-verify",
    "tunan-triage", "tunan-diagnose", "tunan-retro", "tunan-improve-arch",
    "tunan-grill", "tunan-align", "tunan-takeover", "tunan-parallel-pick", "tunan-pipeline",
    "tunan-story-graph",
    "tunan-prime", "tunan-cp"
)
if (-not (Test-Path -LiteralPath $skillsRoot)) {
    Fail ".claude\skills\ missing in target."
} else {
    $missing = @()
    foreach ($s in $expectedSkills) {
        if (-not (Test-Path (Join-Path $skillsRoot "$s\SKILL.md"))) {
            $missing += $s
        }
    }
    if ($missing.Count -gt 0) {
        Fail "Missing skills ($($missing.Count)): $($missing -join ', ')"
    } else {
        Write-Ok "All $($expectedSkills.Count) tunan-* skills present."
    }
}

foreach ($f in @("USER.md", "tutorials")) {
    if (Test-Path (Join-Path $TargetPath $f)) {
        Write-Ok "$f present."
    } else {
        Fail "$f missing in target root."
    }
}

# -----------------------------------------------------------------
# 4. Workspace directories
# -----------------------------------------------------------------
Write-Info "===== Step 4/4: Workspace directories ====="
$workspaceRoot = Join-Path $TargetPath ".tunan-workspace"
if (-not (Test-Path $workspaceRoot)) {
    Fail ".tunan-workspace\ missing."
} else {
    Write-Ok ".tunan-workspace\ present."
    foreach ($d in @("worktrees", "retro", "raw-reqs", "sprints")) {
        if (Test-Path (Join-Path $workspaceRoot $d)) {
            Write-Ok ".tunan-workspace\$d present."
        } else {
            Fail ".tunan-workspace\$d missing."
        }
    }

    $wtGitignore = Join-Path $workspaceRoot "worktrees\.gitignore"
    if (Test-Path $wtGitignore) {
        Write-Ok ".tunan-workspace\worktrees\.gitignore present."
    } else {
        Fail ".tunan-workspace\worktrees\.gitignore missing (worktree contents must be gitignored)."
    }

    $settingsPath = Join-Path $workspaceRoot "settings.md"
    if (-not (Test-Path $settingsPath)) {
        Fail ".tunan-workspace\settings.md missing (defines current_sprint)."
    } else {
        $sprintLine = Select-String -LiteralPath $settingsPath -Pattern '^current_sprint:\s*(\S+)' | Select-Object -First 1
        if (-not $sprintLine) {
            Fail ".tunan-workspace\settings.md has no current_sprint field."
        } else {
            $currentSprint = $sprintLine.Matches[0].Groups[1].Value
            Write-Ok "settings.md current_sprint: $currentSprint"
            $sprintReqs = Join-Path $workspaceRoot "sprints\$currentSprint\reqs"
            if (Test-Path $sprintReqs) {
                Write-Ok ".tunan-workspace\sprints\$currentSprint\reqs\ present."
            } else {
                Fail ".tunan-workspace\sprints\$currentSprint\reqs\ missing (current sprint pool root)."
            }
            $rawSprint = Join-Path $workspaceRoot "raw-reqs\$currentSprint"
            if (Test-Path $rawSprint) {
                Write-Ok ".tunan-workspace\raw-reqs\$currentSprint\ present."
            } else {
                Fail ".tunan-workspace\raw-reqs\$currentSprint\ missing (raw-req inbox for current sprint; mirror of sprints\<current>\reqs\)."
            }
        }
    }
}

# -----------------------------------------------------------------
# Summary
# -----------------------------------------------------------------
Write-Host ""
if ($script:Failures -gt 0) {
    Write-Host "================================================================" -ForegroundColor Red
    Write-Err "$($script:Failures) check(s) failed. Run install-windows.ps1 to fix."
    Write-Host "================================================================" -ForegroundColor Red
    exit 1
} else {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Ok "All checks passed."
    Write-Host "================================================================" -ForegroundColor Green
}
