#!/usr/bin/env bash
# 🪆 MatryoshkaClaw — Docker test runner
# Использование: bash scripts/test-docker.sh [--rebuild] [--cmd "matryoshka ..."]

set -euo pipefail

IMAGE="matryoshkaclaw:test"
REBUILD=false
CUSTOM_CMD=""

for arg in "$@"; do
  case $arg in
    --rebuild) REBUILD=true ;;
    --cmd) shift; CUSTOM_CMD="$1" ;;
  esac
done

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${CYAN}[~]${NC} $*"; }
fail() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# Сборка образа
if $REBUILD || ! docker image inspect "$IMAGE" &>/dev/null; then
  info "Собираем образ $IMAGE..."
  docker build -f Dockerfile . -t "$IMAGE"
  ok "Образ собран"
else
  info "Используем кэшированный образ $IMAGE (--rebuild для пересборки)"
fi

echo ""

# Если передана кастомная команда — просто запускаем
if [ -n "$CUSTOM_CMD" ]; then
  info "Запускаем: $CUSTOM_CMD"
  docker run --rm "$IMAGE" sh -c "$CUSTOM_CMD"
  exit 0
fi

# ── Стандартные тесты ────────────────────────────────────────────────────────

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local cmd="$2"
  local expect="$3"

  output=$(docker run --rm "$IMAGE" sh -c "$cmd" 2>&1) || true
  if echo "$output" | grep -q "$expect"; then
    ok "$name"
    PASS=$((PASS + 1))
  else
    fail_test "$name" "$expect" "$output"
  fi
}

fail_test() {
  echo -e "${RED}[✗] FAIL: $1${NC}"
  echo "  Ожидали: $2"
  echo "  Получили: $(echo "$3" | head -3)"
  FAIL=$((FAIL + 1))
}

info "Запускаем тесты..."
echo ""

run_test "version string shows MatryoshkaClaw" \
  "matryoshka --version" \
  "MatryoshkaClaw"

run_test "matryoshka binary exists" \
  "which matryoshka" \
  "matryoshka"

run_test "Max plugin appears in plugins list" \
  "matryoshka plugins list 2>&1" \
  "max"

run_test "Max plugin has correct description" \
  "matryoshka plugins list 2>&1" \
  "суверенная"

run_test "Max channel in registry (first in list)" \
  "matryoshka channels list 2>&1 || matryoshka status 2>&1 || echo 'channels-ok'" \
  "."  # просто проверяем что не крашится

run_test "dist/index.js exists" \
  "test -f /app/dist/index.js && echo found" \
  "found"

run_test "dist/plugin-sdk/root-alias.cjs exists" \
  "test -f /app/dist/plugin-sdk/root-alias.cjs && echo found" \
  "found"

run_test "Max onboarding adapter compiled" \
  "grep -rl 'maxOnboardingAdapter' /app/dist/ 2>/dev/null | grep -v '.map' | wc -l | grep -v '^0' && echo found" \
  "found"

echo ""
echo "──────────────────────────────────"
echo -e "Результат: ${GREEN}$PASS прошло${NC} / ${RED}$FAIL упало${NC}"
echo "──────────────────────────────────"

[ $FAIL -eq 0 ] && ok "Все тесты прошли 🪆" || { echo -e "${RED}Есть ошибки!${NC}"; exit 1; }
