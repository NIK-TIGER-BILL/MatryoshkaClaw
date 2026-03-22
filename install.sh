#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║          🪆 MatryoshkaClaw Installer                    ║
# ║   Российская платформа автономных AI-агентов            ║
# ║   Импортозамещение одобрено. OpenClaw нервно курит.     ║
# ╚══════════════════════════════════════════════════════════╝
#
# Использование:
#   curl -fsSL https://raw.githubusercontent.com/NIK-TIGER-BILL/MatryoshkaClaw/main/install.sh | bash
#
# Флаги:
#   --no-onboard   Пропустить онбординг
#   --no-prompt    Без интерактивных вопросов
#   --dir <path>   Директория установки (по умолчанию: ~/MatryoshkaClaw)
#   --help         Показать справку

set -euo pipefail

# ─── Цвета ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ─── Конфигурация ───────────────────────────────────────────
REPO_URL="https://github.com/NIK-TIGER-BILL/MatryoshkaClaw.git"
DEFAULT_DIR="$HOME/MatryoshkaClaw"
REQUIRED_NODE_MAJOR=22
LOG_FILE="/tmp/matryoshka-install-$(date +%s).log"
TOTAL_STEPS=7
CURRENT_STEP=0

# ─── Флаги ──────────────────────────────────────────────────
NO_ONBOARD=false
NO_PROMPT=false
INSTALL_DIR="$DEFAULT_DIR"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-onboard) NO_ONBOARD=true; shift ;;
    --no-prompt)  NO_PROMPT=true; shift ;;
    --dir)        INSTALL_DIR="$2"; shift 2 ;;
    --help|-h)
      echo "Использование: install.sh [--no-onboard] [--no-prompt] [--dir <path>]"
      exit 0
      ;;
    *) shift ;;
  esac
done

# ─── Мудрости бабушки ───────────────────────────────────────
WISDOMS=(
  "Семь раз отмери — один раз задеплой."
  "Не откладывай на завтра то, что можно заавтоматить сегодня."
  "Тише кодишь — дальше будешь."
  "Баг не волк — в продакшн убежит."
  "Без труда не вытащишь и рыбку из legacy-кода."
  "Один в поле не воин, а вот один агент внутри другого — это архитектура."
  "Кто рано встаёт, тому бот отвечает."
  "Работа не волк, а вот CI/CD — да."
  "В тихом Docker-е черти водятся."
  "Код к коду — получается монолит."
)

# ─── Утилиты ────────────────────────────────────────────────
matryoshkas() {
  local n=$1
  local result=""
  for ((i=0; i<n; i++)); do
    result+="🪆"
  done
  echo "$result"
}

step_start() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  local dolls
  dolls=$(matryoshkas "$CURRENT_STEP")
  echo -ne "\n${BOLD}${dolls} [${CURRENT_STEP}/${TOTAL_STEPS}]${NC} $1"
}

step_ok() {
  echo -e "  ${GREEN}✓${NC} $1"
  if [ -n "${2:-}" ]; then
    echo -e "  ${DIM}  └─ $2${NC}"
  fi
}

step_fail() {
  echo -e "  ${RED}✗${NC} $1"
  if [ -s "$LOG_FILE" ]; then
    echo ""
    echo -e "  ${RED}Последние строки лога:${NC}"
    tail -20 "$LOG_FILE" | sed 's/^/  │ /'
    echo -e "  ${DIM}Полный лог: ${LOG_FILE}${NC}"
  fi
  exit 1
}

warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
}

# Спиннер для долгих операций
# Использование: run_with_spinner "Сообщение" "Фраза-подсказка" command args...
run_with_spinner() {
  local msg="$1"
  local hint="$2"
  shift 2

  local spinner_chars='⣾⣽⣻⢿⡿⣟⣯⣷'
  local pid

  # Запускаем команду в фоне, весь вывод в лог
  "$@" >> "$LOG_FILE" 2>&1 &
  pid=$!

  local i=0
  local len=${#spinner_chars}

  # Анимация спиннера
  while kill -0 "$pid" 2>/dev/null; do
    local char="${spinner_chars:$((i % len)):1}"
    printf "\r  ${CYAN}%s${NC} %s ${DIM}(%s)${NC}  " "$char" "$msg" "$hint"
    i=$((i + 1))
    sleep 0.1
  done

  # Очищаем строку спиннера
  printf "\r\033[K"

  # Проверяем результат
  wait "$pid"
  return $?
}

banner() {
  clear 2>/dev/null || true
  echo ""
  echo -e "  ${BOLD}🪆 MatryoshkaClaw Installer${NC}"
  echo -e "  ${DIM}Российская платформа автономных AI-агентов${NC}"
  echo -e "  ${DIM}Импортозамещение одобрено Минцифры${YELLOW}*${NC}"
  echo ""
  echo -e "  ${DIM}Лог установки: ${LOG_FILE}${NC}"
  echo ""
}

# ─── Проверка ОС ────────────────────────────────────────────
check_os() {
  step_start "Проверяем операционную систему..."
  case "$(uname -s)" in
    Linux*)
      OS="linux"
      step_ok "Linux" "Одобрено. Пингвины — наши друзья"
      ;;
    Darwin*)
      OS="macos"
      step_ok "macOS" "Яблочная техника — тоже импортная, но красивая"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      step_fail "Windows не поддерживается. Используй WSL2 — это почти Linux, но с грустью"
      ;;
    *)
      step_fail "Неизвестная ОС: $(uname -s). Мы такое ещё не импортозаместили"
      ;;
  esac
}

# ─── Git ────────────────────────────────────────────────────
check_git() {
  step_start "Ищем git..."
  if command -v git &>/dev/null; then
    step_ok "git $(git --version | awk '{print $3}')" "Версионирование одобрено партией"
    return
  fi
  warn "git не найден, устанавливаем..."
  if [ "$OS" = "macos" ]; then
    xcode-select --install 2>/dev/null || true
  elif [ "$OS" = "linux" ]; then
    if command -v apt-get &>/dev/null; then sudo apt-get install -y git >> "$LOG_FILE" 2>&1
    elif command -v dnf &>/dev/null; then sudo dnf install -y git >> "$LOG_FILE" 2>&1
    elif command -v yum &>/dev/null; then sudo yum install -y git >> "$LOG_FILE" 2>&1
    fi
  fi
  command -v git &>/dev/null || step_fail "Не удалось установить git. Установи вручную: https://git-scm.com"
  step_ok "git установлен" "Лучше поздно, чем через FTP"
}

# ─── Node.js ────────────────────────────────────────────────
check_node() {
  step_start "Ищем Node.js ${REQUIRED_NODE_MAJOR}+..."
  if command -v node &>/dev/null; then
    NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]; then
      step_ok "Node.js $(node --version)" "JavaScript — тоже импортный, но мы закрываем глаза"
      return
    fi
    warn "Node.js $(node --version) слишком старый"
  fi

  echo ""
  warn "Устанавливаем Node.js ${REQUIRED_NODE_MAJOR}..."

  if [ "$OS" = "macos" ]; then
    if command -v brew &>/dev/null; then
      run_with_spinner "Устанавливаем Node.js через Homebrew" "варим кофе..." \
        brew install "node@$REQUIRED_NODE_MAJOR" || true
      brew link --overwrite "node@$REQUIRED_NODE_MAJOR" >> "$LOG_FILE" 2>&1 || true
    else
      step_fail "Homebrew не найден. Установи Node.js ${REQUIRED_NODE_MAJOR}+ вручную: https://nodejs.org"
    fi
  elif [ "$OS" = "linux" ]; then
    if command -v apt-get &>/dev/null; then
      curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo -E bash - >> "$LOG_FILE" 2>&1
      run_with_spinner "Устанавливаем Node.js" "ставим ноду..." \
        sudo apt-get install -y nodejs
    elif command -v dnf &>/dev/null; then
      curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo bash - >> "$LOG_FILE" 2>&1
      run_with_spinner "Устанавливаем Node.js" "ставим ноду..." \
        sudo dnf install -y nodejs
    elif command -v yum &>/dev/null; then
      curl -fsSL "https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x" | sudo bash - >> "$LOG_FILE" 2>&1
      run_with_spinner "Устанавливаем Node.js" "ставим ноду..." \
        sudo yum install -y nodejs
    else
      step_fail "Не удалось определить пакетный менеджер. Установи Node.js ${REQUIRED_NODE_MAJOR}+: https://nodejs.org"
    fi
  fi

  NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])" 2>/dev/null || echo "0")
  [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ] || step_fail "Не удалось установить Node.js ${REQUIRED_NODE_MAJOR}+"
  step_ok "Node.js $(node --version) установлен" "Нода доставлена. Сопротивление бесполезно"
}

# ─── pnpm ───────────────────────────────────────────────────
check_pnpm() {
  step_start "Ищем pnpm..."
  if command -v pnpm &>/dev/null; then
    step_ok "pnpm $(pnpm --version)" "Менеджер пакетов найден. Менеджер среднего звена — нет"
    return
  fi
  warn "Устанавливаем pnpm..."
  run_with_spinner "Устанавливаем pnpm" "ещё один менеджер..." \
    npm install -g pnpm || step_fail "Не удалось установить pnpm"
  step_ok "pnpm установлен" "Теперь у нас два менеджера. Как в любой организации"
}

# ─── Клонирование / обновление ──────────────────────────────
clone_or_update() {
  step_start "Доставляем исходный код..."
  if [ -d "$INSTALL_DIR/.git" ]; then
    git -C "$INSTALL_DIR" pull --ff-only >> "$LOG_FILE" 2>&1 || step_fail "Не удалось обновить репозиторий"
    step_ok "Репозиторий обновлён" "Свежий код прямо с GitHub. Голубиная почта отдыхает"
  else
    echo ""
    echo -e "  ${DIM}Клонируем репозиторий...${NC}"
    git clone --depth 1 --progress "$REPO_URL" "$INSTALL_DIR" 2>&1 || step_fail "Не удалось клонировать репозиторий"
    step_ok "Склонировано в $INSTALL_DIR" "Исходный код доставлен. Санкции не помеха"
  fi
}

# ─── Сборка ─────────────────────────────────────────────────
build() {
  step_start "Собираем проект..."
  cd "$INSTALL_DIR"

  echo ""
  run_with_spinner "Устанавливаем зависимости" "это как совещание — долго и непонятно зачем" \
    env CI=true SHARP_IGNORE_GLOBAL_LIBVIPS=1 pnpm install || step_fail "pnpm install провалился"

  run_with_spinner "Собираем UI" "рисуем кнопочки..." \
    pnpm ui:build || step_fail "Сборка UI провалилась"

  # В Docker/CI используем build:docker — экономит память
  if [ -f "/.dockerenv" ] || [ -n "${CI:-}" ] || [ -n "${DOCKER_BUILD:-}" ]; then
    run_with_spinner "Собираем проект" "Раджеш старается..." \
      env NODE_OPTIONS="--max-old-space-size=3072" OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build:docker \
      || step_fail "Сборка провалилась"
  else
    run_with_spinner "Собираем проект" "Раджеш старается..." \
      env NODE_OPTIONS="--max-old-space-size=3072" pnpm build \
      || step_fail "Сборка провалилась"
  fi

  step_ok "Проект собран" "Раджеш не пострадал. Вроде бы"
}

# ─── Глобальная установка через npm ─────────────────────────
install_globally() {
  step_start "Устанавливаем matryoshka глобально..."

  # Удаляем старый бинарник если есть
  NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
  for old_bin in openclaw; do
    if [ -f "$NPM_GLOBAL_BIN/$old_bin" ]; then
      rm -f "$NPM_GLOBAL_BIN/$old_bin"
    fi
  done

  run_with_spinner "Глобальная установка" "почти как получение загранпаспорта..." \
    env SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g --force "$INSTALL_DIR" \
    || step_fail "npm install -g провалился"

  # Проверяем что команда появилась
  if command -v matryoshka &>/dev/null; then
    step_ok "matryoshka установлена: $(command -v matryoshka)" "Агент в глубоком прикрытии. В вашем PATH"
  else
    NPM_BIN="$(npm prefix -g)/bin"
    if [ -f "$NPM_BIN/matryoshka" ]; then
      step_ok "Установлено в $NPM_BIN/matryoshka"
      warn "Добавь в ~/.bashrc или ~/.zshrc:"
      echo -e "    ${CYAN}export PATH=\"$NPM_BIN:\$PATH\"${NC}"
      export PATH="$NPM_BIN:$PATH"
    else
      step_fail "Команда 'matryoshka' не найдена. PATH в шоке"
    fi
  fi
}

# ─── Онбординг ──────────────────────────────────────────────
run_onboard() {
  if [ "$NO_ONBOARD" = true ]; then
    return
  fi

  # Нужен TTY для онбординга
  if [ ! -t 0 ] && [ "$NO_PROMPT" = false ]; then
    warn "Нет TTY — онбординг пропущен. Запусти вручную: matryoshka onboard --install-daemon"
    return
  fi

  echo ""
  echo -e "  ${BOLD}Запускаем онбординг...${NC}"
  echo ""
  matryoshka onboard --install-daemon
}

# ─── Итог ───────────────────────────────────────────────────
print_success() {
  local wisdom_idx=$((RANDOM % ${#WISDOMS[@]}))
  local wisdom="${WISDOMS[$wisdom_idx]}"

  echo ""
  echo ""
  echo -e "${GREEN}${BOLD}  ╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}  ║          🪆 MatryoshkaClaw успешно установлен!           ║${NC}"
  echo -e "${GREEN}${BOLD}  ╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  💬 ${YELLOW}«${wisdom}»${NC}"
  echo ""
  echo -e "  ${BOLD}Полезные команды:${NC}"
  echo -e "    ${CYAN}matryoshka onboard${NC}    — первый запуск (начните с Max, это патриотично)"
  echo -e "    ${CYAN}matryoshka gateway${NC}    — запустить агента"
  echo -e "    ${CYAN}matryoshka status${NC}     — статус системы"
  echo -e "    ${CYAN}matryoshka doctor${NC}     — диагностика"
  echo -e "    ${CYAN}matryoshka babushka${NC}   — мудрость (+10 XP)"
  echo ""
  echo -e "  ${BOLD}Ссылки:${NC}"
  echo -e "    🌐 ${BLUE}https://matryoshkaclaw.ru${NC}"
  echo -e "    📱 ${BLUE}https://t.me/MatryoshkaClaw${NC}"
  echo -e "    📦 ${BLUE}https://github.com/NIK-TIGER-BILL/MatryoshkaClaw${NC}"
  echo ""
  echo -e "  ${DIM}Сделано с 🪆 и изрядной долей иронии в России${NC}"
  echo -e "  ${DIM}* Минцифры о нас пока не знает, но мы уверены что одобрит${NC}"
  echo ""
}

# ─── Главный поток ──────────────────────────────────────────
main() {
  banner
  check_os
  check_git
  check_node
  check_pnpm
  clone_or_update
  build
  install_globally
  print_success
  run_onboard
}

main "$@"
