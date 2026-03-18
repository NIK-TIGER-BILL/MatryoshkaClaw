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
#   --dir <path>   Директория для клонирования (по умолчанию: ~/MatryoshkaClaw)
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
INSTALL_DIR="$DEFAULT_DIR"

for arg in "$@"; do
  case $arg in
    --no-onboard) NO_ONBOARD=true ;;
    --dir) shift; INSTALL_DIR="$1" ;;
    --help|-h)
      echo "Использование: install.sh [--no-onboard] [--dir <path>]"
      exit 0
      ;;
  esac
done

# ─── Утилиты ────────────────────────────────────────────────
info()    { echo -e "${CYAN}[матрёшка]${NC} $*"; }
success() { echo -e "${GREEN}[✓]${NC} $*"; }
warn()    { echo -e "${YELLOW}[!]${NC} $*"; }
error()   { echo -e "${RED}[✗]${NC} $*"; exit 1; }

banner() {
  echo ""
  echo -e "${BOLD}${BLUE}"
  echo "  ██████╗ ███████╗██╗  ██╗"
  echo "  ██╔══██╗██╔════╝╚██╗██╔╝"
  echo "  ██████╔╝█████╗   ╚███╔╝ "
  echo "  ██╔══██╗██╔══╝   ██╔██╗ "
  echo "  ██║  ██║███████╗██╔╝ ██╗"
  echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝"
  echo -e "${NC}"
  echo -e "${BOLD}  🪆 MatryoshkaClaw${NC} — Российская платформа автономных AI-агентов"
  echo -e "  Импортозамещение ChatGPT одобрено Министерством Цифрового Развития${YELLOW}*${NC}"
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

# ─── Node.js ────────────────────────────────────────────────
check_node() {
  if command -v node &>/dev/null; then
    NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [ "$NODE_MAJOR" -ge "$REQUIRED_NODE_MAJOR" ]; then
      success "Node.js $(node --version) найден"
      return
    else
      warn "Node.js $(node --version) — слишком старый. Нужен $REQUIRED_NODE_MAJOR+"
    fi
  else
    warn "Node.js не найден"
  fi

  info "Устанавливаем Node.js $REQUIRED_NODE_MAJOR..."
  if [ "$OS" = "macos" ]; then
    if command -v brew &>/dev/null; then
      brew install node@$REQUIRED_NODE_MAJOR
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
      error "Не удалось определить пакетный менеджер. Установи Node.js $REQUIRED_NODE_MAJOR+ вручную: https://nodejs.org"
    fi
  fi

  NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])" 2>/dev/null || echo "0")
  if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    error "Не удалось установить Node.js $REQUIRED_NODE_MAJOR+"
  fi
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

# ─── Git ────────────────────────────────────────────────────
check_git() {
  if command -v git &>/dev/null; then
    success "git $(git --version | awk '{print $3}') найден"
    return
  fi
  info "Устанавливаем git..."
  if [ "$OS" = "macos" ]; then
    xcode-select --install 2>/dev/null || brew install git
  elif [ "$OS" = "linux" ]; then
    if command -v apt-get &>/dev/null; then
      sudo apt-get install -y git
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y git
    fi
  fi
  command -v git &>/dev/null || error "Не удалось установить git. Установи вручную."
  success "git установлен"
}

# ─── Клонирование / обновление ──────────────────────────────
clone_or_update() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Найден существующий репозиторий в $INSTALL_DIR — обновляем..."
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
  info "Устанавливаем зависимости..."
  pnpm install --frozen-lockfile --prefer-offline 2>/dev/null \
    || pnpm install

  info "Собираем UI..."
  pnpm ui:build

  info "Собираем проект..."
  pnpm build

  success "Сборка завершена"
}

# ─── Линковка ───────────────────────────────────────────────
link_binary() {
  info "Настраиваем pnpm global bin dir..."

  # Запускаем pnpm setup если PNPM_HOME не задан
  if [ -z "${PNPM_HOME:-}" ]; then
    pnpm setup --force 2>/dev/null || true
    # Подхватываем PNPM_HOME из shell rc файлов
    PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
    export PNPM_HOME
  fi

  # Добавляем PNPM_HOME в PATH текущей сессии
  if [[ ":$PATH:" != *":$PNPM_HOME:"* ]]; then
    export PATH="$PNPM_HOME:$PATH"
  fi

  info "Делаем команду 'matryoshka' глобальной..."
  pnpm link --global
  success "Команда 'matryoshka' доступна глобально"

  # Проверяем что команда найдена
  if ! command -v matryoshka &>/dev/null; then
    warn "Команда 'matryoshka' не найдена в PATH текущей сессии."
    warn "Добавь в ~/.bashrc или ~/.zshrc:"
    echo ""
    echo "    export PNPM_HOME=\"$PNPM_HOME\""
    echo "    export PATH=\"\$PNPM_HOME:\$PATH\""
    echo ""
    warn "Затем выполни: source ~/.bashrc (или ~/.zshrc)"
  fi
}

# ─── Онбординг ──────────────────────────────────────────────
run_onboard() {
  if [ "$NO_ONBOARD" = true ]; then
    info "Онбординг пропущен (--no-onboard)"
    return
  fi

  echo ""
  info "Запускаем онбординг..."
  matryoshka onboard --install-daemon
}

# ─── Итог ───────────────────────────────────────────────────
print_success() {
  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║   🪆 MatryoshkaClaw успешно установлен!         ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Полезные команды:${NC}"
  echo -e "  ${CYAN}matryoshka gateway start${NC}   — запустить агента"
  echo -e "  ${CYAN}matryoshka status${NC}          — статус системы"
  echo -e "  ${CYAN}matryoshka doctor${NC}          — диагностика"
  echo -e "  ${CYAN}matryoshka dashboard${NC}       — открыть веб-интерфейс"
  echo ""
  echo -e "  ${BOLD}Документация:${NC} https://github.com/NIK-TIGER-BILL/MatryoshkaClaw"
  echo -e "  ${BOLD}Max интеграция:${NC} создай бота на https://max.ru/MasterBot"
  echo ""
  echo -e "  ${YELLOW}* Сделано с 🪆 и изрядной долей иронии в России${NC}"
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
  cd "$INSTALL_DIR"
  build
  link_binary
  run_onboard
  print_success
}

main "$@"
