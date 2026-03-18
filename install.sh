#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║          🪆 MatryoshkaClaw Installer                    ║
# ║   Российская платформа автономных AI-агентов            ║
# ║   Импортозамещение одобрено. ChatGPT нервно курит.      ║
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
BOLD='\033[1m'
NC='\033[0m'

# ─── Конфигурация ───────────────────────────────────────────
REPO_URL="https://github.com/NIK-TIGER-BILL/MatryoshkaClaw.git"
DEFAULT_DIR="$HOME/MatryoshkaClaw"
REQUIRED_NODE_MAJOR=22

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

# ─── Утилиты ────────────────────────────────────────────────
info()    { echo -e "${CYAN}[матрёшка]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*" >&2; exit 1; }

banner() {
  echo ""
  echo -e "${RED}"
  echo "                 .--."
  echo "               .'_\/_'."
  echo "               '. /\ .'"
  echo "                '.\/'."
  echo -e "${YELLOW}"
  echo "              .------."
  echo "             /  .--. |"
  echo "            /  / () \|"
  echo "            |  \  --'|"
  echo "             \  '--' /"
  echo -e "${RED}"
  echo "          .------------."
  echo "         / .'        '. \\"
  echo "        / / .--------. \ \\"
  echo "       / /  |  o    o |  \ \\"
  echo "       \ \  |  ------  |  / /"
  echo "        \ \ '.________.' / /"
  echo "         '.____________.'"
  echo -e "${NC}"
  echo -e "  ${BOLD}🪆 MatryoshkaClaw${NC} — Российская платформа автономных AI-агентов"
  echo -e "  Импортозамещение ChatGPT одобрено Минцифры${YELLOW}*${NC}"
  echo ""
  echo -e "  ${YELLOW}* Минцифры о нас пока не знает, но мы уверены что одобрит${NC}"
  echo ""
}

# ─── Проверка ОС ────────────────────────────────────────────
check_os() {
  case "$(uname -s)" in
    Linux*)  OS="linux" ;;
    Darwin*) OS="macos" ;;
    CYGWIN*|MINGW*|MSYS*) error "Windows не поддерживается напрямую. Используй WSL2." ;;
    *) error "Неизвестная ОС: $(uname -s)" ;;
  esac
  info "ОС: $OS"
}

# ─── Git ────────────────────────────────────────────────────
check_git() {
  if command -v git &>/dev/null; then
    success "git $(git --version | awk '{print $3}') найден"
    return
  fi
  info "Устанавливаем git..."
  if [ "$OS" = "macos" ]; then
    xcode-select --install 2>/dev/null || true
  elif [ "$OS" = "linux" ]; then
    if command -v apt-get &>/dev/null; then sudo apt-get install -y git
    elif command -v dnf &>/dev/null; then sudo dnf install -y git
    elif command -v yum &>/dev/null; then sudo yum install -y git
    fi
  fi
  command -v git &>/dev/null || error "Не удалось установить git. Установи вручную: https://git-scm.com"
  success "git установлен"
}

# ─── Node.js ────────────────────────────────────────────────
check_node() {
  if command -v node &>/dev/null; then
    NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]; then
      success "Node.js $(node --version) найден"
      return
    fi
    warn "Node.js $(node --version) слишком старый, нужен $REQUIRED_NODE_MAJOR+"
  else
    warn "Node.js не найден"
  fi

  info "Устанавливаем Node.js $REQUIRED_NODE_MAJOR..."
  if [ "$OS" = "macos" ]; then
    if command -v brew &>/dev/null; then
      brew install node@$REQUIRED_NODE_MAJOR
      brew link --overwrite node@$REQUIRED_NODE_MAJOR
    else
      error "Homebrew не найден. Установи Node.js $REQUIRED_NODE_MAJOR+ вручную: https://nodejs.org"
    fi
  elif [ "$OS" = "linux" ]; then
    if command -v apt-get &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif command -v dnf &>/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x | sudo bash -
      sudo dnf install -y nodejs
    elif command -v yum &>/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_${REQUIRED_NODE_MAJOR}.x | sudo bash -
      sudo yum install -y nodejs
    else
      error "Не удалось определить пакетный менеджер. Установи Node.js $REQUIRED_NODE_MAJOR+: https://nodejs.org"
    fi
  fi

  NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])" 2>/dev/null || echo "0")
  [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ] || error "Не удалось установить Node.js $REQUIRED_NODE_MAJOR+"
  success "Node.js $(node --version) установлен"
}

# ─── pnpm ───────────────────────────────────────────────────
check_pnpm() {
  if command -v pnpm &>/dev/null; then
    success "pnpm $(pnpm --version) найден"
    return
  fi
  info "Устанавливаем pnpm..."
  npm install -g pnpm
  success "pnpm установлен"
}

# ─── Клонирование / обновление ──────────────────────────────
clone_or_update() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Обновляем репозиторий в $INSTALL_DIR..."
    git -C "$INSTALL_DIR" pull --ff-only
    success "Репозиторий обновлён"
  else
    info "Клонируем MatryoshkaClaw в $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    success "Репозиторий клонирован"
  fi
}

# ─── Сборка ─────────────────────────────────────────────────
build() {
  cd "$INSTALL_DIR"

  info "Устанавливаем зависимости (pnpm install)..."
  CI=true SHARP_IGNORE_GLOBAL_LIBVIPS=1 pnpm install

  info "Собираем UI..."
  pnpm ui:build

  info "Собираем проект..."
  pnpm build

  success "Сборка завершена"
}

# ─── Глобальная установка через npm ─────────────────────────
install_globally() {
  info "Устанавливаем matryoshka глобально (npm install -g)..."

  # Если openclaw уже установлен (напр. через Homebrew) — удаляем старый бинарник
  NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
  for old_bin in openclaw; do
    if [ -f "$NPM_GLOBAL_BIN/$old_bin" ]; then
      info "Удаляем существующий $NPM_GLOBAL_BIN/$old_bin..."
      rm -f "$NPM_GLOBAL_BIN/$old_bin"
    fi
  done

  # Фикс для macOS с системным libvips; --force перезаписывает конфликтующие файлы
  SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g --force "$INSTALL_DIR"

  # Проверяем что команда появилась
  if command -v matryoshka &>/dev/null; then
    success "Команда 'matryoshka' установлена: $(command -v matryoshka)"
  else
    # PATH может не обновиться в текущей сессии — ищем сами
    NPM_BIN="$(npm prefix -g)/bin"
    if [ -f "$NPM_BIN/matryoshka" ]; then
      success "Установлено в $NPM_BIN/matryoshka"
      warn "Добавь в ~/.bashrc или ~/.zshrc:"
      echo ""
      echo "    export PATH=\"$NPM_BIN:\$PATH\""
      echo ""
      export PATH="$NPM_BIN:$PATH"
    else
      warn "Команда 'matryoshka' не найдена. Проверь PATH."
      warn "npm global bin: $NPM_BIN"
    fi
  fi
}

# ─── Онбординг ──────────────────────────────────────────────
run_onboard() {
  if [ "$NO_ONBOARD" = true ]; then
    info "Онбординг пропущен (--no-onboard)"
    return
  fi

  # Нужен TTY для онбординга
  if [ ! -t 0 ] && [ "$NO_PROMPT" = false ]; then
    warn "Нет TTY — онбординг пропущен. Запусти вручную: matryoshka onboard --install-daemon"
    return
  fi

  echo ""
  info "Запускаем онбординг..."
  matryoshka onboard --install-daemon
}

# ─── Итог ───────────────────────────────────────────────────
print_success() {
  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║   🪆 MatryoshkaClaw успешно установлен!              ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Полезные команды:${NC}"
  echo -e "  ${CYAN}matryoshka onboard --install-daemon${NC}   — первый запуск"
  echo -e "  ${CYAN}matryoshka gateway start${NC}              — запустить агента"
  echo -e "  ${CYAN}matryoshka status${NC}                     — статус системы"
  echo -e "  ${CYAN}matryoshka doctor${NC}                     — диагностика"
  echo ""
  echo -e "  ${BOLD}Max интеграция:${NC} https://max.ru/MasterBot"
  echo -e "  ${BOLD}GitHub:${NC} https://github.com/NIK-TIGER-BILL/MatryoshkaClaw"
  echo ""
  echo -e "  ${YELLOW}Сделано с 🪆 и изрядной долей иронии в России${NC}"
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
  run_onboard
  print_success
}

main "$@"
