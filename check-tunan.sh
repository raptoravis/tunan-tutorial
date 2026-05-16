#!/usr/bin/env bash
# check-tunan.sh
# tunan environment verifier (macOS / Linux / bash) -- READ-ONLY.
# Verifies prerequisites + .claude/skills/ + workspace + MCPs.
# Does NOT install or copy anything. Run inside the target project.
#
# Workspace structure SSOT: see the pool structure section in .claude/skills/tunan-prime/SKILL.md.
# Keep the expected dir/file list below in sync with that section.
#
# Usage:
#   ./check-tunan.sh                       # check current directory
#   ./check-tunan.sh /path/to/my-proj      # check specified project

set -uo pipefail

TARGET_PATH="${1:-$PWD}"

if [ -t 1 ]; then
    C_CYAN='\033[36m'; C_GREEN='\033[32m'; C_YELLOW='\033[33m'; C_RED='\033[31m'; C_OFF='\033[0m'
else
    C_CYAN=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_OFF=''
fi
info(){ printf "${C_CYAN}[INFO]  %s${C_OFF}\n" "$*"; }
ok(){   printf "${C_GREEN}[OK]    %s${C_OFF}\n" "$*"; }
warn(){ printf "${C_YELLOW}[WARN]  %s${C_OFF}\n" "$*"; }
err(){  printf "${C_RED}[ERROR] %s${C_OFF}\n" "$*" 1>&2; }

cmd_exists(){ command -v "$1" >/dev/null 2>&1; }

FAIL=0
fail(){ err "$*"; FAIL=$((FAIL+1)); }

# -----------------------------------------------------------------
# 0. Target validation
# -----------------------------------------------------------------
info "===== Step 0/4: Target project ====="
if [ ! -d "$TARGET_PATH" ]; then
    fail "Target path does not exist or is not a directory: $TARGET_PATH"
    exit 1
fi
TARGET_PATH="$(cd "$TARGET_PATH" && pwd -P)"
info "Target project path: $TARGET_PATH"

pushd "$TARGET_PATH" >/dev/null
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    fail "Target path is not a git repository: $TARGET_PATH"
else
    ok "Git repository initialized."
fi
REMOTES="$(git remote -v 2>/dev/null || true)"
if [ -z "$REMOTES" ]; then
    fail "Target repository has no remote configured."
elif ! grep -q "github\.com" <<<"$REMOTES"; then
    fail "Target repository remote does not point to github.com."
else
    ok "GitHub remote configured."
fi
popd >/dev/null

# -----------------------------------------------------------------
# 1. Prerequisite CLIs
# -----------------------------------------------------------------
info "===== Step 1/4: Prerequisite CLIs ====="
for c in git node uv gh claude ruflo; do
    if cmd_exists "$c"; then
        ok "$c ready: $(command -v "$c")"
    else
        fail "$c not installed."
    fi
done

if cmd_exists node; then
    NODE_MAJOR="$(node --version | sed 's/^v//' | cut -d. -f1)"
    if [ "$NODE_MAJOR" -lt 18 ]; then
        fail "Node.js version too low (v$NODE_MAJOR); requires >= 18."
    else
        ok "Node.js version OK (v$NODE_MAJOR)."
    fi
fi

if cmd_exists gh; then
    if ! gh auth status >/dev/null 2>&1; then
        fail "GitHub CLI not logged in (run: gh auth login)."
    else
        ok "GitHub CLI logged in."
    fi
fi

# -----------------------------------------------------------------
# 2. MCP servers
# -----------------------------------------------------------------
info "===== Step 2/4: MCP servers ====="
if cmd_exists claude; then
    FINAL_MCP="$(claude mcp list 2>&1 || true)"
    for name in memory context7 playwright; do
        if grep -q "$name" <<<"$FINAL_MCP"; then
            ok "MCP $name registered."
        else
            fail "MCP $name not registered (run: claude mcp add $name -- npx -y <pkg>)."
        fi
    done
else
    fail "claude CLI missing; cannot verify MCP."
fi

# -----------------------------------------------------------------
# 3. Skills + companion files
# -----------------------------------------------------------------
info "===== Step 3/4: Skills and companion files ====="
EXPECTED_SKILLS=(
    tunan-req tunan-prd tunan-story tunan-plan tunan-testplan tunan-pr
    tunan-dev tunan-tdd tunan-review tunan-test
    tunan-pr-resolve tunan-merge tunan-verify
    tunan-triage tunan-diagnose tunan-retro tunan-improve-arch
    tunan-grill tunan-align tunan-takeover tunan-parallel-pick tunan-pipeline
    tunan-story-graph
    tunan-prime tunan-cp
)
# Skills 可装在 project-local 或 user-global，任一存在即可（claude 会合并加载）。
SKILL_ROOT_LABELS=(project user)
SKILL_ROOT_PATHS=("$TARGET_PATH/.claude/skills" "$HOME/.claude/skills")
PRESENT_ROOTS=()
for i in 0 1; do
    [ -d "${SKILL_ROOT_PATHS[$i]}" ] && PRESENT_ROOTS+=("$i")
done
if [ ${#PRESENT_ROOTS[@]} -eq 0 ]; then
    warn ".claude/skills/ not found in project (${SKILL_ROOT_PATHS[0]}) nor user-global (${SKILL_ROOT_PATHS[1]}); install at one of them."
else
    for i in "${PRESENT_ROOTS[@]}"; do
        ok "skills root present (${SKILL_ROOT_LABELS[$i]}): ${SKILL_ROOT_PATHS[$i]}"
    done
    MISSING_SKILLS=()
    for s in "${EXPECTED_SKILLS[@]}"; do
        found=0
        for i in "${PRESENT_ROOTS[@]}"; do
            if [ -f "${SKILL_ROOT_PATHS[$i]}/$s/SKILL.md" ]; then
                found=1; break
            fi
        done
        [ $found -eq 0 ] && MISSING_SKILLS+=("$s")
    done
    if [ ${#MISSING_SKILLS[@]} -gt 0 ]; then
        warn "Missing skills not found in any root (${#MISSING_SKILLS[@]}): ${MISSING_SKILLS[*]}"
    else
        ok "All ${#EXPECTED_SKILLS[@]} tunan-* skills resolvable (project / user)."
    fi
fi

for f in USER.md tutorials; do
    if [ -e "$TARGET_PATH/$f" ]; then
        ok "$f present."
    else
        fail "$f missing in target root."
    fi
done

# -----------------------------------------------------------------
# 4. Workspace directories
# -----------------------------------------------------------------
info "===== Step 4/4: Workspace directories ====="
WORKSPACE_ROOT="$TARGET_PATH/.tunan-workspace"
if [ ! -d "$WORKSPACE_ROOT" ]; then
    fail ".tunan-workspace/ missing."
else
    ok ".tunan-workspace/ present."
    for d in worktrees retro raws sprints; do
        if [ -d "$WORKSPACE_ROOT/$d" ]; then
            ok ".tunan-workspace/$d present."
        else
            fail ".tunan-workspace/$d missing."
        fi
    done

    if [ -f "$WORKSPACE_ROOT/worktrees/.gitignore" ]; then
        ok ".tunan-workspace/worktrees/.gitignore present."
    else
        fail ".tunan-workspace/worktrees/.gitignore missing (worktree contents must be gitignored)."
    fi

    SETTINGS="$WORKSPACE_ROOT/settings.md"
    if [ ! -f "$SETTINGS" ]; then
        fail ".tunan-workspace/settings.md missing (defines current_sprint)."
    else
        CURRENT_SPRINT="$(grep -E '^current_sprint:[[:space:]]*' "$SETTINGS" | head -n1 | sed -E 's/^current_sprint:[[:space:]]*([^[:space:]]+).*/\1/')"
        if [ -z "$CURRENT_SPRINT" ]; then
            fail ".tunan-workspace/settings.md has no current_sprint field."
        else
            ok "settings.md current_sprint: $CURRENT_SPRINT"
            if [ -d "$WORKSPACE_ROOT/sprints/$CURRENT_SPRINT/reqs" ]; then
                ok ".tunan-workspace/sprints/$CURRENT_SPRINT/reqs/ present."
            else
                fail ".tunan-workspace/sprints/$CURRENT_SPRINT/reqs/ missing (current sprint pool root)."
            fi
            if [ -d "$WORKSPACE_ROOT/raws/$CURRENT_SPRINT" ]; then
                ok ".tunan-workspace/raws/$CURRENT_SPRINT/ present."
            else
                fail ".tunan-workspace/raws/$CURRENT_SPRINT/ missing (raw-req inbox for current sprint; mirror of sprints/<current>/reqs/)."
            fi
        fi
    fi
fi

# -----------------------------------------------------------------
# Summary
# -----------------------------------------------------------------
echo
if [ "$FAIL" -gt 0 ]; then
    printf "${C_RED}================================================================${C_OFF}\n"
    err "$FAIL check(s) failed. Run install.sh to fix."
    printf "${C_RED}================================================================${C_OFF}\n"
    exit 1
else
    printf "${C_GREEN}================================================================${C_OFF}\n"
    ok "All checks passed."
    printf "${C_GREEN}================================================================${C_OFF}\n"
fi
